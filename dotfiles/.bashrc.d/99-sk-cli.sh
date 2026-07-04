# dotfiles/.bashrc.d/99-sk-cli.sh
# This file gets installed into $HOME/.bashrc.d/ by Home-Manager or the launcher

sk() {
  local cmd="${1:-help}"; shift || true
  local socket="/run/user/$(id -u)/snapkitty.sock"
  
  # Helper: Sign & Send
  _sk_req() {
    local method="$1" path="$2" data="${3:-{}}"
    local ctx="cli-$(date +%s)-$RANDOM"
    local payload=$(jq -n -c --arg m "$method" --arg p "$path" --argjson d "$data" --arg c "$ctx" \
      '{method: $m, path: $p, data: $d, ctx: $c, timestamp: now|todateiso8601}')
    
    # Sign with local Bifrost key (assumes key in ~/.snapkitty/keys/operator.ed25519)
    local signed=$(echo "$payload" | bifrost_cli sign --key ~/.snapkitty/keys/operator.ed25519 --output json)
    
    # Send via Unix Socket (HTTP over Unix)
    echo "$signed" | jq -r .payload | \
      curl -sS -X POST --unix-socket "$socket" \
        -H "Content-Type: application/json" \
        -H "X-Bifrost-Signature: $(echo "$signed" | jq -r .signature)" \
        -d @- "http://localhost$path"
  }

  case "$cmd" in
    pipeline)
      local stage="${1:-build}"; shift || true
      _sk_req POST "/v1/pipeline/execute" "$(jq -n --arg s "$stage" --argjson args "$*" '{stage: $s, inputs: $args}')"
      ;;
    env)
      _sk_req POST "/v1/env/validate" '{}'
      ;;
    sign)
      local file="$1"
      _sk_req POST "/v1/artifact/sign" "$(jq -n --arg f "$file" --arg h "$(sha256sum "$file" | cut -d' ' -f1)" '{path: $f, hash: $h}')"
      ;;
    daemon)
      case "${1:-status}" in
        status) _sk_req GET "/v1/daemon/status" ;;
        logs) tail -f "$HOME/.snapkitty/daemon.log" ;;
        restart) pkill -f "sovereign-daemon serve" && echo "Restarted via socket activation" ;;
      esac
      ;;
    worm)
      bifrost_cli worm verify --chain "$HOME/.snapkitty/worm/chain.log"
      ;;
    *)
      cat <<EOF
SnapKitty Meta-CLI (Sovereign)
Usage: sk <command> [args]

Commands:
  pipeline <stage> [json_args] Execute CI/CD stage (build|test|sign|deploy)
  env validate Check env drift vs BOM
  sign <file> Sign artifact via Bifrost/WORM
  daemon [status|logs|restart] Control local daemon
  worm Verify local WORM chain integrity
EOF
      ;;
  esac
}
export -f sk
