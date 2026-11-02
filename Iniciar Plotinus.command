#!/bin/bash
# Doble clic para abrir el sistema (macOS). Si es la primera vez, también lo instala.
cd "$(dirname "$0")" || exit 1
source "./scripts/buscar-node.sh"
node scripts/preparar.mjs iniciar
if [ $? -ne 0 ]; then
  echo
  read -r -p "  Presione Enter para cerrar esta ventana..."
fi
