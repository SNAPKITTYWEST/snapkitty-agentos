# nix/packages/snapkitty-daemon/default.nix
{ pkgs, src, version, bom, ... }:

# Detect Language
let
  isGo = pkgs.lib.hasInfix "go.mod" (builtins.readDir src);
  isRust = pkgs.lib.hasInfix "Cargo.toml" (builtins.readDir src);
in
if isGo then
  pkgs.buildGoModule {
    pname = "sovereign-daemon";
    version = version;
    src = src;
    vendorHash = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="; # RUN ONCE: nix build .#sovereign-daemon 2>&1 | grep "got:" | cut -d' ' -f2
    modRoot = ".";
    buildFlags = [ "-ldflags=-X main.version=${version} -X main.bomHash=${bom.hash}" ];
    # Embed Bifrost/Progo deps if needed
    # goDeps = ./deps.nix; # Generate with `go2nix` or `crane`
  }
else if isRust then
  pkgs.buildRustPackage {
    pname = "sovereign-daemon";
    version = version;
    src = src;
    # cargoHash = "..."; # Generate with `crane` or `cargo2nix`
    RUSTFLAGS = "-C target-cpu=native";
    # Embed version
    preBuild = ''export CARGO_BUILD_VERSION="${version}" CARGO_BUILD_BOM="${bom.hash}"'';
  }
else
  pkgs.stdenv.mkDerivation {
    pname = "sovereign-daemon";
    version = version;
    src = src;
    # Generic Make/CMake fallback
    nativeBuildInputs = [ pkgs.cmake pkgs.make ];
    buildPhase = "make";
    installPhase = "make install PREFIX=$out";
  }
