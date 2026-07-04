# nix/lib/bom.nix
{ pkgs, prolog, bomFile, ... }:

let
  # Query Prolog for structured data
  # Requires: prolog -g "consult('${bomFile}'), bom_json(Out), write(Out), halt." -t halt
  bomJson = pkgs.runCommand "bom.json" { nativeBuildInputs = [ prolog pkgs.jq ]; } ''
    ${prolog}/bin/swipl -q -g "consult('${bomFile}'), bom_json(Out), write(Out), halt." -t halt > $out
  '';

  # Parse JSON into Nix Attrset
  parsed = builtins.fromJSON (builtins.readFile bomJson);

  # Compute Hash of BOM for Build Inputs
  hash = pkgs.lib.hashFile "sha256" bomFile;

in
parsed // { 
  hash = hash; 
  version = parsed.version or "0.0.0-meta"; 
  # Helper for Nix
  runtime_package = parsed.runtime_package or {};
  msys2_base = parsed.msys2_base or { date = "20241001"; sha256 = "..."; };
  mingw_w64 = parsed.mingw_w64 or { version = "12.0.0"; };
}
