import { useCallback, useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { api, hora } from './api.js';
import { Icono, Marca, ProveedorAvisos, ProveedorConfig, ProveedorImpresion } from './components/ui.jsx';
import Tablero from './pages/Tablero.jsx';
import Clientes, { DetalleCliente } from './pages/Clientes.jsx';
import Agenda from './pages/Agenda.jsx';
import Documentos from './pages/Documentos.jsx';
import Costos from './pages/Costos.jsx';
import Ventas from './pages/Ventas.jsx';
import Facturas from './pages/Facturas.jsx';
import Contratos from './pages/Contratos.jsx';
import Configuracion from './pages/Configuracion.jsx';
import PrimerUso from './pages/PrimerUso.jsx';

const MENU = [
  ['/', 'inicio', 'Inicio'],
  ['/clientes', 'clientes', 'Clientes'],
  ['/agenda', 'agenda', 'Agenda'],
  ['/documentos', 'documentos', 'Documentos'],
  ['/contratos', 'contratos', 'Contratos'],
  ['/costos', 'costos', 'Costos de asesoría'],
  ['/facturas', 'facturas', 'Facturas'],
  ['/ventas', 'ventas', 'Ventas del mes'],
];

function PantallaSinConexion({ estado, reintentar }) {
  const sinServidor = estado === 'sin-servidor';
  return (
    <div className="pantalla">
      <div className="pantalla-caja">
        <Marca oscura />
        <h1>{sinServidor ? 'El sistema no está encendido' : 'No hay conexión con la base de datos'}</h1>
        {sinServidor ? (
          <ol className="instrucciones">
            <li>Abra la carpeta <strong>plotinus</strong>.</li>
            <li>Haga doble clic en <strong>Iniciar Plotinus</strong>.</li>
            <li>Deje abierta la ventana negra que aparece; esta página se actualizará sola.</li>
          </ol>
        ) : (
          <ol className="instrucciones">
            <li>Verifique que <strong>MongoDB</strong> esté instalado en esta computadora.</li>
            <li>En Windows: reinicie la computadora o abra “Servicios” y encienda <strong>MongoDB Server</strong>.</li>
            <li>En Mac: abra Terminal y escriba <code>brew services start mongodb-community</code>.</li>
            <li>Esta página volverá a intentar la conexión automáticamente.</li>
          </ol>
        )}
        <p className="muted chico">Si el problema continúa, consulte la sección “Solución de problemas” del archivo README.</p>
        <button type="button" className="btn btn-oscuro" onClick={reintentar}>Reintentar ahora</button>
      </div>
    </div>
  );
}

function BannerCita() {
  const [cita, setCita] = useState(null);
  const [descartadas, setDescartadas] = useState(() => new Set());
  useEffect(() => {
    const revisar = () => api('/citas/proximas?limite=3').then((citas) => {
      const ahora = Date.now();
      const pronto = citas.find((c) => {
        const faltan = new Date(c.inicio).getTime() - ahora;
        return faltan <= 30 * 60 * 1000 && faltan > -10 * 60 * 1000;
      });
      setCita(pronto || null);
    }).catch(() => {});
    revisar();
    const t = setInterval(revisar, 60 * 1000);
    return () => clearInterval(t);
  }, []);
  if (!cita || descartadas.has(cita._id)) return null;
  const minutos = Math.round((new Date(cita.inicio).getTime() - Date.now()) / 60000);
  return (
    <div className="banner-cita" role="alert">
      <Icono nombre="campana" />
      <div>
        <strong>{minutos > 0 ? `Cita en ${minutos} min` : 'Cita en curso'}</strong> · {hora(cita.inicio)} · {cita.titulo}
        {cita.cliente?.nombre ? ` — ${cita.cliente.nombre}` : ''}{cita.lugar ? ` (${cita.lugar})` : ''}
        {cita.notas && <div className="chico" style={{ whiteSpace: 'pre-wrap' }}>{cita.notas}</div>}
      </div>
      <button type="button" className="btn-icono" aria-label="Ocultar aviso"
        onClick={() => setDescartadas((s) => new Set(s).add(cita._id))}><Icono nombre="cerrar" /></button>
    </div>
  );
}

function Estructura() {
  return (
    <div className="app">
      <aside className="lateral">
        <Marca />
        <nav className="menu">
          {MENU.map(([ruta, icono, texto]) => (
            <NavLink key={ruta} to={ruta} end={ruta === '/'} title={texto}>
              <Icono nombre={icono} /><span>{texto}</span>
            </NavLink>
          ))}
          <div className="menu-separador" />
          <NavLink to="/configuracion" title="Configuración"><Icono nombre="ajustes" /><span>Configuración</span></NavLink>
        </nav>
        <div className="lateral-pie">Sistema de clientes · v1.0</div>
      </aside>
      <main className="contenido">
        <BannerCita />
        <Routes>
          <Route path="/" element={<Tablero />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<DetalleCliente />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/documentos" element={<Documentos />} />
          <Route path="/costos" element={<Costos />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/facturas" element={<Facturas />} />
          <Route path="/contratos" element={<Contratos />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="*" element={<Tablero />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [estado, setEstado] = useState('cargando');

  const verificar = useCallback(async () => {
    try {
      const salud = await api('/salud');
      if (salud.db !== 'conectada') return setEstado('sin-db');
      const seg = await api('/seguridad/estado');
      setEstado(seg.configurado ? 'listo' : 'primer-uso');
    } catch {
      setEstado('sin-servidor');
    }
  }, []);

  useEffect(() => { verificar(); }, [verificar]);
  useEffect(() => {
    if (estado !== 'sin-db' && estado !== 'sin-servidor') return undefined;
    const t = setInterval(verificar, 5000);
    return () => clearInterval(t);
  }, [estado, verificar]);

  if (estado === 'cargando') return <div className="pantalla"><Marca /></div>;
  if (estado === 'sin-db' || estado === 'sin-servidor') return <PantallaSinConexion estado={estado} reintentar={verificar} />;

  return (
    <ProveedorAvisos>
      <ProveedorConfig>
        <ProveedorImpresion>
          {estado === 'primer-uso' ? <PrimerUso alTerminar={verificar} /> : <Estructura />}
        </ProveedorImpresion>
      </ProveedorConfig>
    </ProveedorAvisos>
  );
}
