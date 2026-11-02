import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { abrirWhatsApp, api, fechaHora, hora } from '../api.js';
import { Icono, useConfig } from '../components/ui.jsx';
import AbanicoServicios from '../components/AbanicoServicios.jsx';

function saludo() {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

function cuandoFalta(inicio) {
  const min = Math.round((new Date(inicio).getTime() - Date.now()) / 60000);
  if (min <= 0) return 'En curso';
  if (min < 60) return `En ${min} min`;
  const horas = Math.round(min / 60);
  if (horas < 24) return `En ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'Mañana' : `En ${dias} días`;
}

function Ficha({ a, href, onClick, icono, titulo, texto, extra }) {
  const contenido = (
    <>
      <span className="ficha-icono"><Icono nombre={icono} tam={22} /></span>
      <h3>{titulo}</h3>
      <p>{texto}</p>
      {extra || <Icono nombre="flecha" className="ficha-flecha" tam={18} />}
    </>
  );
  if (a) return <Link className="ficha" to={a}>{contenido}</Link>;
  if (href) return <a className="ficha" href={href} target="_blank" rel="noreferrer">{contenido}</a>;
  return <button type="button" className="ficha" onClick={onClick}>{contenido}</button>;
}

export default function Tablero() {
  const { config } = useConfig();
  const [proximas, setProximas] = useState([]);
  const [resumen, setResumen] = useState({});
  const [abanico, setAbanico] = useState(false);

  useEffect(() => {
    const cargar = () => {
      api('/citas/proximas?limite=4').then(setProximas).catch(() => {});
      api('/resumen').then(setResumen).catch(() => {});
    };
    cargar();
    const t = setInterval(cargar, 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const sitio = config.sitioWeb || 'https://plotinus.com.mx';

  return (
    <>
      <section className="bienvenida">
        <span className="eyebrow">{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        <h1>{saludo()}</h1>
        <p>{config.nombreDespacho || 'Consultoría Jurídica Plotinus'} · Sistema de clientes</p>
        <div className="bienvenida-datos">
          <div><strong>{resumen.citasHoy ?? '–'}</strong><span>Citas hoy</span></div>
          <div><strong>{resumen.clientes ?? '–'}</strong><span>Clientes</span></div>
          <div><strong>{resumen.documentos ?? '–'}</strong><span>Documentos</span></div>
        </div>
      </section>

      <div className="mosaico">
        <section className="alertas mosaico-alertas">
          <div className="alertas-cabeza">
            <h3><Icono nombre="campana" /> Próximas citas</h3>
            <Link to="/agenda" className="btn btn-borde btn-chico">Ver agenda</Link>
          </div>
          {proximas.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>No hay citas próximas. Agregue una desde la Agenda.</p>
          ) : (
            <ul className="lista-citas">
              {proximas.map((c) => {
                const urgente = new Date(c.inicio).getTime() - Date.now() < 60 * 60 * 1000;
                return (
                  <li key={c._id} className={`cita-item ${urgente ? 'urgente' : ''}`}>
                    <div className="cita-cuando">{hora(c.inicio)}<small>{cuandoFalta(c.inicio)}</small></div>
                    <div className="cita-titulo">
                      {c.titulo}{c.cliente?.nombre ? ` — ${c.cliente.nombre}` : ''}
                      <small>{fechaHora(c.inicio)}{c.lugar ? ` · ${c.lugar}` : ''}</small>
                    </div>
                    <span className="etiqueta etiqueta-oro">{c.tipo}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <Ficha a="/agenda" icono="agenda" titulo="Agenda del abogado" texto="Citas, audiencias y firmas con su cliente." />
        <Ficha onClick={() => abrirWhatsApp()} icono="whatsapp" titulo="WhatsApp" texto="Abre WhatsApp de escritorio (o WhatsApp Web si no está instalado)." />
        <Ficha href={sitio} icono="web" titulo="Sitio web" texto={sitio.replace(/^https?:\/\//, '')} />
        <Ficha a="/documentos" icono="documentos" titulo="Documentos" texto="Acuerdos y PDF de cada cliente." />
        <Ficha onClick={() => setAbanico(true)} icono="globo" titulo="Servicios en línea" texto="PJF, CURP, IMSS, SAT, Registro Público y más." />
        <Ficha a="/costos" icono="costos" titulo="Costos de asesoría" texto="Catálogo de precios y cotizaciones impresas." />
        <Ficha a="/ventas" icono="ventas" titulo="Ventas del mes" texto="Requiere contraseñas de la secretaria y del abogado."
          extra={<Icono nombre="candado" className="ficha-candado" tam={18} />} />
        <Ficha a="/facturas" icono="facturas" titulo="Facturas" texto="Elaborar e imprimir facturas." />
        <Ficha a="/contratos" icono="contratos" titulo="Contratos" texto="Prestación de servicios, compraventa, convenios y más." />
        <Ficha a="/clientes" icono="clientes" titulo="Clientes" texto="Expedientes y datos de contacto." />
      </div>

      {abanico && <AbanicoServicios onCerrar={() => setAbanico(false)} />}
    </>
  );
}
