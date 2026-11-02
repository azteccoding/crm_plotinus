import { useCallback, useEffect, useState } from 'react';
import { aInputFecha, api, fecha, fechaLarga, moneda } from '../api.js';
import { FORMAS_PAGO, METODOS_PAGO, REGIMENES, USOS_CFDI, etiqueta } from '../catalogos.js';
import { Boton, Buscador, Campo, Encabezado, Icono, Membrete, Modal, SelectorCliente, Vacio, useAviso, useClientes, useConfig, useImprimir } from '../components/ui.jsx';

const ESTATUS = { borrador: 'Borrador', emitida: 'Pendiente de pago', pagada: 'Pagada', cancelada: 'Cancelada' };
const CLASE_ESTATUS = { pagada: 'etiqueta-ok', cancelada: 'etiqueta-mal', emitida: 'etiqueta-oro' };
const conceptoVacio = () => ({ descripcion: '', cantidad: 1, valorUnitario: 0, claveProdServ: '', claveUnidad: 'E48', objetoImp: '02' });

export function HojaFactura({ f }) {
  const { config } = useConfig();
  const retenciones = (tipo) => f.conceptos.reduce((s, c) => s + (c.retenciones || []).filter((r) => r.impuesto === tipo).reduce((a, r) => a + r.importe, 0), 0);
  return (
    <>
      <Membrete titulo="Factura" folio={`${f.serie}-${f.folio}`} fecha={fechaLarga(f.fecha)} />
      <div className="partes">
        <div>
          <h4>Emisor</h4>
          <div><strong>{f.emisor?.nombre || config.abogado}</strong></div>
          <div>RFC: {f.emisor?.rfc || config.rfc || '—'}</div>
          <div>Régimen: {etiqueta(REGIMENES, f.emisor?.regimenFiscal || config.regimenFiscal)}</div>
          <div>Lugar de expedición: {f.lugarExpedicion || config.codigoPostal}</div>
        </div>
        <div>
          <h4>Receptor</h4>
          <div><strong>{f.receptor.nombre}</strong></div>
          <div>RFC: {f.receptor.rfc}</div>
          <div>Régimen: {etiqueta(REGIMENES, f.receptor.regimenFiscalReceptor)}</div>
          <div>C.P.: {f.receptor.domicilioFiscalReceptor || '—'} · Uso CFDI: {etiqueta(USOS_CFDI, f.receptor.usoCFDI)}</div>
        </div>
      </div>
      <table>
        <thead><tr><th>Cant.</th><th>Unidad</th><th>Clave</th><th>Descripción</th><th className="num">P. unitario</th><th className="num">Importe</th></tr></thead>
        <tbody>
          {f.conceptos.map((c, i) => (
            <tr key={i}><td>{c.cantidad}</td><td>{c.claveUnidad}</td><td>{c.claveProdServ}</td><td>{c.descripcion}</td>
              <td className="num">{moneda(c.valorUnitario)}</td><td className="num">{moneda(c.importe)}</td></tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20pt' }}>
        <div style={{ fontSize: '9pt' }}>
          <div>Forma de pago: {etiqueta(FORMAS_PAGO, f.formaPago)}</div>
          <div>Método de pago: {etiqueta(METODOS_PAGO, f.metodoPago)}</div>
          <div>Moneda: {f.moneda}</div>
          {f.condicionesDePago && <div>Condiciones: {f.condicionesDePago}</div>}
        </div>
        <div className="totales">
          <div><span>Subtotal</span><span>{moneda(f.subTotal)}</span></div>
          {f.descuento > 0 && <div><span>Descuento</span><span>−{moneda(f.descuento)}</span></div>}
          <div><span>IVA trasladado 16%</span><span>{moneda(f.totalImpuestosTrasladados)}</span></div>
          {f.totalImpuestosRetenidos > 0 && <>
            <div><span>Retención ISR</span><span>−{moneda(retenciones('001'))}</span></div>
            <div><span>Retención IVA</span><span>−{moneda(retenciones('002'))}</span></div>
          </>}
          <div className="total"><span>Total</span><span>{moneda(f.total)}</span></div>
        </div>
      </div>
      {f.notas && <p className="nota">{f.notas}</p>}
      {f.timbre?.uuid
        ? <p className="nota">Folio fiscal (UUID): {f.timbre.uuid}</p>
        : <div className="leyenda">Este documento no es un Comprobante Fiscal Digital por Internet (CFDI). Es una representación interna sin validez fiscal.</div>}
      {f.estatus === 'cancelada' && <div className="leyenda" style={{ borderColor: '#a83a32', color: '#a83a32' }}>FACTURA CANCELADA</div>}
    </>
  );
}

function FormularioFactura({ clientes, servicios, onCerrar, onGuardada, inicial }) {
  const [d, setD] = useState(() => inicial ? {
    ...inicial,
    cliente: inicial.cliente?._id || inicial.cliente || '',
    fecha: aInputFecha(inicial.fecha),
    conRetenciones: (inicial.totalImpuestosRetenidos || 0) > 0,
  } : {
    cliente: '', fecha: aInputFecha(new Date()), formaPago: '03', metodoPago: 'PUE', condicionesDePago: '', notas: '', estatus: 'emitida', conRetenciones: false,
    receptor: { nombre: '', rfc: 'XAXX010101000', regimenFiscalReceptor: '616', domicilioFiscalReceptor: '', usoCFDI: 'S01' },
    conceptos: [conceptoVacio()],
  });
  const [error, setError] = useState('');
  const set = (campo, valor) => setD((x) => ({ ...x, [campo]: valor }));
  const setRec = (campo, valor) => setD((x) => ({ ...x, receptor: { ...x.receptor, [campo]: valor } }));
  const setCon = (i, campo, valor) => setD((x) => ({ ...x, conceptos: x.conceptos.map((c, j) => j === i ? { ...c, [campo]: valor } : c) }));

  const elegirCliente = (id) => {
    const c = clientes.find((x) => x._id === id);
    setD((x) => ({
      ...x,
      cliente: id,
      conRetenciones: c?.tipoPersona === 'moral',
      receptor: c ? {
        nombre: c.nombre, rfc: c.rfc || 'XAXX010101000', regimenFiscalReceptor: c.regimenFiscal || '616',
        domicilioFiscalReceptor: c.codigoPostal || '', usoCFDI: c.usoCfdi || 'G03', email: c.email,
      } : x.receptor,
    }));
  };

  const agregarServicio = (id) => {
    const s = servicios.find((x) => x._id === id);
    if (!s) return;
    const nuevo = { ...conceptoVacio(), descripcion: s.nombre, valorUnitario: s.precio, claveProdServ: s.claveProdServ || '' };
    setD((x) => ({ ...x, conceptos: [...x.conceptos.filter((c) => c.descripcion), nuevo] }));
  };

  const subtotal = d.conceptos.reduce((s, c) => s + (Number(c.cantidad) || 0) * (Number(c.valorUnitario) || 0), 0);
  const iva = d.conceptos.reduce((s, c) => s + (c.objetoImp === '01' ? 0 : (Number(c.cantidad) || 0) * (Number(c.valorUnitario) || 0) * 0.16), 0);
  const ret = d.conRetenciones ? subtotal * (0.10 + 0.106667) : 0;

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    const conceptos = d.conceptos.filter((c) => c.descripcion.trim()).map((c) => ({ ...c, cantidad: Number(c.cantidad) || 1, valorUnitario: Number(c.valorUnitario) || 0 }));
    if (!conceptos.length) { setError('Agregue al menos un concepto.'); return; }
    try {
      const body = { ...d, conceptos, fecha: new Date(`${d.fecha}T12:00`).toISOString() };
      const f = d._id ? await api(`/facturas/${d._id}`, { method: 'PUT', body }) : await api('/facturas', { method: 'POST', body });
      onGuardada(f);
    } catch (er) { setError(er.message); }
  };

  return (
    <Modal titulo={d._id ? `Editar factura ${d.serie}-${d.folio}` : 'Nueva factura'} onCerrar={onCerrar} ancho="lg"
      pie={<><Boton variante="borde" onClick={onCerrar}>Cancelar</Boton><Boton type="submit" form="form-fac" icono="imprimir">Guardar e imprimir</Boton></>}>
      {error && <div className="error-caja">{error}</div>}
      <form id="form-fac" className="formulario" onSubmit={guardar}>
        <Campo etiqueta="Cliente" ancho="completo" ayuda="Al elegirlo se llenan sus datos fiscales.">
          <SelectorCliente clientes={clientes} valor={d.cliente} onCambio={elegirCliente} opcional />
        </Campo>
        <Campo etiqueta="Nombre o razón social del receptor *" ancho="completo"><input value={d.receptor.nombre} onChange={(e) => setRec('nombre', e.target.value)} required /></Campo>
        <Campo etiqueta="RFC" ancho="tercio" ayuda="Público en general: XAXX010101000"><input value={d.receptor.rfc} onChange={(e) => setRec('rfc', e.target.value.toUpperCase())} maxLength={13} /></Campo>
        <Campo etiqueta="Régimen fiscal" ancho="tercio">
          <select value={d.receptor.regimenFiscalReceptor} onChange={(e) => setRec('regimenFiscalReceptor', e.target.value)}>
            {REGIMENES.map(([k, v]) => <option key={k} value={k}>{k} - {v}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="C.P. fiscal" ancho="sexto"><input value={d.receptor.domicilioFiscalReceptor} onChange={(e) => setRec('domicilioFiscalReceptor', e.target.value)} maxLength={5} /></Campo>
        <Campo etiqueta="Uso CFDI" ancho="sexto">
          <select value={d.receptor.usoCFDI} onChange={(e) => setRec('usoCFDI', e.target.value)}>{USOS_CFDI.map(([k, v]) => <option key={k} value={k} title={v}>{k}</option>)}</select>
        </Campo>
        <Campo etiqueta="Fecha" ancho="tercio"><input type="date" value={d.fecha} onChange={(e) => set('fecha', e.target.value)} required /></Campo>
        <Campo etiqueta="Forma de pago" ancho="tercio">
          <select value={d.formaPago} onChange={(e) => set('formaPago', e.target.value)}>{FORMAS_PAGO.map(([k, v]) => <option key={k} value={k}>{k} - {v}</option>)}</select>
        </Campo>
        <Campo etiqueta="Método de pago" ancho="tercio">
          <select value={d.metodoPago} onChange={(e) => set('metodoPago', e.target.value)}>{METODOS_PAGO.map(([k, v]) => <option key={k} value={k}>{k} - {v}</option>)}</select>
        </Campo>

        <div className="campo-completo">
          <div className="barra" style={{ justifyContent: 'space-between', marginBottom: '.5rem' }}>
            <strong>Conceptos</strong>
            <select className="control" value="" onChange={(e) => agregarServicio(e.target.value)}>
              <option value="">+ Agregar del catálogo…</option>
              {servicios.map((s) => <option key={s._id} value={s._id}>{s.nombre} — {moneda(s.precio)}</option>)}
            </select>
          </div>
          <table className="tabla conceptos-tabla">
            <thead><tr><th>Descripción</th><th style={{ width: 80 }}>Cant.</th><th style={{ width: 130 }}>Precio unit.</th><th style={{ width: 110 }}>Clave SAT</th><th style={{ width: 110 }}>IVA</th><th className="num">Importe</th><th /></tr></thead>
            <tbody>
              {d.conceptos.map((c, i) => (
                <tr key={i}>
                  <td><input value={c.descripcion} onChange={(e) => setCon(i, 'descripcion', e.target.value)} placeholder="Servicio profesional…" /></td>
                  <td><input type="number" min="0" step="any" value={c.cantidad} onChange={(e) => setCon(i, 'cantidad', e.target.value)} /></td>
                  <td><input type="number" min="0" step="0.01" value={c.valorUnitario} onChange={(e) => setCon(i, 'valorUnitario', e.target.value)} /></td>
                  <td><input value={c.claveProdServ} onChange={(e) => setCon(i, 'claveProdServ', e.target.value)} placeholder="Opcional" /></td>
                  <td><select value={c.objetoImp} onChange={(e) => setCon(i, 'objetoImp', e.target.value)}><option value="02">16%</option><option value="01">Sin IVA</option></select></td>
                  <td className="num">{moneda((Number(c.cantidad) || 0) * (Number(c.valorUnitario) || 0))}</td>
                  <td><button type="button" className="btn-icono" title="Quitar" onClick={() => setD((x) => ({ ...x, conceptos: x.conceptos.filter((_, j) => j !== i) }))}><Icono nombre="cerrar" tam={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Boton variante="borde" className="btn-chico" icono="mas" onClick={() => set('conceptos', [...d.conceptos, conceptoVacio()])} style={{ marginTop: '.5rem' }}>Agregar renglón</Boton>
        </div>

        <div className="campo campo-completo">
          <label className="casilla"><input type="checkbox" checked={d.conRetenciones} onChange={(e) => set('conRetenciones', e.target.checked)} /> Aplicar retenciones de ISR (10%) e IVA (2/3) — cuando el cliente es persona moral</label>
        </div>
        <Campo etiqueta="Notas" ancho="completo"><textarea rows={2} value={d.notas} onChange={(e) => set('notas', e.target.value)} /></Campo>
        <div className="campo-completo totales">
          <div><span>Subtotal</span><span>{moneda(subtotal)}</span></div>
          <div><span>IVA 16%</span><span>{moneda(iva)}</span></div>
          {d.conRetenciones && <div><span>Retenciones</span><span>−{moneda(ret)}</span></div>}
          <div className="total"><span>Total</span><span>{moneda(subtotal + iva - ret)}</span></div>
        </div>
      </form>
    </Modal>
  );
}

export default function Facturas() {
  const avisar = useAviso();
  const imprimir = useImprimir();
  const [clientes] = useClientes();
  const [servicios, setServicios] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [q, setQ] = useState('');
  const [estatus, setEstatus] = useState('');
  const [editando, setEditando] = useState(null);

  const cargar = useCallback(() => {
    api(`/facturas?q=${encodeURIComponent(q)}&estatus=${estatus}`).then(setFacturas).catch(() => {});
  }, [q, estatus]);
  useEffect(() => { const t = setTimeout(cargar, 200); return () => clearTimeout(t); }, [cargar]);
  useEffect(() => { api('/servicios').then((s) => setServicios(s.filter((x) => x.activo !== false))).catch(() => {}); }, []);

  const cambiarEstatus = async (f, nuevo) => {
    if (nuevo === 'cancelada' && !window.confirm(`¿Cancelar la factura ${f.serie}-${f.folio}?`)) return;
    try {
      await api(`/facturas/${f._id}`, { method: 'PUT', body: { ...f, estatus: nuevo, conRetenciones: f.totalImpuestosRetenidos > 0 } });
      avisar(`Factura ${f.serie}-${f.folio}: ${ESTATUS[nuevo].toLowerCase()}`);
      cargar();
    } catch (e) { avisar(e.message, 'error'); }
  };

  return (
    <>
      <Encabezado titulo="Facturas" subtitulo="Elabore e imprima facturas. La facturación electrónica (CFDI) se integrará más adelante.">
        <Boton icono="mas" onClick={() => setEditando({})}>Nueva factura</Boton>
      </Encabezado>
      <div className="barra">
        <Buscador valor={q} onCambio={setQ} placeholder="Buscar por cliente o RFC…" />
        <select className="control" value={estatus} onChange={(e) => setEstatus(e.target.value)}>
          <option value="">Todos los estatus</option>
          {Object.entries(ESTATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {facturas.length === 0 ? (
        <div className="tarjeta"><Vacio icono="facturas" titulo="Sin facturas">Use “Nueva factura” para elaborar la primera.</Vacio></div>
      ) : (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead><tr><th>Folio</th><th>Fecha</th><th>Cliente</th><th>RFC</th><th>Estatus</th><th className="num">Total</th><th /></tr></thead>
            <tbody>
              {facturas.map((f) => (
                <tr key={f._id}>
                  <td><strong>{f.serie}-{f.folio}</strong></td>
                  <td className="muted">{fecha(f.fecha)}</td>
                  <td>{f.receptor?.nombre}</td>
                  <td className="muted">{f.receptor?.rfc}</td>
                  <td><span className={`etiqueta ${CLASE_ESTATUS[f.estatus] || ''}`}>{ESTATUS[f.estatus]}</span></td>
                  <td className="num">{moneda(f.total)}</td>
                  <td className="acc">
                    {f.estatus === 'emitida' && <button type="button" className="btn btn-borde btn-chico" onClick={() => cambiarEstatus(f, 'pagada')}>Marcar pagada</button>}
                    <button type="button" className="btn-icono" title="Imprimir" onClick={() => imprimir(<HojaFactura f={f} />)}><Icono nombre="imprimir" tam={18} /></button>
                    {f.estatus !== 'cancelada' && <button type="button" className="btn-icono" title="Editar" onClick={() => setEditando(f)}><Icono nombre="editar" tam={18} /></button>}
                    {f.estatus !== 'cancelada' && <button type="button" className="btn-icono" title="Cancelar factura" onClick={() => cambiarEstatus(f, 'cancelada')}><Icono nombre="cerrar" tam={18} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editando && (
        <FormularioFactura clientes={clientes} servicios={servicios} inicial={editando._id ? editando : null}
          onCerrar={() => setEditando(null)}
          onGuardada={(f) => { setEditando(null); avisar(`Factura ${f.serie}-${f.folio} guardada`); cargar(); imprimir(<HojaFactura f={f} />); }} />
      )}
    </>
  );
}
