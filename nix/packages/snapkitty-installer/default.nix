# nix/packages/snapkitty-installer/default.nix
{ pkgs, snapkitty-shell, sovereign-daemon, version, ... }:

pkgs.stdenv.mkDerivation {
  pname = "snapkitty-installer";
  inherit version;
  src = ./.;
  unpackPhase = "true";
  installPhase = ''
    mkdir -p $out
    # Pack up the environment or place shell launcher symlink
    ln -s ${snapkitty-shell}/bin/snapkitty-shell $out/snapkitty-shell
  '';
}
