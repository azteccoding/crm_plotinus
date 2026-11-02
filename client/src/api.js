export const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

let tokenVentas = null;
export const setTokenVentas = (t) => { tokenVentas = t; };

export async function api(ruta, { method = 'GET', body, form } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (tokenVentas) headers['X-Ventas-Token'] = tokenVentas;
  let res;
  try {
    res = await fetch(`${BASE}/api${ruta}`, {
      method,
      headers,
      body: form || (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw Object.assign(new Error('No se pudo contactar al sistema. ¿Está abierta la ventana de Plotinus?'), { status: 0 });
  }
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(datos.error || `Error ${res.status}`), { status: res.status });
  return datos;
}

export const urlArchivo = (id, descargar) => `${BASE}/api/documentos/${id}/archivo${descargar ? '?descargar=1' : ''}`;

const fmtMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
export const moneda = (n) => fmtMoneda.format(Number(n) || 0);

export const fecha = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  d ? new Date(d).toLocaleDateString('es-MX', opts) : '';
export const fechaLarga = (d = new Date()) =>
  new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
export const hora = (d) => new Date(d).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
export const fechaHora = (d) => `${fecha(d, { weekday: 'short', day: 'numeric', month: 'short' })}, ${hora(d)}`;

const pad = (n) => String(n).padStart(2, '0');
export const aInputFecha = (d) => {
  if (!d) return '';
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};
export const aInputFechaHora = (d) => {
  if (!d) return '';
  const x = new Date(d);
  return `${aInputFecha(x)}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
};
export const mesActual = () => aInputFecha(new Date()).slice(0, 7);

export const tamanoArchivo = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.ceil((b || 0) / 1024)} KB`);

export function abrirWhatsApp(telefono) {
  const num = telefono ? String(telefono).replace(/\D/g, '') : '';
  const conPais = num && num.length === 10 ? `52${num}` : num;
  const urlApp = conPais ? `whatsapp://send?phone=${conPais}` : 'whatsapp://';
  const urlWeb = conPais ? `https://web.whatsapp.com/send?phone=${conPais}` : 'https://web.whatsapp.com/';
  let abrioApp = false;
  const marcar = () => { abrioApp = true; };
  window.addEventListener('blur', marcar, { once: true });
  document.addEventListener('visibilitychange', marcar, { once: true });
  window.location.href = urlApp;
  setTimeout(() => {
    window.removeEventListener('blur', marcar);
    document.removeEventListener('visibilitychange', marcar);
    if (!abrioApp) window.open(urlWeb, '_blank', 'noopener');
  }, 2500);
}
