// Axum REST API for Collatz verification
// Exposes /verify, /search, /seal endpoints

use axum::{
    routing::{get, post},
    Json, Router,
    extract::Query,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use collatz_engine::{compute_trajectory, parallel_search, compute_merkle_root, seal_to_worm};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Deserialize)]
struct VerifyParams {
    n: u64,
}

#[derive(Serialize)]
struct VerifyResponse {
    start: u64,
    length: u64,
    max_value: u64,
    seal: String,
    verified: bool,
}

#[derive(Deserialize)]
struct SearchParams {
    start: u64,
    end: u64,
}

#[derive(Serialize)]
struct SearchResponse {
    count: usize,
    max_length: u64,
    max_value: u64,
    merkle_root: String,
}

#[derive(Serialize)]
struct SealResponse {
    trajectory_hash: String,
    merkle_proof: String,
    timestamp: u64,
}

struct AppState {
    ledger: Arc<Mutex<Vec<String>>>,
}

async fn verify_handler(
    Query(params): Query<VerifyParams>,
) -> Result<Json<VerifyResponse>, StatusCode> {
    let trajectory = compute_trajectory(params.n)
        .ok_or(StatusCode::BAD_REQUEST)?;
    
    Ok(Json(VerifyResponse {
        start: trajectory.start,
        length: trajectory.length,
        max_value: trajectory.max_value,
        seal: trajectory.final_seal.clone(),
        verified: true,
    }))
}

async fn search_handler(
    Query(params): Query<SearchParams>,
) -> Json<SearchResponse> {
    let trajectories = parallel_search(params.start, params.end);
    let merkle_root = compute_merkle_root(&trajectories);
    
    let max_length = trajectories.iter().map(|t| t.length).max().unwrap_or(0);
    let max_value = trajectories.iter().map(|t| t.max_value).max().unwrap_or(0);
    
    Json(SearchResponse {
        count: trajectories.len(),
        max_length,
        max_value,
        merkle_root,
    })
}

async fn seal_handler(
    Query(params): Query<VerifyParams>,
    state: axum::extract::State<Arc<AppState>>,
) -> Result<Json<SealResponse>, StatusCode> {
    let trajectory = compute_trajectory(params.n)
        .ok_or(StatusCode::BAD_REQUEST)?;
    
    let merkle_root = "a".repeat(64); // Simplified for demo
    let entry = seal_to_worm(&trajectory, &merkle_root);
    
    let mut ledger = state.ledger.lock().await;
    ledger.push(serde_json::to_string(&entry).unwrap());
    
    Ok(Json(SealResponse {
        trajectory_hash: entry.trajectory_hash,
        merkle_proof: entry.merkle_proof,
        timestamp: entry.timestamp,
    }))
}

async fn health_handler() -> &'static str {
    "OK"
}

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {
        ledger: Arc::new(Mutex::new(Vec::new())),
    });
    
    let app = Router::new()
        .route("/verify", get(verify_handler))
        .route("/search", get(search_handler))
        .route("/seal", post(seal_handler))
        .route("/health", get(health_handler))
        .with_state(state);
    
    println!("═══════════════════════════════════════════════════════════");
    println!("  Collatz Verification API");
    println!("═══════════════════════════════════════════════════════════");
    println!();
    println!("Endpoints:");
    println!("  GET  /verify?n=27");
    println!("  GET  /search?start=1&end=1000");
    println!("  POST /seal?n=27");
    println!("  GET  /health");
    println!();
    println!("▶ Listening on http://127.0.0.1:3000");
    
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
