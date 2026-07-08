//! # Prism Skills
//!
//! Canonical serialization, SHA-256d hashing, ψ-pipeline, WORM sealing, and admission validation.
//! Integrated from sovereign-prism for SnapKitty Agent OS.
//!
//! ## Components
//! - **Canonical Serialization**: Deterministic JSON with key ordering invariance
//! - **SHA-256d**: Double SHA-256 hashing (prevents length-extension attacks)
//! - **ψ-Pipeline**: Algebraic topology (Nerve → Postnikov → Homotopy → k-Invariants)
//! - **WORM Seal**: Write-once-read-many cryptographic witnesses
//! - **Admission Validation**: Fail-closed target verification

pub mod canonical;
pub mod sha256d;
pub mod psi_pipeline;
pub mod seal;
pub mod admission;

pub use canonical::canonical_bytes;
pub use sha256d::{hash_bytes, hash_string, hash_double, snapsha256d};
pub use psi_pipeline::{Carrier, psi_pipeline as pipeline};
pub use seal::WormSeal;
pub use admission::{AdmissionValidator, AdmissionError, PrimeIndexValidator};
