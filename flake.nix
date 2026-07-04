# flake.nix
{
  description = "SnapKitty Sovereign Meta-GitBash + Daemon Distribution";

  # 1. INPUTS: Pinned, No Channels
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05"; # Stable baseline
    nixpkgs-unstable.url = "github:NixOS/nixpkgs/nixpkgs-unstable"; # For very new tooling if needed
    # Internal: Your Bifrust/WORM libs if in separate repos
    # bifrost-lib.url = "git+ssh://git@git.sovereign.local/bifrost/lib.git";
    # bimflake.inputs.nixpkgs.follows = "nixpkgs";
    
    # Flake Utils for cross-system helpers
    flake-utils.url = "github:numtide/flake-utils";
  };

  # 2. OUTPUTS
  outputs = { self, nixpkgs, flake-utils, nixpkgs-unstable, ... }@inputs:
    flake-utils.lib.eachSystem [ "x86_64-windows" "x86_64-linux" "aarch64-darwin" ] (system:
      let
        # --- Core PKGS ---
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ (import ./nix/overlays/sovereign-overlay.nix) ];
          config = {
            allowUnfree = true; # For MSYS2 blobs if needed
            # Permit your custom licenses
            permittedLicenses = with pkgs.lib.licenses; [ "MIT" "Apache-2.0" "GPL-3.0" "Unlicense" "CC0" ];
          };
        };

        # --- UNSTABLE PKGS (Targeted) ---
        pkgs-unstable = import nixpkgs-unstable { inherit system; config = pkgs.config; };

        # --- BOM INTEGRATION ---
        # Reads snapkitty_bom.pl and exposes as Nix attrset `bom`
        bom = import ./nix/lib/bom.nix { 
          inherit pkgs; 
          prolog = pkgs.swiprolog; 
          bomFile = ./policies/snapkitty_bom.pl; 
        };

        # --- DAEMON BUILD (Your Existing Code) ---
        # Assumes src/sovereign-daemon is a standard Go/Rust project
        sovereign-daemon = pkgs.stdenv.mkDerivation (import ./nix/packages/snapkitty-daemon {
          inherit pkgs bom;
          src = ./src/sovereign-daemon;
          version = self.lastModifiedDate; # Or git tag
        });

        # --- BIFROST CLI (If not in nixpkgs) ---
        bifrost-cli = pkgs.callPackage ./nix/modules/bifrost.nix { inherit pkgs bom; };

        # --- PROLOG POLICIES (Installed as data) ---
        prolog-policies = pkgs.runCommand "snapkitty-policies" {
          nativeBuildInputs = [ pkgs.coreutils ];
        } ''
          mkdir -p $out/share/snapkitty/policies
          cp ${./policies}/*.pl $out/share/snapkitty/policies/
        '';

        # --- META GITBASH SHELL (The Product) ---
        snapkitty-shell = import ./nix/modules/gitbash-meta.nix {
          inherit pkgs pkgs-unstable bom sovereign-daemon bifrost-cli prolog-policies;
          dotfilesSrc = ./dotfiles;
        };

        # --- INSTALLER / DIST ARTIFACTS ---
        snapkitty-installer = import ./nix/packages/snapkitty-installer {
          inherit pkgs snapkitty-shell sovereign-daemon;
          version = "meta-${self.shortRev or "dev"}";
        };

        # --- SBOM GENERATION ---
        sbom = pkgs.runCommand "sbom-spdx.json" {
          nativeBuildInputs = [ pkgs.nixpkgs.nix pkgs.jq pkgs.go-outliner ]; # go-outliner for Go deps
        } ''
          nix sbom --drv-path $(nix show-derivation $(nix path-info ${snapkitty-installer} --derivation)) > $out
        '';

      in {
        # --- DEFAULT PACKAGE ---
        defaultPackage = snapkitty-installer;

        # --- PACKAGES (nix build .#<name>) ---
        packages = {
          inherit sovereign-daemon bifrost-cli snapkitty-shell snapkitty-installer sbom prolog-policies;
          # Convenience: build everything
          all = pkgs.buildEnv {
            name = "snapkitty-full-stack";
            paths = [ sovereign-daemon bifrost-cli snapkitty-shell snapkitty-installer prolog-policies ];
          };
        };

        # --- DEV SHELLS (nix develop .#<name>) ---
        devShells = {
          # For working ON the daemon
          daemon = pkgs.mkShell {
            name = "snapkitty-daemon-dev";
            buildInputs = [ pkgs.go pkgs.golangci-lint pkgs.delve sovereign-daemon ];
            SNAPKITTY_BOM = bom;
          };
          # For working ON the shell environment
          shell = pkgs.mkShell {
            name = "snapkitty-shell-dev";
            buildInputs = [ pkgs.nix pkgs.home-manager pkgs.swiprolog snapkitty-shell ];
            SNAPKITTY_BOM = bom;
          };
          # Default: Full stack dev env
          default = pkgs.mkShell {
            name = "snapkitty-full-dev";
            buildInputs = [ 
              pkgs.go pkgs.rustc pkgs.cargo pkgs.swiprolog 
              sovereign-daemon bifrost-cli snapkitty-shell 
            ];
            SNAPKITTY_BOM = bom;
            # Hook: Auto-start daemon for integration tests
            shellHook = ''
              export SNAPKITTY_DAEMON_SOCKET="/run/user/$UID/snapkitty.sock"
              export SNAPKITTY_CTX="dev-${RANDOM}"
              echo "[SnapKitty Dev] Daemon binary: ${sovereign-daemon}/bin/sovereign-daemon"
              echo "[SnapKitty Dev] Shell env: ${snapkitty-shell}/bin/snapkitty-shell"
            '';
          };
        };

        # --- NIXOS / WSL MODULE (Optional: for test VMs) ---
        nixosModules.default = { config, pkgs, ... }: {
          imports = [ ./nix/modules/daemon.nix ./nix/modules/gitbash-meta.nix ];
          # Enables systemd service for daemon + user env for shell
        };

        # --- FORMATTER / LINTER HOOKS ---
        formatter = pkgs.nixfmt-rfc;
        checks = {
          nix-fmt = pkgs.nixfmt-rfc.check { src = self; };
          # Add prolog lint, go vet, clippy here via pkgs.runCommand
        };
      });
}
