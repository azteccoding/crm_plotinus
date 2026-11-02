// Uso: node scripts/preparar.mjs instalar | iniciar
// Lo ejecutan "Instalar Plotinus" e "Iniciar Plotinus" (macOS y Windows).
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ES_WINDOWS = process.platform === 'win32';
const ES_MAC = process.platform === 'darwin';
const NODE_MINIMO = [18, 18];
const modo = process.argv[2] || 'iniciar';

const linea = () => console.log('  ' + '─'.repeat(58));
const titulo = (t) => { console.log(''); linea(); console.log(`   ${t}`); linea(); };
const paso = (t) => console.log(`\n  » ${t}`);
const ok = (t) => console.log(`    ✔ ${t}`);
const aviso = (t) => console.log(`    ! ${t}`);

function fallar(mensaje, pasos = []) {
  console.log('');
  linea();
  console.log('   NO SE PUDO COMPLETAR');
  linea();
  console.log(`\n  ${mensaje}\n`);
  pasos.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));
  console.log('\n  Consulte la sección "Solución de problemas" del archivo README.\n');
  process.exit(1);
}

function ejecutar(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: RAIZ, stdio: 'inherit', shell: ES_WINDOWS });
  return r.status === 0;
}

function revisarNode() {
  const [ma, mi] = process.versions.node.split('.').map(Number);
  if (ma < NODE_MINIMO[0] || (ma === NODE_MINIMO[0] && mi < NODE_MINIMO[1])) {
    fallar(`La versión de Node.js instalada (${process.versions.node}) es muy antigua.`, [
      'Entre a https://nodejs.org y descargue la versión "LTS".',
      'Instálela con las opciones predeterminadas.',
      'Vuelva a hacer doble clic en este instalador.',
    ]);
  }
  ok(`Node.js ${process.versions.node}`);
}

function puertoAbierto(host, puerto, ms = 1500) {
  return new Promise((resolve) => {
    const s = net.connect({ host, port: puerto });
    const fin = (v) => { s.destroy(); resolve(v); };
    s.setTimeout(ms, () => fin(false));
    s.once('connect', () => fin(true));
    s.once('error', () => fin(false));
  });
}

function datosMongo() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plotinus';
  const m = uri.match(/^mongodb:\/\/(?:[^@/]+@)?([^:/,]+)(?::(\d+))?/);
  const host = !m?.[1] || m[1] === 'localhost' ? '127.0.0.1' : m[1];
  return { uri, host, puerto: Number(m?.[2]) || 27017 };
}

// Si MongoDB se instaló sin el servicio de Windows, se enciende mongod.exe directamente en segundo plano.
function encenderMongodWindows(puerto) {
  const base = path.join(process.env.ProgramFiles || 'C:\\Program Files', 'MongoDB', 'Server');
  if (!existsSync(base)) return;
  const versiones = readdirSync(base)
    .filter((v) => existsSync(path.join(base, v, 'bin', 'mongod.exe')))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  if (!versiones.length) return;
  const datos = 'C:\\data\\db';
  mkdirSync(datos, { recursive: true });
  const hijo = spawn(path.join(base, versiones[0], 'bin', 'mongod.exe'),
    ['--dbpath', datos, '--bind_ip', '127.0.0.1', '--port', String(puerto)],
    { detached: true, stdio: 'ignore', windowsHide: true });
  hijo.on('error', () => {});
  hijo.unref();
}

async function revisarMongo({ estricto }) {
  const { uri, host, puerto } = datosMongo();
  if (await puertoAbierto(host, puerto)) { ok(`MongoDB responde en ${host}:${puerto}`); return true; }

  aviso('MongoDB no responde. Intentando encenderlo…');
  if (ES_MAC) spawnSync('brew', ['services', 'start', 'mongodb-community'], { stdio: 'ignore' });
  if (ES_WINDOWS) {
    spawnSync('net', ['start', 'MongoDB'], { stdio: 'ignore', shell: true });
    if (!(await puertoAbierto(host, puerto)) && host === '127.0.0.1') encenderMongodWindows(puerto);
  }
  for (let i = 0; i < 15; i += 1) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await puertoAbierto(host, puerto)) { ok(`MongoDB encendido en ${host}:${puerto}`); return true; }
  }

  const pasos = ES_WINDOWS ? [
    'Si no ha instalado MongoDB: descargue "MongoDB Community Server" (archivo .msi) de https://www.mongodb.com/try/download/community',
    'Durante la instalación deje marcada la opción "Install MongoD as a Service".',
    'Si ya está instalado: reinicie la computadora, o abra "Servicios" de Windows y encienda "MongoDB Server".',
  ] : ES_MAC ? [
    'Si no ha instalado MongoDB, abra la aplicación Terminal y escriba:',
    '   brew tap mongodb/brew && brew install mongodb-community',
    'Para encenderlo escriba:  brew services start mongodb-community',
  ] : ['Instale MongoDB Community Server y enciéndalo.'];

  if (estricto) fallar(`No se encontró MongoDB funcionando (${uri}).`, pasos);
  aviso(`No se encontró MongoDB funcionando (${uri}).`);
  pasos.forEach((p) => console.log(`      - ${p}`));
  aviso('El sistema abrirá de todos modos y se conectará en cuanto MongoDB esté encendido.');
  return false;
}

function instalar() {
  paso('Descargando componentes (puede tardar varios minutos la primera vez)…');
  const npm = ES_WINDOWS ? 'npm.cmd' : 'npm';
  const args = existsSync(path.join(RAIZ, 'package-lock.json')) ? ['ci'] : ['install'];
  if (!ejecutar(npm, [...args, '--no-audit', '--no-fund', '--no-update-notifier', '--loglevel=error'])) {
    fallar('No se pudieron descargar los componentes del sistema.', [
      'Verifique que la computadora tenga conexión a internet.',
      'Si usa antivirus o red de oficina con restricciones, permita el acceso a registry.npmjs.org.',
      'Vuelva a hacer doble clic en "Instalar Plotinus".',
    ]);
  }
  ok('Componentes instalados');

  paso('Compilando la aplicación…');
  if (!ejecutar(npm, ['run', 'build', '--silent', '--', '--logLevel', 'warn'])) {
    fallar('Ocurrió un error al compilar la aplicación.', [
      'Vuelva a ejecutar "Instalar Plotinus".',
      'Si el error continúa, envíe una foto de esta ventana a soporte.',
    ]);
  }
  ok('Aplicación compilada');
}

const instalado = () => existsSync(path.join(RAIZ, 'node_modules', 'express'))
  && existsSync(path.join(RAIZ, 'client', 'dist', 'index.html'));

if (modo === 'instalar') {
  titulo('Instalación de Plotinus CRM');
  paso('Revisando requisitos…');
  revisarNode();
  await revisarMongo({ estricto: false });
  instalar();
  titulo('Instalación terminada');
  console.log('\n  Para usar el sistema haga doble clic en "Iniciar Plotinus".\n');
} else {
  titulo('Iniciando Plotinus CRM');
  revisarNode();
  if (!instalado()) {
    aviso('Es la primera vez que se abre: se instalará automáticamente.');
    instalar();
  }
  await revisarMongo({ estricto: false });
  process.env.ABRIR_NAVEGADOR ??= '1';
  await import('../server/index.js');
}
