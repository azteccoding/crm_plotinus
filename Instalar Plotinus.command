#!/bin/bash
# Doble clic para instalar o actualizar el sistema (macOS).
cd "$(dirname "$0")" || exit 1
source "./scripts/buscar-node.sh"
node scripts/preparar.mjs instalar
echo
read -r -p "  Presione Enter para cerrar esta ventana..."
