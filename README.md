# LÉEME — Sistema de clientes de Consultoría Jurídica Plotinus

Sistema para llevar en la computadora de la oficina los clientes, la agenda del abogado, los documentos PDF, cotizaciones, facturas, contratos y las ventas del mes.

Todo funciona **en esta computadora**: la información se guarda en una base de datos MongoDB local y el sistema se abre en el navegador (Chrome o Edge) en la dirección `http://localhost:4000`. No necesita internet para el uso diario; solo para instalar y para abrir las ligas de “Servicios en línea”, WhatsApp y el sitio web.

---

## 1. Requisitos (se instalan una sola vez)

Se necesitan dos programas gratuitos: **Node.js** y **MongoDB**.

### En Windows

1. **Node.js**
   1. Entre a <https://nodejs.org> y presione el botón que dice **LTS**.
   2. Abra el archivo descargado y presione **Siguiente** en todas las pantallas hasta **Finalizar**.
2. **MongoDB** (base de datos)
   1. Entre a <https://www.mongodb.com/try/download/community>.
   2. En “Platform” elija **Windows**, en “Package” elija **msi** y presione **Download**.
   3. Abra el archivo descargado. Elija la instalación **Complete**.
   4. Deje marcada la casilla **Install MongoD as a Service** (así MongoDB se enciende solo cada vez que se prende la computadora).
   5. Deje marcada la casilla **Install MongoDB Compass** (programa para consultar los datos).
   6. Presione **Next** / **Install** hasta terminar.

### En Mac

1. **Node.js**
   1. Entre a <https://nodejs.org> y presione el botón que dice **LTS**.
   2. Abra el archivo descargado y presione **Continuar** hasta **Instalar**. Escriba la contraseña de la Mac si se la pide.
2. **MongoDB** (base de datos). Abra la aplicación **Terminal** (búsquela con ⌘ + espacio) y copie y pegue estas líneas, una por una, presionando Enter después de cada una:
   1. Si nunca ha instalado Homebrew:
      `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
      (siga las instrucciones que aparezcan en pantalla; al final puede pedirle copiar dos líneas más).
   2. `brew tap mongodb/brew`
   3. `brew install mongodb-community`
   4. `brew services start mongodb-community` (lo deja encendido siempre, también después de reiniciar).
   5. Opcional, para consultar los datos: descargue **MongoDB Compass** de <https://www.mongodb.com/try/download/compass>.

---

## 2. Instalación del sistema

1. Copie la carpeta **plotinus** a un lugar fijo, por ejemplo **Documentos**. No la cambie de lugar después.
2. Abra la carpeta y haga doble clic en:
   - Windows: **Instalar Plotinus.bat**
   - Mac: **Instalar Plotinus.command**
3. Se abrirá una ventana negra que:
   - revisa que Node.js y MongoDB estén instalados (si falta algo, le dice exactamente qué hacer);
   - descarga los componentes del sistema (**requiere internet**, tarda de 1 a 5 minutos);
   - compila la aplicación en esta computadora.
4. Cuando diga **Instalación terminada**, presione Enter (o cualquier tecla) para cerrar.

> **Primera vez en Mac:** si aparece “no se puede abrir porque proviene de un desarrollador no identificado”, haga **clic derecho** sobre el archivo → **Abrir** → **Abrir**. Solo se pide una vez.
>
> **Primera vez en Windows:** si aparece “Windows protegió su PC”, presione **Más información** → **Ejecutar de todas formas**.

---

## 3. Uso diario

1. Haga doble clic en **Iniciar Plotinus** (`.bat` en Windows, `.command` en Mac).
2. Se abre una ventana negra y, segundos después, el sistema en el navegador.
3. **No cierre la ventana negra** mientras usa el sistema (puede minimizarla). Al cerrarla, el sistema se apaga.
4. Si vuelve a hacer doble clic en “Iniciar Plotinus” con el sistema ya abierto, solo se abrirá otra pestaña del navegador.

Consejo: cree un acceso directo en el escritorio. En Windows haga clic derecho en **Iniciar Plotinus.bat** → **Enviar a** → **Escritorio (crear acceso directo)**. En Mac haga clic derecho en **Iniciar Plotinus.command** → **Crear alias** y mueva el alias al escritorio.

### La primera vez que se abre

Un asistente pide:

1. Revisar los **datos del despacho** (nombre, abogado, cédula, domicilio, RFC…). Aparecen en cotizaciones, facturas y contratos. Se pueden cambiar después en **Configuración**.
2. Crear **tres contraseñas** para la sección **Ventas del mes**:
   - la de la **secretaria**,
   - la del **abogado**,
   - la **contraseña maestra** del abogado.

Anótelas en un lugar seguro.

---

## 4. Qué hace cada sección

| Sección | Para qué sirve |
|---|---|
| **Inicio** | Tablero con avisos de las próximas citas y accesos a todo. Media hora antes de una cita aparece un aviso en la parte de arriba. |
| **Clientes** | Alta, búsqueda y edición de clientes. Cada cliente tiene su expediente con citas, documentos, contratos y facturas. |
| **Agenda** | Citas del abogado con calendario. Las citas “programadas” alimentan los avisos del inicio. |
| **Documentos** | Subir PDF (acuerdos descargados del juzgado, demandas, identificaciones…), verlos y descargarlos. Se puede arrastrar el archivo a la ventana. |
| **WhatsApp** | Abre WhatsApp de escritorio. Si no está instalado, abre WhatsApp Web. En la lista de clientes, el ícono de WhatsApp abre el chat con ese cliente. |
| **Sitio web** | Abre plotinus.com.mx. |
| **Servicios en línea** | Despliega en abanico las ligas a PJF (juicio en línea / amparo), CURP, semanas cotizadas del IMSS, SAT, constancia fiscal, validación de RFC y de facturas, Registro Público de Guanajuato, SIGER, actas, Poder Judicial de Guanajuato, Centro Federal de Conciliación, Semanario Judicial, cédula profesional, leyes federales y estatales, y DOF. |
| **Costos de asesoría** | Catálogo de servicios con precio. Se eligen servicios, se escribe el nombre del cliente y se imprime la cotización. Los precios iniciales son **de ejemplo**: ajústelos en la pestaña “Catálogo de precios”. |
| **Ventas del mes** | Totales de facturas e ingresos sin factura del mes y gráfica del año. **Protegida**: pide las contraseñas de la secretaria **y** del abogado, o solo la contraseña maestra. Se cierra sola después de 20 minutos. |
| **Facturas** | Elaborar, imprimir, marcar como pagadas o cancelar facturas. Por ahora **no son facturas electrónicas (CFDI)**; la impresión lo indica. |
| **Contratos** | Generar contratos y escritos con los datos del cliente: prestación de servicios profesionales, compraventa de bien mueble, arrendamiento, reconocimiento de adeudo, pensión alimenticia, carta poder y recibo de honorarios. Las plantillas se pueden modificar o crear nuevas. |
| **Configuración** | Datos del despacho, cambio de contraseñas y datos de conexión a la base de datos. |

### Imprimir

Al presionar **Imprimir** se abre la ventana de impresión del navegador: elija la impresora y presione **Imprimir**. Para guardar en PDF elija la impresora **Guardar como PDF**.
Para que no salgan la fecha y la dirección de la página en las orillas, desmarque **Encabezados y pies de página** en “Más ajustes”.

### WhatsApp

La primera vez el navegador pregunta “¿Abrir WhatsApp?”. Marque **Permitir siempre** y presione **Abrir**.

---

## 5. Contraseñas de “Ventas del mes”

- Para entrar se necesitan **las dos** contraseñas (secretaria + abogado) **o** la **contraseña maestra** sola.
- Para cambiar una contraseña: **Configuración → Cambiar contraseñas**. Se pide la contraseña actual de esa persona o la contraseña maestra.
- **Si la secretaria deja de trabajar en el despacho:** el abogado entra a Configuración, elige “Secretaria”, escribe la **contraseña maestra** como contraseña actual y define una nueva para la nueva secretaria.
- Las contraseñas se guardan cifradas (no se pueden leer ni recuperar).
- **Si se olvidan todas:** abra MongoDB Compass, conéctese (ver sección 6), entre a la base `plotinus`, colección `seguridad`, y elimine el documento `claves`. Al recargar el sistema aparecerá de nuevo el asistente para crear contraseñas. Los datos no se pierden.

---

## 6. Ver los datos con MongoDB Compass

1. Abra **MongoDB Compass**.
2. En “URI” escriba: `mongodb://localhost:27017/plotinus` y presione **Connect**.
3. Abra la base de datos **plotinus**. Colecciones:

| Colección | Contenido |
|---|---|
| `clientes` | Clientes |
| `citas` | Agenda |
| `documentos` | Datos de cada PDF (título, cliente, expediente…) |
| `documentos_archivos.files` / `.chunks` | Los archivos PDF en sí |
| `servicios` | Catálogo de precios |
| `cotizaciones` | Cotizaciones emitidas |
| `facturas` | Facturas |
| `ingresos` | Ingresos sin factura (ventas) |
| `plantillas` / `contratos` | Plantillas y contratos generados |
| `configuracion` | Datos del despacho |
| `seguridad` | Contraseñas cifradas |
| `contadores` | Folios consecutivos |

No modifique datos desde Compass salvo que sepa lo que hace; use el sistema.

---

## 7. Respaldos (muy recomendado)

Toda la información, **incluidos los PDF**, está en la base de datos `plotinus`. Haga un respaldo al menos una vez por semana y guárdelo en una USB o en la nube.

**Con MongoDB Compass (sencillo):** en cada colección use **Export Data → Export the full collection → JSON**. Para restaurar: **Add Data → Import JSON**.

**Con MongoDB Database Tools (respaldo completo en un solo paso, recomendado):** instale las herramientas de <https://www.mongodb.com/try/download/database-tools> (en Mac: `brew install mongodb-database-tools`) y ejecute:

- Respaldar: `mongodump --db plotinus --out respaldo-plotinus`
- Restaurar: `mongorestore --db plotinus respaldo-plotinus/plotinus`

---

## 8. Solución de problemas

| Problema | Solución |
|---|---|
| “Falta instalar Node.js” | Instálelo (sección 1) y vuelva a hacer doble clic. Si acaba de instalarlo, reinicie la computadora. |
| “No se encontró MongoDB funcionando” / el navegador dice “No hay conexión con la base de datos” | Windows: reinicie la computadora, o abra **Servicios** (búsquelo en Inicio), busque **MongoDB Server** y presione **Iniciar**. Mac: en Terminal escriba `brew services start mongodb-community`. La página se reconecta sola. |
| “No se pudieron descargar los componentes” | Revise la conexión a internet y vuelva a ejecutar **Instalar Plotinus**. |
| “El puerto 4000 está ocupado por otro programa” | Reinicie la computadora y vuelva a abrir el sistema. |
| El navegador dice “El sistema no está encendido” | Haga doble clic en **Iniciar Plotinus** y deje la ventana negra abierta. |
| Se cerró la ventana negra por error | Vuelva a hacer doble clic en **Iniciar Plotinus**. |
| WhatsApp no abre la aplicación | Instale WhatsApp de escritorio desde <https://www.whatsapp.com/download>, o use WhatsApp Web, que se abre automáticamente. |
| En Mac, al hacer doble clic se abre un editor de texto en vez de la ventana negra | Abra Terminal, escriba `chmod +x ` (con un espacio al final), arrastre el archivo `.command` a la Terminal y presione Enter. |
| Después de una actualización del sistema algo no funciona | Ejecute **Instalar Plotinus** de nuevo. |

---

## 9. Información técnica (para soporte)

### Arquitectura

- **Frontend:** React 18 + Vite 5 (`client/`). Tipografías Cormorant Garamond e Inter empaquetadas localmente (funciona sin internet). Colores y logotipo tomados de plotinus.com.mx.
- **API:** Node.js + Express 5 (`server/`), Mongoose 8, Multer (subida de archivos), bcryptjs (contraseñas).
- **Base de datos:** MongoDB local, base `plotinus`. Los PDF se guardan con GridFS (`documentos_archivos`), así un solo respaldo de la base incluye todo.
- El servidor sirve la API en `/api` y la aplicación compilada (`client/dist`) en el mismo puerto. Escucha solo en `127.0.0.1` (no es accesible desde otras computadoras de la red).
- Al primer arranque se cargan datos iniciales: datos del despacho, catálogo de servicios de ejemplo y 7 plantillas de documentos (solo si las colecciones están vacías).

### Se compila en la computadora de la oficina

La carpeta se entrega **solo con código fuente** (sin `node_modules` ni `client/dist`). `Instalar Plotinus` (o `Iniciar Plotinus` la primera vez) ejecuta `scripts/preparar.mjs`, que:

1. verifica Node.js ≥ 18.18 (los `.bat`/`.command` revisan antes que Node exista, con `scripts/buscar-node.*`);
2. verifica que MongoDB responda en el puerto configurado y, si no, intenta encenderlo (`brew services start mongodb-community` en Mac, `net start MongoDB` en Windows);
3. ejecuta `npm ci` (versiones exactas de `package-lock.json`) y `npm run build`.

Equivalente manual: `npm ci && npm run build && npm start`.

**Verificación de compilación desde cero:** copie la carpeta sin `node_modules` ni `client/dist`, ejecute `Instalar Plotinus` y después `Iniciar Plotinus`. Debe terminar con “Instalación terminada” y abrir el asistente de primer uso. Así se probó esta versión (Node 18.20, MongoDB 7.0, macOS, caché de npm vacía): instalación y compilación en menos de 10 segundos con internet rápido, y recorrido completo en el navegador (primer uso, clientes, cita con aviso, subida de PDF, cotización, factura, contrato, ventas con ambas contraseñas y con la maestra) sin errores. Windows usa la misma lógica (`scripts/preparar.mjs`); los `.bat` no se ejecutaron en una PC con Windows.

### Variables de entorno (opcionales)

| Variable | Predeterminado | Uso |
|---|---|---|
| `PORT` | `4000` | Puerto del sistema |
| `HOST` | `127.0.0.1` | Use `0.0.0.0` para abrirlo a la red local (no recomendado: el sistema no tiene inicio de sesión general) |
| `MONGODB_URI` | `mongodb://localhost:27017/plotinus` | Conexión a MongoDB |
| `CORS_ORIGIN` | vacío | Origen(es) permitidos si el frontend se publica aparte (ver Vercel) |

Para fijarlas, agréguelas al principio de `Iniciar Plotinus.bat` (`set PORT=4100`) o de `Iniciar Plotinus.command` (`export PORT=4100`).

### Desarrollo

```
npm install
npm run dev:api     # API en http://localhost:4000 (se reinicia al guardar)
npm run dev:web     # Vite en http://localhost:5173 con proxy a la API
```

### Opción Vercel (no recomendada para este caso)

Una página publicada en Vercel no puede conectarse directamente a la base de datos MongoDB de la oficina. Si se desea, el frontend puede publicarse en Vercel (`vercel.json` ya incluido) y llamar a la API local:

1. En Vercel, defina la variable `VITE_API_URL=http://localhost:4000`.
2. En la PC de la oficina, defina `CORS_ORIGIN=https://<su-proyecto>.vercel.app` y siga ejecutando “Iniciar Plotinus”.

Desventajas: solo funciona en la PC donde corre la API (igual que la versión local), depende de internet para cargar la página, y algunos navegadores bloquean que una página de internet consulte `localhost` (Chrome lo permite con avisos de “acceso a red privada”; Safari lo bloquea). Por eso la forma recomendada es la local con “Iniciar Plotinus”.

### Facturación electrónica (CFDI 4.0) — pendiente

El modelo `facturas` ya sigue la estructura del Anexo 20: emisor, receptor (RFC, régimen, C.P., uso CFDI), conceptos con `claveProdServ`, `claveUnidad`, `objetoImp`, traslados y retenciones, forma y método de pago, moneda, lugar de expedición, y un campo `timbre` (UUID, sellos, XML) vacío. Para timbrar falta integrar un PAC (Facturama, SW Sapien, Finkok, etc.) y los certificados CSD del emisor; las claves SAT de cada servicio pueden capturarse desde el catálogo.
