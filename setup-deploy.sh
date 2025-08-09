#!/usr/bin/env bash
# setup-deploy.sh — Setup & Deploy tudo-em-um (Node + Supabase + Netlify)
set -o pipefail

bold(){ printf "\033[1m%s\033[0m\n" "$*"; }
info(){ printf "🔹 %s\n" "$*"; }
good(){ printf "✅ %s\n" "$*"; }
warn(){ printf "⚠️  %s\n" "$*"; }
err(){ printf "🛑 %s\n" "$*" 1>&2; }
ask(){ read -r -p "$1" REPLY && echo "$REPLY"; }

is_codespace(){ [ -n "${CODESPACES:-}" ] || [ -n "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" ]; }

# Compara se versão A >= B usando sort -V (funciona com X.Y.Z)
version_ge(){ [ "$(printf '%s\n' "$2" "$1" | sort -V | head -n1)" = "$2" ]; }

ensure_node(){
  local MIN="18.0.0"
  if command -v node >/dev/null 2>&1; then
    local NV="$(node -v | sed 's/^v//')"
    info "Node.js: v$NV"
    if version_ge "$NV" "$MIN"; then
      good "Node OK (>= $MIN)"
    else
      warn "Node < $MIN. Vou instalar via NVM (LTS)."
      install_nvm_and_node
    fi
  else
    warn "Node não encontrado. Vou instalar via NVM (LTS)."
    install_nvm_and_node
  fi
  good "npm v$(npm -v) OK"
}

install_nvm_and_node(){
  if ! command -v nvm >/dev/null 2>&1; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  fi
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install --lts
  nvm use --lts
}

# Instala Supabase CLI no HOME (sem sudo) caso não exista
ensure_supabase_cli(){
  if command -v supabase >/dev/null 2>&1; then
    good "Supabase CLI já instalada: $(supabase --version)"
    return 0
  fi

  warn "Supabase CLI não encontrada. Instalando localmente (sem sudo)..."
  # Tentativa via npm no prefixo do usuário
  if command -v npm >/dev/null 2>&1; then
    # Define prefixo de usuário se não estiver configurado
    local NPREFIX="$(npm config get prefix 2>/dev/null || true)"
    if [ "$NPREFIX" = "/usr" ] || [ "$NPREFIX" = "/usr/local" ]; then
      npm config set prefix "$HOME/.npm-global" >/dev/null 2>&1 || true
      NPREFIX="$HOME/.npm-global"
    fi
    mkdir -p "$NPREFIX/bin"
    export PATH="$NPREFIX/bin:$PATH"
    npm i -g supabase >/dev/null 2>&1 || true
  fi

  if ! command -v supabase >/dev/null 2>&1; then
    err "Falha ao instalar Supabase CLI via npm. Opções:"
    echo "1) Rode: npm config set prefix ~/.npm-global && export PATH=\"\$HOME/.npm-global/bin:\$PATH\" && npm i -g supabase"
    echo "2) Ou instale manualmente o binário: https://github.com/supabase/cli#installation"
    return 1
  fi

  good "Supabase CLI instalada: $(supabase --version)"
  # Tenta persistir PATH em zsh/bash
  if [ -n "$ZSH_VERSION" ]; then
    grep -q 'npm-global/bin' "$HOME/.zshrc" 2>/dev/null || echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> "$HOME/.zshrc"
  elif [ -n "$BASH_VERSION" ]; then
    grep -q 'npm-global/bin' "$HOME/.bashrc" 2>/dev/null || echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> "$HOME/.bashrc"
  fi
}

# Login/Link do Supabase (opcional)
supabase_auth_and_link(){
  command -v supabase >/dev/null 2>&1 || return 0

  local do_auth
  do_auth=$(ask "Deseja configurar login/link do Supabase agora? (s/n): ")
  if [[ ! "$do_auth" =~ ^[sSyY]$ ]]; then
    info "Pulando autenticação/link do Supabase."
    return 0
  fi

  # Login com token via env ou prompt
  if supabase projects list >/dev/null 2>&1; then
    good "Já está logado no Supabase."
  else
    if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
      info "Usando SUPABASE_ACCESS_TOKEN do ambiente..."
      supabase login --token "$SUPABASE_ACCESS_TOKEN" || warn "Falha no login via token."
    else
      info "Abrirei o login interativo (browser). Caso não abra, gere um access token em app.supabase.com/account/tokens e exporte SUPABASE_ACCESS_TOKEN."
      supabase login || warn "Login interativo falhou."
    fi
  fi

  # Linkar projeto (opcional)
  local pref
  pref=$(ask "Se quiser linkar agora, informe o Project Ref (ex: abcdefghijkl): ")
  if [ -n "$pref" ]; then
    supabase link --project-ref "$pref" || warn "Falha ao linkar projeto. Você pode rodar 'supabase link' depois."
  else
    info "Sem project ref informado. Você pode rodar 'supabase link' mais tarde."
  fi
}

open_url(){
  local url="$1"
  if is_codespace; then
    info "Codespace: abra pela aba PORTS -> $url"
  else
    if command -v xdg-open >/dev/null 2>&1; then xdg-open "$url" >/dev/null 2>&1 &
    elif command -v open      >/dev/null 2>&1; then open "$url"      >/dev/null 2>&1 &
    else info "Acesse: $url"; fi
  fi
}

setup(){
  bold "===== 🚦 Setup Automático do Projeto ====="

  ensure_node

  bold "📦 npm install"
  npm install

  # Supabase: instalar CLI e (opcional) autenticar/linkar
  ensure_supabase_cli || warn "Supabase CLI não disponível; funcionalidades Supabase locais serão puladas."
  supabase_auth_and_link

  # Se você quiser iniciar Supabase local, descomente:
  # if command -v supabase >/dev/null 2>&1; then
  #   bold "🐘 supabase start"
  #   supabase start
  # fi

  bold "🚀 npm run dev (log em /tmp/dev.log)"
  npm run dev &>/tmp/dev.log & DEV_PID=$!

  local PORT="${PORT:-8080}"
  sleep 2
  open_url "http://localhost:$PORT"

  good "Dev rodando (PID: $DEV_PID)"
  bold "===== ✅ Setup finalizado ====="
}

deploy(){
  bold "===== 🚀 Commit, Push e Deploy Netlify ====="
  if ! command -v git >/dev/null 2>&1; then err "git não encontrado"; exit 1; fi

  local BRANCH; BRANCH=$(git rev-parse --abbrev-ref HEAD)
  info "Branch: $BRANCH"
  git status

  if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
    local c; c=$(ask "⚠️  Não está em main/master. Continuar? (s/n): ")
    [[ "$c" =~ ^[sSyY]$ ]] || { err "Abortado."; return 1; }
  fi

  git add -A
  if git diff --cached --quiet && git diff --quiet; then
    warn "Nada para commitar."
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

    [ -n "$feature" ] && types+="feat: "
    $ui      && types+="ui "
    $backend && types+="backend "
    $doc     && types+="docs "
    $test    && types+="test "
    $config  && types+="config "
    $deps    && types+="deps "

    local short n
    short=$(echo "$files" | head -5 | tr '\n' ',' | sed 's/,$//')
    n=$(echo "$files" | wc -l | tr -d ' ')
    [ "$n" -gt 5 ] && short="$short e mais $((n-5)) arquivos"

    local suggestion="${types:-chore: }atualizações em $short"
    echo "Sugestão: \"$suggestion\""
    local msg; msg=$(ask "Enter p/aceitar ou digite outra mensagem: "); [ -z "$msg" ] && msg="$suggestion"

    git commit -m "$msg"
    git push origin "$BRANCH"
    good "Commit + push OK"
  fi

  local d; d=$(ask "Rodar deploy Netlify agora? (s/n): ")
  if [[ "$d" =~ ^[sSyY]$ ]]; then
    if command -v netlify >/dev/null 2>&1; then
      netlify deploy --prod
    else
      npx -y netlify-cli deploy --prod
    fi
    good "Deploy acionado!"
  else
    info "Sem deploy manual. Se tiver CI no Netlify, o push já dispara."
  fi

  bold "===== 🏁 Deploy finalizado ====="
}

help(){
  cat <<'HLP'
Uso:
  ./setup-deploy.sh setup
  ./setup-deploy.sh deploy
  ./setup-deploy.sh help

Dicas:
  - PORT=5173 setup   # se sua app usar outra porta
  - Supabase: script instala CLI localmente (sem sudo)
    * Você pode exportar SUPABASE_ACCESS_TOKEN e o script usa no login
    * 'supabase link --project-ref <REF>' para vincular seu projeto
  - Codespaces: abra pela aba PORTS
HLP
}

case "${1:-help}" in
  setup)  setup ;;
  deploy) deploy ;;
  help|--help|-h) help ;;
  *) err "Comando desconhecido: $1"; echo; help; exit 1 ;;
esac
