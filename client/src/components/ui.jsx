import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api.js';

const RUTAS_ICONOS = {
  inicio: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  clientes: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  agenda: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  documentos: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',
  globo: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  whatsapp: 'M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5zM8.5 8.5c0 3.5 3.5 7 7 7l1.2-1.6-2.2-1.1-1 1c-1.2-.5-2.3-1.6-2.8-2.8l1-1-1.1-2.2z',
  web: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  costos: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01',
  ventas: 'M3 3v18h18M7 15l4-4 3 3 6-6',
  facturas: 'M4 2v20l3-2 3 2 2-2 2 2 3-2 3 2V2l-3 2-3-2-2 2-2-2-3 2zM8 8h8M8 12h8M8 16h5',
  contratos: 'M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z',
  ajustes: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  campana: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  mas: 'M12 5v14M5 12h14',
  buscar: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  borrar: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  editar: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z',
  imprimir: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  descargar: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  ver: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  candado: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0v4',
  cerrar: 'M18 6 6 18M6 6l12 12',
  subir: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  reloj: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  flecha: 'M5 12h14M12 5l7 7-7 7',
  izq: 'M15 18l-6-6 6-6',
  der: 'M9 18l6-6-6-6',
};

export function Icono({ nombre, tam = 20, className = '' }) {
  return (
    <svg className={`icono ${className}`} width={tam} height={tam} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={RUTAS_ICONOS[nombre]} />
    </svg>
  );
}

export function Marca({ oscura = false, compacta = false }) {
  return (
    <span className={`marca ${oscura ? 'marca-oscura' : ''}`}>
      <span className="marca-p">P</span>
      {!compacta && (
        <span className="marca-texto">
          <span className="marca-nombre">Plotinus</span>
          <span className="marca-lema">Consultoría Jurídica</span>
        </span>
      )}
    </span>
  );
}

export function Encabezado({ titulo, subtitulo, children }) {
  return (
    <header className="encabezado">
      <div>
        <h1>{titulo}</h1>
        {subtitulo && <p className="sub">{subtitulo}</p>}
      </div>
      <div className="acciones">{children}</div>
    </header>
  );
}

export function Boton({ icono, children, variante = 'primario', className = '', ...props }) {
  return (
    <button type="button" className={`btn btn-${variante} ${className}`} {...props}>
      {icono && <Icono nombre={icono} tam={17} />}
      {children && <span>{children}</span>}
    </button>
  );
}

export function Campo({ etiqueta, ayuda, children, ancho }) {
  return (
    <label className={`campo ${ancho ? `campo-${ancho}` : ''}`}>
      <span className="campo-etiqueta">{etiqueta}</span>
      {children}
      {ayuda && <span className="campo-ayuda">{ayuda}</span>}
    </label>
  );
}

export function Modal({ titulo, onCerrar, children, pie, ancho = 'md' }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onCerrar]);
  return createPortal(
    <div className="modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className={`modal modal-${ancho}`} role="dialog" aria-modal="true">
        <div className="modal-cabeza">
          <h2>{titulo}</h2>
          <button type="button" className="btn-icono" onClick={onCerrar} aria-label="Cerrar"><Icono nombre="cerrar" /></button>
        </div>
        <div className="modal-cuerpo">{children}</div>
        {pie && <div className="modal-pie">{pie}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Vacio({ icono = 'documentos', titulo, children }) {
  return (
    <div className="vacio">
      <Icono nombre={icono} tam={36} />
      <strong>{titulo}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Buscador({ valor, onCambio, placeholder = 'Buscar…' }) {
  return (
    <div className="buscador">
      <Icono nombre="buscar" tam={17} />
      <input value={valor} onChange={(e) => onCambio(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export function Pestanas({ opciones, valor, onCambio }) {
  return (
    <div className="pestanas" role="tablist">
      {opciones.map(([clave, texto]) => (
        <button key={clave} type="button" role="tab" aria-selected={valor === clave}
          className={valor === clave ? 'activa' : ''} onClick={() => onCambio(clave)}>{texto}</button>
      ))}
    </div>
  );
}

// ---------- Avisos (toasts) ----------
const AvisosCtx = createContext(() => {});
export const useAviso = () => useContext(AvisosCtx);

export function ProveedorAvisos({ children }) {
  const [avisos, setAvisos] = useState([]);
  const avisar = useCallback((texto, tipo = 'ok') => {
    const id = Math.random();
    setAvisos((a) => [...a, { id, texto, tipo }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), tipo === 'error' ? 6000 : 3000);
  }, []);
  return (
    <AvisosCtx.Provider value={avisar}>
      {children}
      <div className="avisos">
        {avisos.map((a) => <div key={a.id} className={`aviso aviso-${a.tipo}`}>{a.texto}</div>)}
      </div>
    </AvisosCtx.Provider>
  );
}

// ---------- Configuración del despacho ----------
const ConfigCtx = createContext({ config: {}, recargar: () => {} });
export const useConfig = () => useContext(ConfigCtx);

export function ProveedorConfig({ children }) {
  const [config, setConfig] = useState({});
  const recargar = useCallback(() => api('/config').then(setConfig).catch(() => {}), []);
  useEffect(() => { recargar(); }, [recargar]);
  const valor = useMemo(() => ({ config, recargar }), [config, recargar]);
  return <ConfigCtx.Provider value={valor}>{children}</ConfigCtx.Provider>;
}

// ---------- Impresión ----------
const ImprimirCtx = createContext(() => {});
export const useImprimir = () => useContext(ImprimirCtx);

export function ProveedorImpresion({ children }) {
  const [contenido, setContenido] = useState(null);
  const pendiente = useRef(false);
  const imprimir = useCallback((nodo) => { pendiente.current = true; setContenido(nodo); }, []);
  useEffect(() => {
    if (!contenido || !pendiente.current) return;
    pendiente.current = false;
    const t = setTimeout(() => window.print(), 80);
    return () => clearTimeout(t);
  }, [contenido]);
  useEffect(() => {
    const limpiar = () => setContenido(null);
    window.addEventListener('afterprint', limpiar);
    return () => window.removeEventListener('afterprint', limpiar);
  }, []);
  return (
    <ImprimirCtx.Provider value={imprimir}>
      {children}
      {contenido && createPortal(<div className="hoja">{contenido}</div>, document.getElementById('impresion'))}
    </ImprimirCtx.Provider>
  );
}

export function Membrete({ titulo, folio, fecha }) {
  const { config } = useConfig();
  return (
    <div className="membrete">
      <div className="membrete-izq">
        <Marca oscura />
        <div className="membrete-datos">
          {config.abogado && <div>{config.abogado}{config.cedula ? ` · Céd. Prof. ${config.cedula}` : ''}</div>}
          {config.domicilio && <div>{config.domicilio}</div>}
          <div>{[config.telefono, config.email, config.sitioWeb?.replace(/^https?:\/\//, '')].filter(Boolean).join(' · ')}</div>
        </div>
      </div>
      {titulo && (
        <div className="membrete-der">
          <div className="membrete-titulo">{titulo}</div>
          {folio && <div>Folio: <strong>{folio}</strong></div>}
          {fecha && <div>{fecha}</div>}
        </div>
      )}
    </div>
  );
}

// ---------- Selector de cliente ----------
export function useClientes() {
  const [clientes, setClientes] = useState([]);
  const recargar = useCallback(() => api('/clientes').then(setClientes).catch(() => {}), []);
  useEffect(() => { recargar(); }, [recargar]);
  return [clientes, recargar];
}

export function SelectorCliente({ clientes, valor, onCambio, opcional = false, required }) {
  return (
    <select value={valor || ''} onChange={(e) => onCambio(e.target.value)} required={required}>
      <option value="">{opcional ? '— Sin cliente —' : 'Seleccione un cliente…'}</option>
      {clientes.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
    </select>
  );
}

export function useConfirmar() {
  return (mensaje) => window.confirm(mensaje);
}
