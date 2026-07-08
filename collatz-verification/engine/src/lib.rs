//! Collatz Conjecture Verification Engine
//! Parallel trajectory search with WORM ledger integration

use sha2::{Sha256, Digest};
use serde::{Deserialize, Serialize};
use rayon::prelude::*;
use wasm_bindgen::prelude::*;

/// A single step in a Collatz trajectory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrajectoryStep {
    pub n: u64,
    pub step: u64,
    pub seal: String,
}

/// Complete trajectory from n to 1
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trajectory {
    pub start: u64,
    pub steps: Vec<TrajectoryStep>,
    pub length: u64,
    pub max_value: u64,
    pub final_seal: String,
}

/// WORM ledger entry for immutable audit trail
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WormEntry {
    pub trajectory_hash: String,
    pub start_value: u64,
    pub length: u64,
    pub timestamp: u64,
    pub merkle_proof: String,
}

/// Compute single Collatz step
#[inline]
pub fn collatz_step(n: u64) -> u64 {
    if n % 2 == 0 {
        n / 2
    } else {
        n.checked_mul(3).and_then(|x| x.checked_add(1)).unwrap_or(0)
    }
}

/// Generate SHA-256 seal for a trajectory step
fn seal_step(n: u64, step: u64) -> String {
    let mut hasher = Sha256::new();
    hasher.update(format!("{}:{}", step, n).as_bytes());
    format!("{:x}", hasher.finalize())[..16].to_string()
}

/// Compute full trajectory from n to 1
pub fn compute_trajectory(start: u64) -> Option<Trajectory> {
    if start == 0 {
        return None;
    }
    
    let mut steps = Vec::new();
    let mut n = start;
    let mut step = 0;
    let mut max_value = start;
    
    while n != 1 {
        let seal = seal_step(n, step);
        steps.push(TrajectoryStep { n, step, seal });
        
        n = collatz_step(n);
        if n == 0 {
            return None; // Overflow detected
        }
        
        max_value = max_value.max(n);
        step += 1;
        
        // Safety limit to prevent infinite loops
        if step > 10_000_000 {
            return None;
        }
    }
    
    // Final step at 1
    let final_seal = seal_step(1, step);
    steps.push(TrajectoryStep { n: 1, step, seal: final_seal.clone() });
    
    Some(Trajectory {
        start,
        steps,
        length: step + 1,
        max_value,
        final_seal,
    })
}

/// Parallel search across range [start, end)
pub fn parallel_search(start: u64, end: u64) -> Vec<Trajectory> {
    (start..end)
        .into_par_iter()
        .filter_map(compute_trajectory)
        .collect()
}

/// Find trajectory with maximum length in range
pub fn find_max_length(start: u64, end: u64) -> Option<Trajectory> {
    (start..end)
        .into_par_iter()
        .filter_map(compute_trajectory)
        .max_by_key(|t| t.length)
}

/// Find trajectory with maximum value reached
pub fn find_max_value(start: u64, end: u64) -> Option<Trajectory> {
    (start..end)
        .into_par_iter()
        .filter_map(compute_trajectory)
        .max_by_key(|t| t.max_value)
}

/// Compute Merkle root from trajectory seals
pub fn compute_merkle_root(trajectories: &[Trajectory]) -> String {
    if trajectories.is_empty() {
        return "0".repeat(64);
    }
    
    let mut hashes: Vec<String> = trajectories
        .iter()
        .map(|t| {
            let mut hasher = Sha256::new();
            hasher.update(format!("{}:{}:{}", t.start, t.length, t.final_seal).as_bytes());
            format!("{:x}", hasher.finalize())
        })
        .collect();
    
    while hashes.len() > 1 {
        let mut next_level = Vec::new();
        for chunk in hashes.chunks(2) {
            let mut hasher = Sha256::new();
            if chunk.len() == 2 {
                hasher.update(format!("{}{}", chunk[0], chunk[1]).as_bytes());
            } else {
                hasher.update(format!("{}{}", chunk[0], chunk[0]).as_bytes());
            }
            next_level.push(format!("{:x}", hasher.finalize()));
        }
        hashes = next_level;
    }
    
    hashes[0].clone()
}

/// Seal trajectory to WORM ledger
pub fn seal_to_worm(trajectory: &Trajectory, merkle_root: &str) -> WormEntry {
    let mut hasher = Sha256::new();
    hasher.update(format!("{}:{}:{}", trajectory.start, trajectory.length, trajectory.final_seal).as_bytes());
    let trajectory_hash = format!("{:x}", hasher.finalize());
    
    WormEntry {
        trajectory_hash,
        start_value: trajectory.start,
        length: trajectory.length,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        merkle_proof: merkle_root[..32].to_string(),
    }
}

// WASM bindings for browser integration
#[wasm_bindgen]
pub fn compute_trajectory_wasm(start: u64) -> JsValue {
    let trajectory = compute_trajectory(start);
    serde_wasm_bindgen::to_value(&trajectory).unwrap_or(JsValue::NULL)
}

#[wasm_bindgen]
pub fn parallel_search_wasm(start: u64, end: u64) -> JsValue {
    let trajectories = parallel_search(start, end);
    serde_wasm_bindgen::to_value(&trajectories).unwrap_or(JsValue::NULL)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_collatz_step() {
        assert_eq!(collatz_step(6), 3);
        assert_eq!(collatz_step(3), 10);
        assert_eq!(collatz_step(10), 5);
        assert_eq!(collatz_step(5), 16);
    }
    
    #[test]
    fn test_trajectory_6() {
        let t = compute_trajectory(6).unwrap();
        assert_eq!(t.start, 6);
        assert_eq!(t.length, 9);
        assert_eq!(t.max_value, 16);
        assert_eq!(t.steps[0].n, 6);
        assert_eq!(t.steps.last().unwrap().n, 1);
    }
    
    #[test]
    fn test_trajectory_27() {
        let t = compute_trajectory(27).unwrap();
        assert_eq!(t.start, 27);
        assert_eq!(t.length, 112);
        assert_eq!(t.max_value, 9232);
    }
    
    #[test]
    fn test_parallel_search() {
        let trajectories = parallel_search(1, 100);
        assert_eq!(trajectories.len(), 99);
        assert!(trajectories.iter().all(|t| t.start >= 1 && t.start < 100));
    }
    
    #[test]
    fn test_merkle_root() {
        let trajectories = parallel_search(1, 10);
        let root = compute_merkle_root(&trajectories);
        assert_eq!(root.len(), 64);
        assert_ne!(root, "0".repeat(64));
    }
    
    #[test]
    fn test_worm_seal() {
        let t = compute_trajectory(6).unwrap();
        let root = "a".repeat(64);
        let entry = seal_to_worm(&t, &root);
        assert_eq!(entry.start_value, 6);
        assert_eq!(entry.length, 9);
        assert_eq!(entry.merkle_proof.len(), 32);
    }
}
