import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { REGIMENES } from '../catalogos.js';
import { Boton, Campo, Encabezado, useAviso, useConfig } from '../components/ui.jsx';
import { Candado, useSesionProtegida } from '../components/Protegido.jsx';

export function CamposDespacho({ d, setD }) {
  const cambiar = (c) => (e) => setD({ ...d, [c]: e.target.value });
  return (
    <>
      <Campo etiqueta="Nombre del despacho" ancho="completo"><input value={d.nombreDespacho || ''} onChange={cambiar('nombreDespacho')} /></Campo>
      <Campo etiqueta="Abogado responsable"><input value={d.abogado || ''} onChange={cambiar('abogado')} /></Campo>
      <Campo etiqueta="Cédula profesional"><input value={d.cedula || ''} onChange={cambiar('cedula')} /></Campo>
      <Campo etiqueta="Domicilio" ancho="completo"><input value={d.domicilio || ''} onChange={cambiar('domicilio')} /></Campo>
      <Campo etiqueta="Ciudad (para contratos)" ancho="tercio"><input value={d.ciudad || ''} onChange={cambiar('ciudad')} /></Campo>
      <Campo etiqueta="Teléfono" ancho="tercio"><input value={d.telefono || ''} onChange={cambiar('telefono')} /></Campo>
      <Campo etiqueta="Correo" ancho="tercio"><input value={d.email || ''} onChange={cambiar('email')} /></Campo>
      <Campo etiqueta="RFC del emisor (facturas)" ancho="tercio"><input value={d.rfc || ''} onChange={(e) => setD({ ...d, rfc: e.target.value.toUpperCase() })} maxLength={13} /></Campo>
      <Campo etiqueta="Régimen fiscal" ancho="tercio">
        <select value={d.regimenFiscal || ''} onChange={cambiar('regimenFiscal')}>
          <option value="">—</option>
          {REGIMENES.map(([k, v]) => <option key={k} value={k}>{k} - {v}</option>)}
        </select>
      </Campo>
      <Campo etiqueta="C.P. de expedición" ancho="tercio"><input value={d.codigoPostal || ''} onChange={cambiar('codigoPostal')} maxLength={5} /></Campo>
      <Campo etiqueta="Sitio web" ancho="tercio"><input value={d.sitioWeb || ''} onChange={cambiar('sitioWeb')} /></Campo>
      <Campo etiqueta="Serie de facturas" ancho="tercio"><input value={d.serieFactura || ''} onChange={cambiar('serieFactura')} maxLength={5} /></Campo>
      <Campo etiqueta="WhatsApp del despacho" ancho="tercio"><input value={d.whatsapp || ''} onChange={cambiar('whatsapp')} /></Campo>
      <Campo etiqueta="Leyenda al pie de cotizaciones" ancho="completo"><textarea rows={2} value={d.notasCotizacion || ''} onChange={cambiar('notasCotizacion')} /></Campo>
    </>
  );
}

function CambiarClave() {
  const avisar = useAviso();
  const [quien, setQuien] = useState('secretaria');
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [error, setError] = useState('');

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    if (nueva !== repetir) { setError('La nueva contraseña no coincide en los dos campos.'); return; }
    try {
      await api('/seguridad/cambiar', { method: 'POST', body: { quien, actual, nueva } });
      avisar('Contraseña actualizada');
      setActual(''); setNueva(''); setRepetir('');
    } catch (er) { setError(er.message); }
  };

  return (
    <section className="tarjeta">
      <h2>Cambiar contraseñas de “Ventas del mes”</h2>
      <p className="muted chico">Para cambiar una contraseña escriba la contraseña actual de esa persona, o la contraseña maestra del abogado (útil si la secretaria ya no trabaja en el despacho).</p>
      {error && <div className="error-caja">{error}</div>}
      <form className="formulario" onSubmit={guardar}>
        <Campo etiqueta="Contraseña a cambiar" ancho="completo">
          <select value={quien} onChange={(e) => setQuien(e.target.value)}>
            <option value="secretaria">Secretaria</option>
            <option value="abogado">Abogado</option>
            <option value="super">Contraseña maestra del abogado</option>
          </select>
        </Campo>
        <Campo etiqueta={quien === 'super' ? 'Contraseña maestra actual' : 'Contraseña actual (o la maestra)'} ancho="completo">
          <input type="password" value={actual} onChange={(e) => setActual(e.target.value)} required autoComplete="off" />
        </Campo>
        <Campo etiqueta="Nueva contraseña" ayuda="Mínimo 6 caracteres."><input type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} required minLength={6} autoComplete="new-password" /></Campo>
        <Campo etiqueta="Repita la nueva contraseña"><input type="password" value={repetir} onChange={(e) => setRepetir(e.target.value)} required minLength={6} autoComplete="new-password" /></Campo>
        <div className="campo-completo"><Boton type="submit" variante="oscuro" icono="candado">Cambiar contraseña</Boton></div>
      </form>
    </section>
  );
}

export default function Configuracion() {
  const { config, recargar } = useConfig();
  const avisar = useAviso();
  const [d, setD] = useState(config);
  useEffect(() => setD(config), [config]);
  const { sesion, abrir, cerrar } = useSesionProtegida();

  const guardar = async (e) => {
    e.preventDefault();
    try {
      await api('/config', { method: 'PUT', body: d });
      await recargar();
      avisar('Datos del despacho guardados');
    } catch (er) {
      if (er.status === 401) cerrar();
      avisar(er.message, 'error');
    }
  };

  if (!sesion) return <Candado titulo="Configuración" onAbrir={abrir} />;

  return (
    <>
      <Encabezado titulo="Configuración" subtitulo="Datos que aparecen en cotizaciones, facturas y contratos.">
        <Boton icono="candado" variante="oscuro" onClick={cerrar}>Cerrar sección</Boton>
      </Encabezado>
      <div className="rejilla-2">
        <section className="tarjeta">
          <h2>Datos del despacho</h2>
          <form className="formulario" onSubmit={guardar}>
            <CamposDespacho d={d} setD={setD} />
            <div className="campo-completo"><Boton type="submit">Guardar datos</Boton></div>
          </form>
        </section>
        <div>
          <CambiarClave />
          <section className="tarjeta">
            <h2>Base de datos</h2>
            <p className="chico">La información se guarda en MongoDB, en esta computadora. Para consultarla con <strong>MongoDB Compass</strong> use la conexión:</p>
            <p><code>mongodb://localhost:27017/plotinus</code></p>
            <p className="muted chico" style={{ marginBottom: 0 }}>Haga respaldos periódicos (vea “Respaldos” en el archivo README).</p>
          </section>
        </div>
      </div>
    </>
  );
}
