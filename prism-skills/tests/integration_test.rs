//! Integration tests for prism-skills
//! Tests the full pipeline: canonical → sha256d → ψ-pipeline → WORM seal → admission

use prism_skills::*;
use serde_json::json;

#[test]
fn test_full_pipeline() {
    // Create test artifact
    let artifact = json!({
        "name": "test_artifact",
        "version": 1,
        "data": {"b": 2, "a": 1}
    });

    // Run through ψ-pipeline
    let carrier = pipeline(artifact.clone());
    assert!(carrier.label.is_some());

    // Create WORM seal
    let label = carrier.label.unwrap();
    let seal = WormSeal::seal(&label, &serde_json::to_string(&artifact).unwrap(), 4);
    assert!(seal.verify());

    // Verify admission (prime index example)
    let validator = PrimeIndexValidator::new(vec![2, 3, 5, 7]).unwrap();
    assert!(validator.is_admitted(2));
    assert!(!validator.is_admitted(4));
}

#[test]
fn test_canonical_determinism() {
    let v1 = json!({"z": 1, "a": 2, "m": 3});
    let v2 = json!({"a": 2, "m": 3, "z": 1});
    let v3 = json!({"m": 3, "z": 1, "a": 2});

    // All should produce same canonical bytes
    let bytes1 = canonical_bytes(&v1);
    let bytes2 = canonical_bytes(&v2);
    let bytes3 = canonical_bytes(&v3);

    assert_eq!(bytes1, bytes2);
    assert_eq!(bytes2, bytes3);
}

#[test]
fn test_sha256d_properties() {
    let data = b"test data";

    // Deterministic
    let h1 = hash_double(data);
    let h2 = hash_double(data);
    assert_eq!(h1, h2);

    // Different from single hash
    let single = hash_bytes(data);
    assert_ne!(h1, single);

    // snapsha256d format
    let label = snapsha256d(data);
    assert!(label.starts_with("snapsha256d:"));
    assert_eq!(label.len(), 12 + 64);
}

#[test]
fn test_worm_seal_integrity() {
    let seal = WormSeal::seal("test_label", "test_payload", 10);

    // Verify passes
    assert!(seal.verify());

    // Tamper detection
    let mut tampered = seal.clone();
    tampered.payload = "tampered".to_string();
    assert!(!tampered.verify());

    // Content hash is deterministic for same label+payload
    let seal2 = WormSeal::seal("test_label", "test_payload", 10);
    assert_eq!(seal.content_hash(), seal2.content_hash());
}

#[test]
fn test_admission_fail_closed() {
    // Empty set should error
    let result = AdmissionValidator::new(vec![]);
    assert!(matches!(result, Err(AdmissionError::EmptyAllowedSet)));

    // Valid set
    let validator = AdmissionValidator::new(vec!["allowed".to_string()]).unwrap();

    // Admitted
    assert!(validator.is_admitted("allowed"));

    // Rejected (fail-closed, no fallback)
    assert!(!validator.is_admitted("not_allowed"));

    // Empty target rejected
    let result = validator.validate("");
    assert!(matches!(result, Err(AdmissionError::InvalidTargetFormat { .. })));
}

#[test]
fn test_psi_pipeline_stages() {
    let value = json!({
        "type": "artifact",
        "id": "test_123",
        "metadata": {"version": 1, "author": "test"}
    });

    // Run pipeline
    let carrier = pipeline(value);

    // Verify all stages completed
    assert!(!carrier.canonical_bytes.is_empty());
    assert!(carrier.label.is_some());

    // Label should be snapsha256d format
    let label = carrier.label.unwrap();
    assert!(label.starts_with("snapsha256d:"));
}

#[test]
fn test_end_to_end_workflow() {
    // 1. Create artifact
    let artifact = json!({
        "name": "sovereign_artifact",
        "data": [1, 2, 3],
        "metadata": {"z": 1, "a": 2}
    });

    // 2. Canonicalize
    let canonical = canonical_bytes(&artifact);
    assert!(!canonical.is_empty());

    // 3. Hash with SHA-256d
    let hash = hash_double(&canonical);
    assert_eq!(hash.len(), 64);

    // 4. Run through ψ-pipeline
    let carrier = pipeline(artifact.clone());
    let label = carrier.label.unwrap();

    // 5. Create WORM seal
    let seal = WormSeal::seal(&label, &serde_json::to_string(&artifact).unwrap(), 5);
    assert!(seal.verify());

    // 6. Validate admission
    let validator = PrimeIndexValidator::new(vec![2, 3, 5, 7, 11]).unwrap();
    assert!(validator.is_admitted(5));

    // 7. Verify content hash matches
    let seal2 = WormSeal::seal(&label, &serde_json::to_string(&artifact).unwrap(), 5);
    assert_eq!(seal.content_hash(), seal2.content_hash());
}
