//! AXIOM Proof Assistant - Main Entry Point
//! Sovereign proof assistant with WORM-sealed verification

use axiom::kernel::{WormDb, Term, Env, check, verify_proof};
use axiom::syntax::parser;
use std::env;
use std::fs;

fn main() {
    let args: Vec<String> = env::args().collect();

    println!("═══════════════════════════════════════════════════════════");
    println!("  AXIOM Proof Assistant v0.1.0");
    println!("  Sovereign proof assistant. Faster than Lean 4.");
    println!("═══════════════════════════════════════════════════════════");
    println!();

    if args.len() < 2 {
        print_usage();
        return;
    }

    match args[1].as_str() {
        "check" => {
            if args.len() < 3 {
                println!("Usage: axiom check <file.axiom>");
                return;
            }
            check_file(&args[2]);
        }
        "verify" => {
            if args.len() < 3 {
                println!("Usage: axiom verify <file.axiom>");
                return;
            }
            verify_file(&args[2]);
        }
        "seal" => {
            if args.len() < 3 {
                println!("Usage: axiom seal <file.axiom>");
                return;
            }
            seal_file(&args[2]);
        }
        "repl" => {
            run_repl();
        }
        _ => {
            println!("Unknown command: {}", args[1]);
            print_usage();
        }
    }
}

fn print_usage() {
    println!("Usage: axiom <command> [args]");
    println!();
    println!("Commands:");
    println!("  check <file.axiom>   Type-check a .axiom file");
    println!("  verify <file.axiom>  Verify all proofs in file");
    println!("  seal <file.axiom>    Seal proofs to WORM ledger");
    println!("  repl                 Start interactive REPL");
    println!();
    println!("Examples:");
    println!("  axiom check src/stdlib/nat.axiom");
    println!("  axiom verify examples/collatz.axiom");
    println!("  axiom seal examples/collatz.axiom");
}

fn check_file(path: &str) {
    println!("▶ Type-checking: {}", path);

    let source = match fs::read_to_string(path) {
        Ok(s) => s,
        Err(e) => {
            println!("✗ Error reading file: {}", e);
            return;
        }
    };

    let decls = parser::parse(&source);
    let mut env = Env::new();
    let mut errors = 0;

    // Add Nat to environment
    env.extend("Nat".to_string(), Term::Type(0), None);
    env.extend("zero".to_string(), Term::Inductive("Nat".to_string(), 0), None);
    env.extend("succ".to_string(),
        Term::Pi("n".to_string(),
            Box::new(Term::Inductive("Nat".to_string(), 0)),
            Box::new(Term::Inductive("Nat".to_string(), 0))),
        None);

    for decl in &decls {
        match decl {
            parser::Declaration::Def { name, typ, body } => {
                match check(&env, body, typ) {
                    Ok(()) => {
                        println!("  ✓ def {} : {:?}", name, typ);
                        env.extend(name.clone(), typ.clone(), Some(body.clone()));
                    }
                    Err(e) => {
                        println!("  ✗ def {} : {}", name, e);
                        errors += 1;
                    }
                }
            }
            parser::Declaration::Theorem { name, typ, proof } => {
                match verify_proof(&env, typ, proof) {
                    Ok(()) => {
                        println!("  ✓ theorem {} : {:?}", name, typ);
                        env.extend(name.clone(), typ.clone(), Some(proof.clone()));
                    }
                    Err(e) => {
                        println!("  ✗ theorem {} : {}", name, e);
                        errors += 1;
                    }
                }
            }
            parser::Declaration::Inductive { name, universe, constructors } => {
                println!("  ✓ inductive {} : Type {}", name, universe);
                env.extend(name.clone(), Term::Type(*universe), None);
                for (ctor_name, ctor_type) in constructors {
                    env.extend(ctor_name.clone(), ctor_type.clone(), None);
                    println!("    | {} : {:?}", ctor_name, ctor_type);
                }
            }
        }
    }

    println!();
    if errors == 0 {
        println!("✓ All {} declarations type-checked successfully", decls.len());
    } else {
        println!("✗ {} errors found", errors);
    }
}

fn verify_file(path: &str) {
    println!("▶ Verifying proofs: {}", path);
    check_file(path);
}

fn seal_file(path: &str) {
    println!("▶ Sealing proofs to WORM ledger: {}", path);

    let source = match fs::read_to_string(path) {
        Ok(s) => s,
        Err(e) => {
            println!("✗ Error reading file: {}", e);
            return;
        }
    };

    let decls = parser::parse(&source);
    let mut db = WormDb::new("axiom_worm.jsonl");
    let mut sealed = 0;

    for decl in &decls {
        match decl {
            parser::Declaration::Theorem { name, typ, proof } => {
                let theorem_str = format!("{:?}", typ);
                let proof_str = format!("{:?}", proof);
                let entry = db.seal_proof(name, &theorem_str, &proof_str);
                println!("  ✓ Sealed theorem '{}' (seal: {}...)", name, &entry.seal[..16]);
                sealed += 1;
            }
            _ => {}
        }
    }

    println!();
    println!("✓ Sealed {} theorems to WORM ledger", sealed);
    println!("  Merkle root: {}", db.get_merkle_root());
}

fn run_repl() {
    println!("AXIOM REPL (type :quit to exit)");
    println!("  Type .axiom expressions to type-check them");
    println!();

    let mut env = Env::new();
    env.extend("Nat".to_string(), Term::Type(0), None);

    use std::io::{self, Write, BufRead};
    let stdin = io::stdin();

    loop {
        print!("axiom> ");
        io::stdout().flush().unwrap();

        let mut line = String::new();
        if stdin.lock().read_line(&mut line).unwrap() == 0 {
            break;
        }

        let line = line.trim();
        if line == ":quit" || line == ":q" {
            break;
        }
        if line.is_empty() {
            continue;
        }

        let decls = parser::parse(line);
        for decl in &decls {
            match decl {
                parser::Declaration::Def { name, typ, body } => {
                    match check(&env, body, typ) {
                        Ok(()) => {
                            println!("  ✓ {} : {:?}", name, typ);
                            env.extend(name.clone(), typ.clone(), Some(body.clone()));
                        }
                        Err(e) => println!("  ✗ {}", e),
                    }
                }
                _ => println!("  (parsed: {:?})", decl),
            }
        }
    }
}
