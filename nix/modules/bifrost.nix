# nix/modules/bifrost.nix
{ pkgs, bom, ... }:

pkgs.stdenv.mkDerivation {
  pname = "bifrost-cli";
  version = "1.0.0";
  src = pkgs.writeScriptBin "bifrost_cli" ''
    #!/bin/sh
    cmd="$1"
    if [ "$cmd" = "sign" ]; then
      # Read payload from stdin and output signed json
      payload=$(cat)
      echo "{\"payload\": $payload, \"signature\": \"mock_sig_$(date +%s)\"}"
    elif [ "$cmd" = "worm" ]; then
      echo "mock WORM verify check OK"
    else
      echo "mock bifrost cli command: $@"
    fi
  '';
  unpackPhase = "true";
  installPhase = ''
    mkdir -p $out/bin
    cp $src/bin/bifrost_cli $out/bin/bifrost_cli
    chmod +x $out/bin/bifrost_cli
  '';
}
