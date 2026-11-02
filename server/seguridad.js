import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { Seguridad } from './models.js';

const MIN_LARGO = 6;
const DURACION_SESION_MS = 20 * 60 * 1000;
const MAX_INTENTOS = 5;
const BLOQUEO_MS = 60 * 1000;

const sesiones = new Map();
let intentosFallidos = 0;
let bloqueadoHasta = 0;

const err = (status, mensaje) => Object.assign(new Error(mensaje), { status });

async function obtenerClaves() {
  return Seguridad.findById('claves').lean();
}

function validarNueva(clave, etiqueta) {
  if (typeof clave !== 'string' || clave.length < MIN_LARGO) {
    throw err(400, `La contraseña ${etiqueta} debe tener al menos ${MIN_LARGO} caracteres.`);
  }
}

const coincide = (texto, hash) => Boolean(texto && hash) && bcrypt.compare(String(texto), hash);

function revisarBloqueo() {
  if (Date.now() < bloqueadoHasta) {
    const seg = Math.ceil((bloqueadoHasta - Date.now()) / 1000);
    throw err(429, `Demasiados intentos fallidos. Espere ${seg} segundos.`);
  }
}

function registrarFallo() {
  intentosFallidos += 1;
  if (intentosFallidos >= MAX_INTENTOS) {
    bloqueadoHasta = Date.now() + BLOQUEO_MS;
    intentosFallidos = 0;
  }
}

export function requiereAccesoVentas(req, _res, next) {
  const token = req.get('X-Ventas-Token');
  const expira = token && sesiones.get(token);
  if (!expira || expira < Date.now()) {
    if (token) sesiones.delete(token);
    return next(err(401, 'La sesión de ventas expiró. Vuelva a ingresar las contraseñas.'));
  }
  next();
}

export const rutasSeguridad = Router();

rutasSeguridad.get('/estado', async (_req, res) => {
  const c = await obtenerClaves();
  res.json({ configurado: Boolean(c?.secretariaHash && c?.abogadoHash && c?.superHash) });
});

rutasSeguridad.post('/configurar', async (req, res) => {
  if (await obtenerClaves()) throw err(409, 'Las contraseñas ya fueron configuradas.');
  const { secretaria, abogado, superClave } = req.body;
  validarNueva(secretaria, 'de la secretaria');
  validarNueva(abogado, 'del abogado');
  validarNueva(superClave, 'maestra');
  if (new Set([secretaria, abogado, superClave]).size < 3) {
    throw err(400, 'Las tres contraseñas deben ser distintas entre sí.');
  }
  await Seguridad.create({
    _id: 'claves',
    secretariaHash: await bcrypt.hash(secretaria, 10),
    abogadoHash: await bcrypt.hash(abogado, 10),
    superHash: await bcrypt.hash(superClave, 10),
  });
  res.status(201).json({ ok: true });
});

rutasSeguridad.post('/desbloquear', async (req, res) => {
  revisarBloqueo();
  const c = await obtenerClaves();
  if (!c) throw err(409, 'Primero configure las contraseñas.');
  const { secretaria, abogado, superClave } = req.body;
  const valido = superClave
    ? await coincide(superClave, c.superHash)
    : (await coincide(secretaria, c.secretariaHash)) && (await coincide(abogado, c.abogadoHash));
  if (!valido) {
    registrarFallo();
    throw err(401, 'Contraseña incorrecta.');
  }
  intentosFallidos = 0;
  const token = crypto.randomBytes(24).toString('hex');
  const expira = Date.now() + DURACION_SESION_MS;
  sesiones.set(token, expira);
  res.json({ token, expira });
});

rutasSeguridad.post('/salir', (req, res) => {
  sesiones.delete(req.get('X-Ventas-Token'));
  res.json({ ok: true });
});

const CAMPOS = { secretaria: 'secretariaHash', abogado: 'abogadoHash', super: 'superHash' };

rutasSeguridad.post('/cambiar', async (req, res) => {
  revisarBloqueo();
  const { quien, actual, nueva } = req.body;
  const campo = CAMPOS[quien];
  if (!campo) throw err(400, 'Indique qué contraseña desea cambiar.');
  const c = await obtenerClaves();
  if (!c) throw err(409, 'Primero configure las contraseñas.');
  // La contraseña maestra autoriza cambiar cualquiera; las demás, solo la propia.
  const autorizado = (await coincide(actual, c.superHash))
    || (quien !== 'super' && (await coincide(actual, c[campo])));
  if (!autorizado) {
    registrarFallo();
    throw err(401, 'La contraseña actual es incorrecta.');
  }
  validarNueva(nueva, 'nueva');
  const otras = Object.entries(CAMPOS).filter(([k]) => k !== quien).map(([, f]) => c[f]);
  for (const h of otras) {
    if (await coincide(nueva, h)) throw err(400, 'La nueva contraseña debe ser distinta de las otras dos.');
  }
  await Seguridad.updateOne({ _id: 'claves' }, { [campo]: await bcrypt.hash(nueva, 10) });
  intentosFallidos = 0;
  res.json({ ok: true });
});
