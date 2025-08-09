#!/usr/bin/env bash
set -o pipefail

bold(){ printf "\033[1m%s\033[0m\n" "$*"; }
info(){ printf "🔹 %s\n" "$*"; }
good(){ printf "✅ %s\n" "$*"; }
warn(){ printf "⚠️  %s\n" "$*"; }
err(){ printf "🛑 %s\n" "$*" 1>&2; }
ask(){ read -r -p "$1" REPLY && echo "$REPLY"; }
is_codespace(){ [ -n "${CODESPACES:-}" ] || [ -n "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" ]; }
version_ge(){ [ "$(printf '%s\n' "$2" "$1" | sort -V | head -n1)" = "$2" ]; }

install_nvm_and_node(){
  if ! command -v nvm >/dev/null 2>&1; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  fi
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install --lts
  nvm use --lts
}

ensure_node(){
  local MIN="18.0.0"
  if command -v node >/dev/null 2>&1; then
    local NV="$(node -v | sed 's/^v//')"
    info "Node.js: v$NV"
    version_ge "$NV" "$MIN" && good "Node OK (>= $MIN)" || { warn "Node < $MIN. Instalando via NVM..."; install_nvm_and_node; }
  else
    warn "Node não encontrado. Instalando via NVM..."
    install_nvm_and_node
  fi
  good "npm v$(npm -v) OK"
}

ensure_supabase_cli(){
  if command -v supabase >/dev/null 2>&1; then good "Supabase CLI: $(supabase --version)"; return; fi
  warn "Instalando Supabase CLI (sem sudo)..."
  local NPREFIX="$(npm config get prefix 2>/dev/null || true)"
  if [ "$NPREFIX" = "/usr" ] || [ "$NPREFIX" = "/usr/local" ]; then
    npm config set prefix "$HOME/.npm-global" >/dev/null 2>&1 || true
    NPREFIX="$HOME/.npm-global"
  fi
  mkdir -p "$NPREFIX/bin"; export PATH="$NPREFIX/bin:$PATH"
  npm i -g supabase >/dev/null 2>&1 || true
  command -v supabase >/dev/null 2>&1 && good "Supabase CLI: $(supabase --version)" || warn "Falha ao instalar Supabase CLI."
}

supabase_auth_and_link(){
  command -v supabase >/dev/null 2>&1 || return 0
  local do_auth; do_auth=$(ask "Configurar login/link do Supabase agora? (s/n): ")
  [[ "$do_auth" =~ ^[sSyY]$ ]] || { info "Pulando Supabase."; return 0; }
  if ! supabase projects list >/dev/null 2>&1; then
    if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
      info "Usando SUPABASE_ACCESS_TOKEN..."
      supabase login --token "$SUPABASE_ACCESS_TOKEN" || warn "Falha no login via token."
    else
      supabase login || warn "Login interativo falhou."
    fi
  else
    good "Já logado no Supabase."
  fi
  local pref; pref=$(ask "Informe o project ref para linkar (ou Enter p/ pular): ")
  [ -n "$pref" ] && supabase link --project-ref "$pref" || info "Sem link agora."
}

open_url(){
  local url="$1"
  if is_codespace; then info "Codespace: abra via PORTS -> $url"
  else
    command -v xdg-open >/dev/null 2>&1 && xdg-open "$url" >/dev/null 2>&1 && return
    command -v open     >/dev/null 2>&1 && open "$url"     >/dev/null 2>&1 && return
    info "Acesse: $url"
  fi
}

setup(){
  bold "===== 🚦 Setup Automático do Projeto ====="
  ensure_node
  bold "📦 npm install"; npm install
  ensure_supabase_cli || true
  supabase_auth_and_link
  bold "🚀 npm run dev (log em /tmp/dev.log)"; npm run dev &>/tmp/dev.log & DEV_PID=$!
  local PORT="${PORT:-8080}"; sleep 2; open_url "http://localhost:$PORT"
  good "Dev rodando (PID: $DEV_PID)"; bold "===== ✅ Setup finalizado ====="
}

deploy(){
  bold "===== 🚀 Commit, Push e Deploy Netlify ====="
  command -v git >/dev/null 2>&1 || { err "git não encontrado"; exit 1; }

  local BRANCH; BRANCH=$(git rev-parse --abbrev-ref HEAD)
  info "Branch: $BRANCH"; git status
  if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
    local c; c=$(ask "⚠️  Não está em main/master. Continuar? (s/n): "); [[ "$c" =~ ^[sSyY]$ ]] || { err "Abortado."; return 1; }
  fi

  git add -A
  if git diff --cached --quiet && git diff --quiet; then
    warn "Nada para commitar (seguindo com deploy)."
  else
    local files types="" feature="" ui=false backend=false doc=false test=false config=false deps=false
    files=$(git diff --cached --name-only)
    while read -r f; do
      [[ "$f" =~ (feature|feat) ]] && feature="feat"
      [[ "$f" =~ (ui|App|Sidebar|Theme|Layout) || "$f" =~ \.s?css$ ]] && ui=true
      [[ "$f" =~ (api|service|lib|supabase|backend) || ( "$f" =~ \.ts$ && ! "$f" =~ \.d\.ts$ ) ]] && backend=true
      [[ "$f" =~ (\.md$|README|docs/) ]] && doc=true
      [[ "$f" =~ (test|spec|e2e) || "$f" =~ \.test\.(js|ts|tsx)$ ]] && test=true
      [[ "$f" =~ (config|\.json$|\.toml$|\.yml$|\.lock$|\.env) ]] && config=true
      [[ "$f" =~ (package.json|package-lock.json|yarn.lock|pnpm-lock.yaml|bun.lockb) ]] && deps=true
    done <<< "$files"
    [ -n "$feature" ] && types+="feat: "; $ui && types+="ui "; $backend && types+="backend "; $doc && types+="docs "; $test && types+="test "; $config && types+="config "; $deps && types+="deps "
    local short=$(echo "$files" | head -5 | tr '\n' ',' | sed 's/,$//'); local n=$(echo "$files" | wc -l | tr -d ' ')
    [ "$n" -gt 5 ] && short="$short e mais $((n-5)) arquivos"
    local suggestion="${types:-chore: }atualizações em $short"
    echo "Sugestão: \"$suggestion\""
    local msg; msg=$(ask "Enter p/aceitar ou digite outra mensagem: "); [ -z "$msg" ] && msg="$suggestion"
    git commit -m "$msg" && git push origin "$BRANCH" && good "Commit + push OK"
  fi

  bold "🌐 Publicando no Netlify (CLI) — sempre"
  if command -v netlify >/dev/null 2>&1; then
    netlify deploy --prod
  else
    npx -y netlify-cli deploy --prod
  fi
  good "Deploy acionado no Netlify."
  bold "===== 🏁 Deploy finalizado ====="
}

help(){
  cat <<'HLP'
Uso:
  setup     # instala deps, supabase (opcional) e sobe o dev
  deploy    # commit+push no GitHub e SEMPRE publica no Netlify (CLI)
Dicas:
  - PORT=5173 setup   # se sua app usar outra porta
  - netlify.toml fixa build: npm run build -> dist (SPA redirect incluso)
  - Se site estiver conectado ao GitHub, o push também dispara CI; o CLI publica imediatamente.
HLP
}

case "${1:-help}" in
  setup)  setup ;;
  deploy) deploy ;;
  help|--help|-h) help ;;
  *) err "Comando desconhecido: $1"; echo; help; exit 1 ;;
esac
