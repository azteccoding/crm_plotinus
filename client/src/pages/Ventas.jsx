import { useCallback, useEffect, useState } from 'react';
import { aInputFecha, api, fecha, mesActual, moneda, setTokenVentas } from '../api.js';
import { Boton, Campo, Encabezado, Icono, Membrete, Pestanas, SelectorCliente, Vacio, useAviso, useClientes, useImprimir } from '../components/ui.jsx';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const CLAVE_SESION = 'plotinus-ventas';

function leerSesion() {
  try {
    const s = JSON.parse(sessionStorage.getItem(CLAVE_SESION));
    return s && s.expira > Date.now() ? s : null;
  } catch { return null; }
}

function Candado({ onAbrir }) {
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
        <h1 style={{ fontSize: '2rem' }}>Ventas del mes</h1>
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

function Reporte({ datos, mes }) {
  return (
    <>
      <Membrete titulo="Reporte de ventas" fecha={new Date(`${mes}-01T00:00`).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })} />
      <table>
        <tbody>
          <tr><td>Facturado</td><td className="num">{moneda(datos.totales.facturado)}</td></tr>
          <tr><td>Facturas cobradas</td><td className="num">{moneda(datos.totales.cobrado)}</td></tr>
          <tr><td>Ingresos sin factura</td><td className="num">{moneda(datos.totales.ingresosSinFactura)}</td></tr>
          <tr><td><strong>Total de ventas</strong></td><td className="num"><strong>{moneda(datos.totales.total)}</strong></td></tr>
        </tbody>
      </table>
      <h4>Facturas</h4>
      <table>
        <thead><tr><th>Folio</th><th>Fecha</th><th>Cliente</th><th>Estatus</th><th className="num">Total</th></tr></thead>
        <tbody>{datos.facturas.map((f) => <tr key={f._id}><td>{f.serie}-{f.folio}</td><td>{fecha(f.fecha)}</td><td>{f.receptor?.nombre}</td><td>{f.estatus}</td><td className="num">{moneda(f.total)}</td></tr>)}</tbody>
      </table>
      <h4>Ingresos sin factura</h4>
      <table>
        <thead><tr><th>Fecha</th><th>Concepto</th><th>Cliente</th><th>Forma de pago</th><th className="num">Monto</th></tr></thead>
        <tbody>{datos.ingresos.map((i) => <tr key={i._id}><td>{fecha(i.fecha)}</td><td>{i.concepto}</td><td>{i.cliente?.nombre}</td><td>{i.formaPago}</td><td className="num">{moneda(i.monto)}</td></tr>)}</tbody>
      </table>
    </>
  );
}

export default function Ventas() {
  const avisar = useAviso();
  const imprimir = useImprimir();
  const [clientes] = useClientes();
  const [sesion, setSesion] = useState(leerSesion);
  const [mes, setMes] = useState(mesActual);
  const [datos, setDatos] = useState(null);
  const [anual, setAnual] = useState(null);
  const [nuevo, setNuevo] = useState({ fecha: aInputFecha(new Date()), concepto: '', cliente: '', monto: '', formaPago: 'Efectivo' });

  const abrir = (s) => { sessionStorage.setItem(CLAVE_SESION, JSON.stringify(s)); setSesion(s); };
  const cerrar = useCallback(() => {
    api('/seguridad/salir', { method: 'POST' }).catch(() => {});
    sessionStorage.removeItem(CLAVE_SESION);
    setTokenVentas(null);
    setSesion(null);
    setDatos(null);
  }, []);

  useEffect(() => {
    setTokenVentas(sesion?.token || null);
    return () => setTokenVentas(null);
  }, [sesion]);

  const cargar = useCallback(async () => {
    if (!sesion) return;
    try {
      setTokenVentas(sesion.token);
      const [d, a] = await Promise.all([api(`/ventas?mes=${mes}`), api(`/ventas/anual?anio=${mes.slice(0, 4)}`)]);
      setDatos(d);
      setAnual(a);
    } catch (e) {
      if (e.status === 401) { cerrar(); avisar(e.message, 'error'); }
    }
  }, [sesion, mes, cerrar, avisar]);
  useEffect(() => { cargar(); }, [cargar]);

  if (!sesion) return <Candado onAbrir={abrir} />;

  const registrar = async (e) => {
    e.preventDefault();
    try {
      await api('/ventas/ingresos', { method: 'POST', body: { ...nuevo, fecha: new Date(`${nuevo.fecha}T12:00`).toISOString(), monto: Number(nuevo.monto) } });
      setNuevo({ ...nuevo, concepto: '', monto: '', cliente: '' });
      avisar('Ingreso registrado');
      cargar();
    } catch (er) { avisar(er.message, 'error'); }
  };

  const borrarIngreso = async (i) => {
    if (!window.confirm(`¿Eliminar el ingreso “${i.concepto}”?`)) return;
    await api(`/ventas/ingresos/${i._id}`, { method: 'DELETE' });
    cargar();
  };

  const maximo = anual ? Math.max(...anual.meses, 1) : 1;
  const mesIdx = Number(mes.slice(5, 7)) - 1;

  return (
    <>
      <Encabezado titulo="Ventas del mes" subtitulo="Facturas emitidas e ingresos registrados sin factura.">
        <input type="month" className="control" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} style={{ width: 'auto' }} />
        {datos && <Boton icono="imprimir" variante="borde" onClick={() => imprimir(<Reporte datos={datos} mes={mes} />)}>Imprimir</Boton>}
        <Boton icono="candado" variante="oscuro" onClick={cerrar}>Cerrar sección</Boton>
      </Encabezado>

      {datos && (
        <>
          <div className="cifras">
            <div className="cifra destacada"><span>Total de ventas</span><strong>{moneda(datos.totales.total)}</strong></div>
            <div className="cifra"><span>Facturado</span><strong>{moneda(datos.totales.facturado)}</strong></div>
            <div className="cifra"><span>Facturas cobradas</span><strong>{moneda(datos.totales.cobrado)}</strong></div>
            <div className="cifra"><span>Ingresos sin factura</span><strong>{moneda(datos.totales.ingresosSinFactura)}</strong></div>
          </div>

          {anual && (
            <section className="tarjeta">
              <h2>Ventas de {anual.anio}</h2>
              <div className="grafica">
                {anual.meses.map((v, i) => (
                  <div key={MESES[i]} className={i === mesIdx ? 'actual' : ''} title={moneda(v)}>
                    <i style={{ height: `${(v / maximo) * 100}%` }} />{MESES[i]}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="rejilla-2" style={{ marginTop: '1.25rem' }}>
            <section className="tarjeta">
              <h2>Facturas del mes</h2>
              {datos.facturas.length === 0 ? <Vacio icono="facturas" titulo="Sin facturas este mes" /> : (
                <table className="tabla">
                  <thead><tr><th>Folio</th><th>Cliente</th><th>Estatus</th><th className="num">Total</th></tr></thead>
                  <tbody>{datos.facturas.map((f) => (
                    <tr key={f._id}><td>{f.serie}-{f.folio}<div className="muted chico">{fecha(f.fecha)}</div></td><td>{f.receptor?.nombre}</td>
                      <td><span className={`etiqueta ${f.estatus === 'pagada' ? 'etiqueta-ok' : 'etiqueta-oro'}`}>{f.estatus}</span></td><td className="num">{moneda(f.total)}</td></tr>
                  ))}</tbody>
                </table>
              )}
            </section>
            <section className="tarjeta">
              <h2>Ingresos sin factura</h2>
              <form className="formulario" onSubmit={registrar} style={{ marginBottom: '1rem' }}>
                <Campo etiqueta="Concepto *" ancho="completo"><input value={nuevo.concepto} onChange={(e) => setNuevo({ ...nuevo, concepto: e.target.value })} required placeholder="Ej. Consulta inicial" /></Campo>
                <Campo etiqueta="Cliente" ancho="completo"><SelectorCliente clientes={clientes} valor={nuevo.cliente} onCambio={(v) => setNuevo({ ...nuevo, cliente: v })} opcional /></Campo>
                <Campo etiqueta="Fecha" ancho="tercio"><input type="date" value={nuevo.fecha} onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value })} required /></Campo>
                <Campo etiqueta="Monto *" ancho="tercio"><input type="number" min="0" step="0.01" value={nuevo.monto} onChange={(e) => setNuevo({ ...nuevo, monto: e.target.value })} required /></Campo>
                <Campo etiqueta="Forma de pago" ancho="tercio">
                  <select value={nuevo.formaPago} onChange={(e) => setNuevo({ ...nuevo, formaPago: e.target.value })}>
                    {['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque'].map((f) => <option key={f}>{f}</option>)}
                  </select>
                </Campo>
                <div className="campo-completo"><Boton type="submit" icono="mas">Registrar ingreso</Boton></div>
              </form>
              {datos.ingresos.length > 0 && (
                <table className="tabla">
                  <tbody>{datos.ingresos.map((i) => (
                    <tr key={i._id}><td>{i.concepto}<div className="muted chico">{fecha(i.fecha)} · {i.formaPago}{i.cliente?.nombre ? ` · ${i.cliente.nombre}` : ''}</div></td>
                      <td className="num">{moneda(i.monto)}</td>
                      <td className="acc"><button type="button" className="btn-icono" title="Eliminar" onClick={() => borrarIngreso(i)}><Icono nombre="borrar" tam={18} /></button></td></tr>
                  ))}</tbody>
                </table>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
