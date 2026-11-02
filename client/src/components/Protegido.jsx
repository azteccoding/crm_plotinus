import { useCallback, useEffect, useState } from 'react';
import { api, setTokenVentas } from '../api.js';
import { Boton, Campo, Icono, Pestanas } from './ui.jsx';

// Una sola sesión protegida (20 min) abre Ventas, el catálogo de precios y Configuración.
const CLAVE_SESION = 'plotinus-ventas';

function leerSesion() {
  try {
    const s = JSON.parse(sessionStorage.getItem(CLAVE_SESION));
    return s && s.expira > Date.now() ? s : null;
  } catch { return null; }
}

export function useSesionProtegida() {
  const [sesion, setSesion] = useState(leerSesion);

  const abrir = useCallback((s) => { sessionStorage.setItem(CLAVE_SESION, JSON.stringify(s)); setSesion(s); }, []);
  const cerrar = useCallback(() => {
    api('/seguridad/salir', { method: 'POST' }).catch(() => {});
    sessionStorage.removeItem(CLAVE_SESION);
    setTokenVentas(null);
    setSesion(null);
  }, []);

  useEffect(() => {
    setTokenVentas(sesion?.token || null);
    return () => setTokenVentas(null);
  }, [sesion]);

  return { sesion, abrir, cerrar };
}

export function Candado({ titulo, onAbrir }) {
  const [modo, setModo] = useState('ambas');
  const [secretaria, setSecretaria] = useState('');
  const [abogado, setAbogado] = useState('');
  const [superClave, setSuper] = useState('');
  const [error, setError] = useState('');

  const entrar = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const body = modo === 'ambas' ? { secretaria, abogado } : { superClave };
      onAbrir(await api('/seguridad/desbloquear', { method: 'POST', body }));
    } catch (er) { setError(er.message); }
  };

  return (
    <div className="candado">
      <div className="tarjeta">
        <div className="candado-icono"><Icono nombre="candado" tam={24} /></div>
        <h1 style={{ fontSize: '2rem' }}>{titulo}</h1>
        <p className="muted">Esta sección está protegida. Se requieren las dos contraseñas, o la contraseña maestra del abogado.</p>
        <Pestanas valor={modo} onCambio={(m) => { setModo(m); setError(''); }} opciones={[['ambas', 'Secretaria + abogado'], ['super', 'Contraseña maestra']]} />
        {error && <div className="error-caja">{error}</div>}
        <form className="formulario" onSubmit={entrar}>
          {modo === 'ambas' ? (
            <>
              <Campo etiqueta="Contraseña de la secretaria" ancho="completo"><input type="password" value={secretaria} onChange={(e) => setSecretaria(e.target.value)} required autoFocus autoComplete="off" /></Campo>
              <Campo etiqueta="Contraseña del abogado" ancho="completo"><input type="password" value={abogado} onChange={(e) => setAbogado(e.target.value)} required autoComplete="off" /></Campo>
            </>
          ) : (
            <Campo etiqueta="Contraseña maestra del abogado" ancho="completo"><input type="password" value={superClave} onChange={(e) => setSuper(e.target.value)} required autoFocus autoComplete="off" /></Campo>
          )}
          <div className="campo-completo"><Boton type="submit" icono="candado" style={{ width: '100%' }}>Entrar</Boton></div>
        </form>
      </div>
    </div>
  );
}
