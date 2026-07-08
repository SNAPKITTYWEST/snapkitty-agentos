pub mod checker;
pub mod worm;

pub use checker::{Term, Env, infer, check, def_eq, verify_proof};
pub use worm::{WormDb, ProofEntry, ProofCertificate};
