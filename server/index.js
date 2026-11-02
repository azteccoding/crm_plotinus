import express from 'express';
import mongoose from 'mongoose';
import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearRutas } from './rutas.js';
import { sembrarDatosIniciales } from './seed.js';

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '127.0.0.1';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plotinus';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '';
const URL_APP = `http://localhost:${PORT}`;
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client/dist');

function abrirNavegador() {
  if (process.env.ABRIR_NAVEGADOR !== '1') return;
  const cmd = process.platform === 'win32' ? `start "" "${URL_APP}"`
    : process.platform === 'darwin' ? `open "${URL_APP}"` : `xdg-open "${URL_APP}"`;
  exec(cmd);
}

const app = express();
app.disable('x-powered-by');

// Solo se aceptan peticiones dirigidas a esta computadora (evita ataques de "DNS rebinding").
if (HOST === '127.0.0.1') {
  app.use((req, res, next) => {
    const nombre = (req.hostname || '').toLowerCase();
    if (nombre === 'localhost' || nombre === '127.0.0.1') return next();
    res.status(403).send('Acceso no permitido.');
  });
}

// Solo necesario si el frontend se publica aparte (p. ej. en Vercel) y llama a esta API en localhost.
if (CORS_ORIGIN) {
  const permitidos = CORS_ORIGIN.split(',').map((s) => s.trim());
  app.use((req, res, next) => {
    const origen = req.get('Origin');
    if (origen && permitidos.includes(origen)) {
      res.set('Access-Control-Allow-Origin', origen);
      res.set('Vary', 'Origin');
      res.set('Access-Control-Allow-Headers', 'Content-Type, X-Ventas-Token');
      res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.set('Access-Control-Allow-Private-Network', 'true');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
}

app.use(express.json({ limit: '5mb' }));

app.use('/api', (req, res, next) => {
  if (req.path === '/salud' || mongoose.connection.readyState === 1) return next();
  res.status(503).json({ error: 'No hay conexión con la base de datos. Verifique que MongoDB esté encendido.' });
});
app.use('/api', crearRutas());

if (existsSync(DIST)) {
  app.use(express.static(DIST, { index: false, maxAge: '1h' }));
  app.get('/{*ruta}', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
} else {
  app.get('/', (_req, res) => res.type('text').send(
    'La interfaz aún no está compilada. Ejecute el instalador ("Instalar Plotinus") o el comando: npm run build',
  ));
}

app.use((error, _req, res, _next) => {
  let status = error.status || 500;
  let mensaje = error.message;
  if (error.name === 'ValidationError') {
    status = 400;
    mensaje = 'Faltan datos obligatorios o hay valores inválidos: '
      + Object.values(error.errors).map((e) => e.path).join(', ');
  } else if (error.name === 'CastError') {
    status = 400;
    mensaje = 'Identificador o valor inválido.';
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    mensaje = 'El archivo es demasiado grande (máximo 40 MB).';
  } else if (status === 500) {
    console.error(error);
    mensaje = 'Ocurrió un error inesperado en el servidor.';
  }
  res.status(status).json({ error: mensaje });
});

async function conectarMongo() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    await sembrarDatosIniciales();
    console.log(`Base de datos conectada: ${MONGODB_URI}`);
  } catch (e) {
    console.error('\n  No se pudo conectar a MongoDB en', MONGODB_URI);
    console.error('  Verifique que MongoDB esté instalado y encendido. Reintentando en 10 segundos...\n');
    setTimeout(conectarMongo, 10000);
  }
}

mongoose.connection.on('disconnected', () => console.warn('Se perdió la conexión con MongoDB.'));

const servidor = app.listen(PORT, HOST, (error) => {
  if (error) return;
  console.log('\n  ==============================================');
  console.log('   Plotinus CRM está funcionando');
  console.log(`   Abra en su navegador: ${URL_APP}`);
  console.log('   Para cerrar el sistema, cierre esta ventana.');
  console.log('  ==============================================\n');
  abrirNavegador();
  conectarMongo();
});

servidor.on('error', async (e) => {
  if (e.code !== 'EADDRINUSE') throw e;
  const esPlotinus = await fetch(`http://127.0.0.1:${PORT}/api/salud`).then((r) => r.json()).then((j) => j.ok === true).catch(() => false);
  if (esPlotinus) {
    console.log(`\n  Plotinus CRM ya está abierto en otra ventana. Abriendo ${URL_APP} ...\n`);
    abrirNavegador();
    setTimeout(() => process.exit(0), 1500);
  } else {
    console.error(`\n  El puerto ${PORT} está ocupado por otro programa.`);
    console.error('  Cierre ese programa o reinicie la computadora y vuelva a intentarlo.\n');
    process.exit(1);
  }
});
