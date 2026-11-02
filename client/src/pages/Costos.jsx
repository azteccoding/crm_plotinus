import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, fecha, fechaLarga, moneda } from '../api.js';
import { Boton, Campo, Encabezado, Icono, Membrete, Modal, Pestanas, Vacio, useAviso, useClientes, useConfig, useImprimir } from '../components/ui.jsx';
import { Candado, useSesionProtegida } from '../components/Protegido.jsx';

export function HojaCotizacion({ c, notasDespacho }) {
  return (
    <>
      <Membrete titulo="Cotización" folio={c.folio ? String(c.folio).padStart(4, '0') : ''} fecha={fechaLarga(c.fecha || new Date())} />
      <p><strong>Cliente:</strong> {c.clienteNombre}</p>
      <table>
        <thead><tr><th>Servicio</th><th className="num">Cant.</th><th className="num">Precio</th><th className="num">Importe</th></tr></thead>
        <tbody>
          {c.partidas.map((p, i) => (
            <tr key={i}><td>{p.descripcion}</td><td className="num">{p.cantidad}</td><td className="num">{moneda(p.precioUnitario)}</td><td className="num">{moneda(p.importe ?? p.cantidad * p.precioUnitario)}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="totales">
        <div><span>Subtotal</span><span>{moneda(c.subtotal)}</span></div>
        {c.descuento > 0 && <div><span>Descuento</span><span>−{moneda(c.descuento)}</span></div>}
        {c.conIva && <div><span>IVA 16%</span><span>{moneda(c.iva)}</span></div>}
        <div className="total"><span>Total</span><span>{moneda(c.total)}</span></div>
      </div>
      {c.notas && <p className="nota"><strong>Observaciones:</strong> {c.notas}</p>}
      <p className="nota">Cotización vigente por {c.vigenciaDias || 15} días naturales a partir de su fecha de emisión. {notasDespacho}</p>
    </>
  );
}

function calcular(partidas, descuento, conIva) {
  const subtotal = partidas.reduce((s, p) => s + p.cantidad * p.precioUnitario, 0);
  const desc = Math.min(Number(descuento) || 0, subtotal);
  const iva = conIva ? (subtotal - desc) * 0.16 : 0;
  return { subtotal, descuento: desc, iva, total: subtotal - desc + iva };
}

function Cotizador({ servicios, onGuardada }) {
  const avisar = useAviso();
  const imprimir = useImprimir();
  const { config } = useConfig();
  const [clientes] = useClientes();
  const [sel, setSel] = useState({});
  const [clienteNombre, setClienteNombre] = useState('');
  const [descuento, setDescuento] = useState(0);
  const [conIva, setConIva] = useState(false);
  const [vigenciaDias, setVigencia] = useState(15);
  const [notas, setNotas] = useState('');

  const activos = servicios.filter((s) => s.activo !== false);
  const categorias = useMemo(() => [...new Set(activos.map((s) => s.categoria || 'General'))], [activos]);
  const partidas = activos.filter((s) => sel[s._id]).map((s) => ({
    servicio: s._id, descripcion: s.nombre, cantidad: Number(sel[s._id]) || 1, precioUnitario: s.precio,
  }));
  const t = calcular(partidas, descuento, conIva);

  const alternar = (s) => setSel((x) => { const n = { ...x }; if (n[s._id]) delete n[s._id]; else n[s._id] = 1; return n; });

  const guardarEImprimir = async () => {
    if (!clienteNombre.trim()) { avisar('Escriba el nombre del cliente.', 'error'); return; }
    if (partidas.length === 0) { avisar('Seleccione al menos un servicio.', 'error'); return; }
    try {
      const cliente = clientes.find((c) => c.nombre.toLowerCase() === clienteNombre.trim().toLowerCase());
      const c = await api('/cotizaciones', { method: 'POST', body: { clienteNombre: clienteNombre.trim(), cliente: cliente?._id, partidas, descuento: Number(descuento) || 0, conIva, vigenciaDias: Number(vigenciaDias) || 15, notas } });
      imprimir(<HojaCotizacion c={c} notasDespacho={config.notasCotizacion} />);
      onGuardada();
      avisar(`Cotización ${c.folio} guardada`);
    } catch (e) { avisar(e.message, 'error'); }
  };

  return (
    <div className="rejilla-2">
      <section className="tarjeta">
        <h2>Seleccione los servicios</h2>
        {categorias.map((cat) => (
          <div key={cat}>
            <div className="categoria-titulo">{cat}</div>
            {activos.filter((s) => (s.categoria || 'General') === cat).map((s) => (
              <label key={s._id} className={`servicio-opcion ${sel[s._id] ? 'sel' : ''}`}>
                <input type="checkbox" className="casilla" checked={Boolean(sel[s._id])} onChange={() => alternar(s)} />
                <span>{s.nombre}<div className="muted chico">{s.descripcion}</div></span>
                <strong>{moneda(s.precio)}</strong>
                {sel[s._id] ? <input type="number" min="1" value={sel[s._id]} title="Cantidad" onChange={(e) => setSel({ ...sel, [s._id]: e.target.value })} onClick={(e) => e.preventDefault()} /> : <span />}
              </label>
            ))}
          </div>
        ))}
      </section>
      <section className="tarjeta" style={{ position: 'sticky', top: '1rem' }}>
        <h2>Datos de la cotización</h2>
        <div className="formulario">
          <Campo etiqueta="Nombre del cliente *" ancho="completo">
            <input list="lista-clientes" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Escriba o elija un cliente" />
            <datalist id="lista-clientes">{clientes.map((c) => <option key={c._id} value={c.nombre} />)}</datalist>
          </Campo>
          <Campo etiqueta="Descuento ($)" ancho="tercio"><input type="number" min="0" value={descuento} onChange={(e) => setDescuento(e.target.value)} /></Campo>
          <Campo etiqueta="Vigencia (días)" ancho="tercio"><input type="number" min="1" value={vigenciaDias} onChange={(e) => setVigencia(e.target.value)} /></Campo>
          <div className="campo campo-tercio" style={{ justifyContent: 'flex-end' }}>
            <label className="casilla"><input type="checkbox" checked={conIva} onChange={(e) => setConIva(e.target.checked)} /> Agregar IVA 16%</label>
          </div>
          <Campo etiqueta="Observaciones" ancho="completo"><textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} /></Campo>
        </div>
        <div style={{ marginTop: '1.25rem' }}>
          {partidas.map((p) => <div key={p.servicio} className="chico" style={{ display: 'flex', justifyContent: 'space-between' }}><span>{p.cantidad} × {p.descripcion}</span><span>{moneda(p.cantidad * p.precioUnitario)}</span></div>)}
          <div className="totales" style={{ marginTop: '.75rem' }}>
            <div><span>Subtotal</span><span>{moneda(t.subtotal)}</span></div>
            {t.descuento > 0 && <div><span>Descuento</span><span>−{moneda(t.descuento)}</span></div>}
            {conIva && <div><span>IVA</span><span>{moneda(t.iva)}</span></div>}
            <div className="total"><span>Total</span><span>{moneda(t.total)}</span></div>
          </div>
        </div>
        <div className="acciones" style={{ marginTop: '1.25rem', justifyContent: 'flex-end' }}>
          <Boton variante="borde" onClick={() => { setSel({}); setClienteNombre(''); setDescuento(0); setNotas(''); }}>Limpiar</Boton>
          <Boton icono="imprimir" onClick={guardarEImprimir}>Guardar e imprimir</Boton>
        </div>
      </section>
    </div>
  );
}

function FormularioServicio({ inicial, onCerrar, onGuardado }) {
  const avisar = useAviso();
  const [d, setD] = useState({ nombre: '', descripcion: '', categoria: 'General', precio: '', unidad: 'por asunto', claveProdServ: '', activo: true, ...inicial });
  const [error, setError] = useState('');
  const cambiar = (c) => (e) => setD({ ...d, [c]: e.target.value });
  const guardar = async (e) => {
    e.preventDefault();
    try {
      const body = { ...d, precio: Number(d.precio) || 0 };
      if (d._id) await api(`/servicios/${d._id}`, { method: 'PUT', body });
      else await api('/servicios', { method: 'POST', body });
      avisar('Servicio guardado');
      onGuardado();
    } catch (er) { setError(er.message); }
  };
  const eliminar = async () => {
    if (!window.confirm(`¿Eliminar “${d.nombre}” del catálogo?`)) return;
    await api(`/servicios/${d._id}`, { method: 'DELETE' });
    onGuardado();
  };
  return (
    <Modal titulo={d._id ? 'Editar servicio' : 'Nuevo servicio'} onCerrar={onCerrar}
      pie={<>{d._id && <Boton variante="peligro" icono="borrar" onClick={eliminar} style={{ marginRight: 'auto' }}>Eliminar</Boton>}<Boton variante="borde" onClick={onCerrar}>Cancelar</Boton><Boton type="submit" form="form-serv">Guardar</Boton></>}>
      {error && <div className="error-caja">{error}</div>}
      <form id="form-serv" className="formulario" onSubmit={guardar}>
        <Campo etiqueta="Nombre del servicio *" ancho="completo"><input value={d.nombre} onChange={cambiar('nombre')} required autoFocus /></Campo>
        <Campo etiqueta="Descripción" ancho="completo"><input value={d.descripcion} onChange={cambiar('descripcion')} /></Campo>
        <Campo etiqueta="Categoría" ancho="tercio"><input value={d.categoria} onChange={cambiar('categoria')} /></Campo>
        <Campo etiqueta="Precio (MXN) *" ancho="tercio"><input type="number" min="0" step="0.01" value={d.precio} onChange={cambiar('precio')} required /></Campo>
        <Campo etiqueta="Unidad" ancho="tercio"><input value={d.unidad} onChange={cambiar('unidad')} /></Campo>
        <Campo etiqueta="Clave SAT (producto/servicio)" ayuda="Para facturación electrónica futura. Puede dejarse vacío."><input value={d.claveProdServ} onChange={cambiar('claveProdServ')} /></Campo>
        <div className="campo" style={{ justifyContent: 'flex-end' }}>
          <label className="casilla"><input type="checkbox" checked={d.activo !== false} onChange={(e) => setD({ ...d, activo: e.target.checked })} /> Mostrar en el cotizador</label>
        </div>
      </form>
    </Modal>
  );
}

export default function Costos() {
  const imprimir = useImprimir();
  const { config } = useConfig();
  const avisar = useAviso();
  const [tab, setTab] = useState('cotizar');
  const [servicios, setServicios] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [editando, setEditando] = useState(null);
  const { sesion, abrir, cerrar } = useSesionProtegida();

  const cargar = useCallback(() => {
    api('/servicios').then(setServicios).catch(() => {});
    api('/cotizaciones?limite=200').then(setCotizaciones).catch(() => {});
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const eliminarCot = async (c) => {
    if (!window.confirm(`¿Eliminar la cotización ${c.folio}?`)) return;
    await api(`/cotizaciones/${c._id}`, { method: 'DELETE' });
    avisar('Cotización eliminada');
    cargar();
  };

  return (
    <>
      <Encabezado titulo="Costos de asesoría" subtitulo="Seleccione servicios, escriba el nombre del cliente e imprima la cotización.">
        {tab === 'catalogo' && sesion && (
          <>
            <Boton icono="candado" variante="borde" onClick={cerrar}>Bloquear</Boton>
            <Boton icono="mas" onClick={() => setEditando({})}>Nuevo servicio</Boton>
          </>
        )}
      </Encabezado>
      <Pestanas valor={tab} onCambio={setTab} opciones={[['cotizar', 'Cotizar'], ['historial', 'Cotizaciones emitidas'], ['catalogo', 'Catálogo de precios']]} />

      {tab === 'cotizar' && <Cotizador servicios={servicios} onGuardada={cargar} />}

      {tab === 'historial' && (cotizaciones.length === 0
        ? <div className="tarjeta"><Vacio icono="costos" titulo="Sin cotizaciones">Las cotizaciones impresas aparecerán aquí.</Vacio></div>
        : (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead><tr><th>Folio</th><th>Fecha</th><th>Cliente</th><th>Servicios</th><th className="num">Total</th><th /></tr></thead>
              <tbody>
                {cotizaciones.map((c) => (
                  <tr key={c._id}>
                    <td>{String(c.folio).padStart(4, '0')}</td><td className="muted">{fecha(c.fecha)}</td><td>{c.clienteNombre}</td>
                    <td className="chico">{c.partidas.map((p) => p.descripcion).join(', ')}</td>
                    <td className="num">{moneda(c.total)}</td>
                    <td className="acc">
                      <button type="button" className="btn-icono" title="Reimprimir" onClick={() => imprimir(<HojaCotizacion c={c} notasDespacho={config.notasCotizacion} />)}><Icono nombre="imprimir" tam={18} /></button>
                      <button type="button" className="btn-icono" title="Eliminar" onClick={() => eliminarCot(c)}><Icono nombre="borrar" tam={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {tab === 'catalogo' && !sesion && <Candado titulo="Catálogo de precios" onAbrir={abrir} />}

      {tab === 'catalogo' && sesion && (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead><tr><th>Servicio</th><th>Categoría</th><th>Unidad</th><th className="num">Precio</th><th /></tr></thead>
            <tbody>
              {servicios.map((s) => (
                <tr key={s._id} style={s.activo === false ? { opacity: 0.5 } : undefined}>
                  <td><strong>{s.nombre}</strong><div className="muted chico">{s.descripcion}</div></td>
                  <td>{s.categoria}</td><td className="muted">{s.unidad}</td>
                  <td className="num">{moneda(s.precio)}</td>
                  <td className="acc"><button type="button" className="btn-icono" title="Editar" onClick={() => setEditando(s)}><Icono nombre="editar" tam={18} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editando && sesion && <FormularioServicio inicial={editando} onCerrar={() => setEditando(null)} onGuardado={() => { setEditando(null); cargar(); }} />}
    </>
  );
}
