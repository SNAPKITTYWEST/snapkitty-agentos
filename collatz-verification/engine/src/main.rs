//! Collatz Conjecture Parallel Search CLI
//! Searches range [START, END) and seals results to WORM ledger

use collatz_engine::{parallel_search, compute_merkle_root, seal_to_worm};
use std::env;
use std::fs;
use std::io::Write;

fn main() {
    let args: Vec<String> = env::args().collect();
    
    let start: u64 = args.get(1).and_then(|s| s.parse().ok()).unwrap_or(1);
    let end: u64 = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(1000);
    
    println!("═══════════════════════════════════════════════════════════");
    println!("  Collatz Conjecture Verification Engine");
    println!("═══════════════════════════════════════════════════════════");
    println!();
    println!("▶ Searching range [{}, {})", start, end);
    
    let trajectories = parallel_search(start, end);
    println!("✓ Found {} trajectories", trajectories.len());
    
    // Compute statistics
    let max_len = trajectories.iter().max_by_key(|t| t.length).unwrap();
    let max_val = trajectories.iter().max_by_key(|t| t.max_value).unwrap();
    
    println!();
    println!("Statistics:");
    println!("  Max length: {} (start={})", max_len.length, max_len.start);
    println!("  Max value:  {} (start={})", max_val.max_value, max_val.start);
    
    // Compute Merkle root
    let merkle_root = compute_merkle_root(&trajectories);
    println!();
    println!("Merkle root: {}", merkle_root);
    
    // Seal to WORM ledger
    println!();
    println!("▶ Sealing to WORM ledger...");
    
    let ledger_dir = "ledger";
    fs::create_dir_all(ledger_dir).unwrap();
    
    let mut ledger_file = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(format!("{}/collatz_worm.jsonl", ledger_dir))
        .unwrap();
    
    for trajectory in &trajectories {
        let entry = seal_to_worm(trajectory, &merkle_root);
        let json = serde_json::to_string(&entry).unwrap();
        writeln!(ledger_file, "{}", json).unwrap();
    }
    
    println!("✓ Sealed {} trajectories to WORM ledger", trajectories.len());
    
    // Save Merkle root
    fs::write(
        format!("{}/merkle_root.txt", ledger_dir),
        &merkle_root
    ).unwrap();
    
    println!();
    println!("═══════════════════════════════════════════════════════════");
    println!("  Verification complete");
    println!("═══════════════════════════════════════════════════════════");
}
