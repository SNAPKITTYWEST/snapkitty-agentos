# nix/modules/gitbash-meta.nix
{ pkgs, pkgs-unstable, bom, sovereign-daemon, bifrost-cli, prolog-policies, dotfilesSrc, ... }:

let
  # 1. MSYS2 Base: Use pkgs.msys2 or build from pinned commit (bom.msys2_base)
  # We use a fixed-output derivation to fetch the exact MSYS2 installer/tarball from BOM
  msys2-base = pkgs.fetchurl {
    url = "https://repo.msys2.org/distrib/x86_64/msys2-base-x86_64-${bom.msys2_base.date}.tar.xz";
    sha256 = bom.msys2_base.sha256; # MUST be in your BOM.pl
  };

  # 2. MinGW-w64 Toolchain (Pinned via BOM)
  mingw64 = pkgs.mingwW64.override { 
    version = bom.mingw_w64.version; 
    # If BOM says specific commit, use fetchgit instead
  };

  # 3. Runtime Packages (From Nixpkgs, versions constrained by BOM)
  runtimePkgs = with pkgs; [
    git.override { version = bom.runtime_package.git.version; }
    openssh.override { version = bom.runtime_package.openssh.version; }
    jq.override { version = bom.runtime_package.jq.version; }
    swiprolog.override { version = bom.runtime_package.swi_prolog.version; }
    # Your custom bifrost cli
    bifrost-cli
    # Daemon binary (copied into /usr/local/bin inside the env)
    (pkgs.writeScriptBin "sovereign-daemon" ''
      #!${pkgs.runtimeShell}
      exec ${sovereign-daemon}/bin/sovereign-daemon "$@"
    '')
  ];

  # 4. Dotfiles / Home Manager Integration
  # We use a simple `buildEnv` to merge dotfiles into /etc/skel (for new users) 
  # and provide a launch script.
  dotfiles = pkgs.buildEnv {
    name = "snapkitty-dotfiles";
    paths = [ dotfilesSrc ];
    pathsToLink = [ "/etc" "/home" ]; # Structure: dotfiles/etc/, dotfiles/home/
  };

  # 5. The Launch Script (Entry Point)
  launcher = pkgs.writeScriptBin "snapkitty-shell" ''
    #!${pkgs.runtimeShell}
    # SnapKitty Meta-GitBash Launcher
    
    export MSYSTEM=MINGW64
    export CHERE_INVOKING=1
    export SNAPKITTY_ROOT="${msys2-base}"
    export SNAPKITTY_BOM_HASH="${bom.hash}" # Injected at build time
    
    # Ensure WORM Log dir exists
    mkdir -p "$HOME/.snapkitty/worm"
    mkdir -p "/run/user/$(id -u)"
    
    # Start Daemon if not running (Socket Activation)
    if ! ss -l | grep -q "snapkitty.sock"; then
      ${sovereign-daemon}/bin/sovereign-daemon serve --socket /run/user/$(id -u)/snapkitty.sock \
        --policy ${prolog-policies}/share/snapkitty/policies \
        --bifrost-key $HOME/.snapkitty/keys/operator.ed25519 \
        > $HOME/.snapkitty/daemon.log 2>&1 &
      DAEMON_PID=$!
      trap "kill $DAEMON_PID" EXIT
    fi
    
    # Exec Bash with our RC file
    exec ${pkgs.bash}/bin/bash --rcfile <(cat ${dotfiles}/home/.bashrc) -i "$@"
  '';

in
pkgs.buildEnv {
  name = "snapkitty-gitbash-meta-${bom.version}";
  paths = [ msys2-base mingw64 ] ++ runtimePkgs ++ [ launcher dotfiles prolog-policies ];
  # Post-build: Fix symlinks, create Windows shortcuts (if on Windows builder)
  postBuild = ''
    # Ensure the MSYS2 root structure looks right
    ln -sfn ${mingw64} $out/mingw64
    ln -sfn ${msys2-base} $out/msys2
    
    # Generate version manifest
    echo "{\"version\": \"${bom.version}\", \"bom_hash\": \"${bom.hash}\", \"daemon\": \"${sovereign-daemon}\", \"shell\": \"$out/bin/snapkitty-shell\"}" > $out/snapkitty-manifest.json
  '';
}
