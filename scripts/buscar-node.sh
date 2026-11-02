# Lo usan los archivos .command de macOS. Localiza Node.js aunque Terminal no cargue el perfil del usuario.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null 2>&1 && [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
fi

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  ----------------------------------------------------------"
  echo "   Falta instalar Node.js"
  echo "  ----------------------------------------------------------"
  echo
  echo "   1. Entre a https://nodejs.org y descargue la version \"LTS\"."
  echo "   2. Abra el archivo descargado e instalelo (Continuar, Continuar...)."
  echo "   3. Vuelva a hacer doble clic en este archivo."
  echo
  open "https://nodejs.org/es/download" >/dev/null 2>&1
  read -r -p "  Presione Enter para cerrar esta ventana..."
  exit 1
fi

if ! node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>18||(a===18&&b>=18)?0:1)"; then
  echo
  echo "  La version de Node.js instalada ($(node -v)) es muy antigua."
  echo "  Descargue la version \"LTS\" en https://nodejs.org, instalela y vuelva a intentar."
  echo
  read -r -p "  Presione Enter para cerrar esta ventana..."
  exit 1
fi
