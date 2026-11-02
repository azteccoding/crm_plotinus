import { Router } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import {
  Cliente, Cita, Documento, Servicio, Cotizacion, Factura, Ingreso, Plantilla, Contrato, Config,
  siguienteFolio,
} from './models.js';
import { rutasSeguridad, requiereAccesoVentas } from './seguridad.js';

const err = (status, mensaje) => Object.assign(new Error(mensaje), { status });
const redondear = (n) => Math.round((Number(n) || 0) * 100) / 100;
const escaparRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function crud(router, ruta, Model, { buscarEn = [], orden = { createdAt: -1 }, poblar, filtros = [], antesDeGuardar } = {}) {
  router.get(ruta, async (req, res) => {
    const q = {};
    if (req.query.q && buscarEn.length) {
      const rx = new RegExp(escaparRegex(String(req.query.q)), 'i');
      q.$or = buscarEn.map((campo) => ({ [campo]: rx }));
    }
    for (const f of filtros) if (req.query[f]) q[f] = req.query[f];
    let consulta = Model.find(q).sort(orden).limit(Math.min(Number(req.query.limite) || 500, 2000));
    if (poblar) consulta = consulta.populate(poblar, 'nombre telefono email');
    res.json(await consulta.lean());
  });
  router.get(`${ruta}/:id`, async (req, res) => {
    let consulta = Model.findById(req.params.id);
    if (poblar) consulta = consulta.populate(poblar);
    const doc = await consulta.lean();
    if (!doc) throw err(404, 'Registro no encontrado.');
    res.json(doc);
  });
  router.post(ruta, async (req, res) => {
    const datos = antesDeGuardar ? await antesDeGuardar(req.body, true) : req.body;
    res.status(201).json(await Model.create(datos));
  });
  router.put(`${ruta}/:id`, async (req, res) => {
    const datos = antesDeGuardar ? await antesDeGuardar(req.body, false) : req.body;
    delete datos._id;
    const doc = await Model.findByIdAndUpdate(req.params.id, datos, { new: true, runValidators: true });
    if (!doc) throw err(404, 'Registro no encontrado.');
    res.json(doc);
  });
}

function borrar(router, ruta, Model, antes) {
  router.delete(`${ruta}/:id`, async (req, res) => {
    if (antes) await antes(req.params.id);
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) throw err(404, 'Registro no encontrado.');
    res.json({ ok: true });
  });
}

const vacioANull = (campo) => (d) => {
  if (d[campo] === '') d[campo] = null;
  return d;
};

export function crearRutas() {
  const r = Router();

  r.get('/salud', (_req, res) => {
    res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'conectada' : 'desconectada' });
  });

  r.use('/seguridad', rutasSeguridad);

  // Configuración del despacho
  r.get('/config', async (_req, res) => {
    res.json(await Config.findById('despacho').lean() || {});
  });
  r.put('/config', async (req, res) => {
    const { _id, createdAt, updatedAt, ...datos } = req.body;
    res.json(await Config.findByIdAndUpdate('despacho', datos, { new: true, upsert: true }));
  });

  // Clientes
  crud(r, '/clientes', Cliente, {
    buscarEn: ['nombre', 'telefono', 'email', 'rfc', 'curp', 'expediente'],
    orden: { nombre: 1 },
  });
  borrar(r, '/clientes', Cliente, async (id) => {
    const [citas, docs, facturas, contratos] = await Promise.all([
      Cita.countDocuments({ cliente: id }),
      Documento.countDocuments({ cliente: id }),
      Factura.countDocuments({ cliente: id }),
      Contrato.countDocuments({ cliente: id }),
    ]);
    if (citas + docs + facturas + contratos > 0) {
      throw err(409, `No se puede eliminar: el cliente tiene ${citas} cita(s), ${docs} documento(s), `
        + `${facturas} factura(s) y ${contratos} contrato(s) registrados. Elimínelos primero.`);
    }
  });

  // Agenda
  r.get('/citas/proximas', async (req, res) => {
    const limite = Math.min(Number(req.query.limite) || 5, 50);
    const desde = new Date(Date.now() - 15 * 60 * 1000);
    res.json(await Cita.find({ estado: 'programada', inicio: { $gte: desde } })
      .sort({ inicio: 1 }).limit(limite).populate('cliente', 'nombre telefono').lean());
  });
  r.get('/citas', async (req, res) => {
    const q = {};
    if (req.query.desde || req.query.hasta) {
      q.inicio = {};
      if (req.query.desde) q.inicio.$gte = new Date(req.query.desde);
      if (req.query.hasta) q.inicio.$lt = new Date(req.query.hasta);
    }
    if (req.query.cliente) q.cliente = req.query.cliente;
    if (req.query.estado) q.estado = req.query.estado;
    const orden = req.query.orden === 'desc' ? -1 : 1;
    res.json(await Cita.find(q).sort({ inicio: orden }).limit(1000).populate('cliente', 'nombre telefono').lean());
  });
  crud(r, '/citas', Cita, { poblar: 'cliente', antesDeGuardar: vacioANull('cliente') });
  borrar(r, '/citas', Cita);

  // Documentos (archivos guardados en GridFS, colección documentos_archivos)
  const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'documentos_archivos' });
  const TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png'];
  const subida = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 40 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => cb(TIPOS_PERMITIDOS.includes(file.mimetype)
      ? null : err(400, 'Solo se permiten archivos PDF, JPG o PNG.'), true),
  });

  r.get('/documentos', async (req, res) => {
    const q = {};
    if (req.query.cliente) q.cliente = req.query.cliente;
    if (req.query.q) {
      const rx = new RegExp(escaparRegex(String(req.query.q)), 'i');
      q.$or = [{ titulo: rx }, { expediente: rx }, { juzgado: rx }, { nombreArchivo: rx }];
    }
    res.json(await Documento.find(q).sort({ createdAt: -1 }).limit(1000).populate('cliente', 'nombre').lean());
  });

  r.post('/documentos', subida.single('archivo'), async (req, res) => {
    if (!req.file) throw err(400, 'Seleccione un archivo.');
    const { cliente, titulo, tipo, expediente, juzgado, fechaDocumento, notas } = req.body;
    if (!cliente) throw err(400, 'Seleccione el cliente.');
    const nombre = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const archivoId = await new Promise((resolve, reject) => {
      const stream = bucket().openUploadStream(nombre, { metadata: { cliente, mime: req.file.mimetype } });
      stream.on('error', reject).on('finish', () => resolve(stream.id));
      stream.end(req.file.buffer);
    });
    const doc = await Documento.create({
      cliente, titulo: titulo || nombre.replace(/\.[^.]+$/, ''), tipo, expediente, juzgado, notas,
      fechaDocumento: fechaDocumento || undefined,
      archivoId, nombreArchivo: nombre, mime: req.file.mimetype, tamano: req.file.size,
    });
    res.status(201).json(doc);
  });

  r.put('/documentos/:id', async (req, res) => {
    const { titulo, tipo, expediente, juzgado, fechaDocumento, notas, cliente } = req.body;
    const doc = await Documento.findByIdAndUpdate(req.params.id,
      { titulo, tipo, expediente, juzgado, fechaDocumento: fechaDocumento || null, notas, cliente },
      { new: true, runValidators: true });
    if (!doc) throw err(404, 'Documento no encontrado.');
    res.json(doc);
  });

  r.get('/documentos/:id/archivo', async (req, res) => {
    const doc = await Documento.findById(req.params.id).lean();
    if (!doc) throw err(404, 'Documento no encontrado.');
    const disposicion = req.query.descargar ? 'attachment' : 'inline';
    res.set('Content-Type', doc.mime || 'application/pdf');
    res.set('Content-Disposition', `${disposicion}; filename*=UTF-8''${encodeURIComponent(doc.nombreArchivo || 'documento.pdf')}`);
    bucket().openDownloadStream(doc.archivoId)
      .on('error', () => res.status(404).end())
      .pipe(res);
  });

  r.delete('/documentos/:id', async (req, res) => {
    const doc = await Documento.findByIdAndDelete(req.params.id);
    if (!doc) throw err(404, 'Documento no encontrado.');
    await bucket().delete(doc.archivoId).catch(() => {});
    res.json({ ok: true });
  });

  // Catálogo de servicios y cotizaciones
  crud(r, '/servicios', Servicio, { buscarEn: ['nombre', 'categoria'], orden: { categoria: 1, nombre: 1 } });
  borrar(r, '/servicios', Servicio);

  const calcularCotizacion = async (d, nuevo) => {
    const partidas = (d.partidas || []).map((p) => ({
      ...p,
      servicio: p.servicio || null,
      importe: redondear(p.cantidad * p.precioUnitario),
    }));
    const subtotal = redondear(partidas.reduce((s, p) => s + p.importe, 0));
    const descuento = redondear(Math.min(d.descuento || 0, subtotal));
    const iva = d.conIva ? redondear((subtotal - descuento) * 0.16) : 0;
    const datos = { ...d, cliente: d.cliente || null, partidas, subtotal, descuento, iva, total: redondear(subtotal - descuento + iva) };
    if (nuevo) datos.folio = await siguienteFolio('cotizacion');
    return datos;
  };
  crud(r, '/cotizaciones', Cotizacion, { buscarEn: ['clienteNombre'], antesDeGuardar: calcularCotizacion });
  borrar(r, '/cotizaciones', Cotizacion);

  // Facturas
  const calcularFactura = async (d, nuevo) => {
    const conceptos = (d.conceptos || []).map((c) => {
      const importe = redondear(c.cantidad * c.valorUnitario);
      const base = redondear(importe - (c.descuento || 0));
      const traslados = c.objetoImp === '01' ? [] : [{ impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: 0.16, base, importe: redondear(base * 0.16) }];
      const retenciones = [];
      if (d.conRetenciones) {
        retenciones.push({ impuesto: '001', tipoFactor: 'Tasa', tasaOCuota: 0.10, base, importe: redondear(base * 0.10) });
        retenciones.push({ impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: 0.106667, base, importe: redondear(base * 0.106667) });
      }
      return { ...c, importe, traslados, retenciones };
    });
    const subTotal = redondear(conceptos.reduce((s, c) => s + c.importe, 0));
    const descuento = redondear(conceptos.reduce((s, c) => s + (c.descuento || 0), 0));
    const suma = (lista) => redondear(conceptos.reduce((s, c) => s + c[lista].reduce((a, i) => a + i.importe, 0), 0));
    const totalImpuestosTrasladados = suma('traslados');
    const totalImpuestosRetenidos = suma('retenciones');
    const cfg = await Config.findById('despacho').lean() || {};
    const datos = {
      ...d,
      cliente: d.cliente || null,
      conceptos, subTotal, descuento, totalImpuestosTrasladados, totalImpuestosRetenidos,
      total: redondear(subTotal - descuento + totalImpuestosTrasladados - totalImpuestosRetenidos),
    };
    delete datos.conRetenciones;
    if (nuevo) {
      datos.serie = d.serie || cfg.serieFactura || 'A';
      datos.folio = await siguienteFolio(`factura-${datos.serie}`);
      datos.emisor = { rfc: cfg.rfc, nombre: cfg.abogado || cfg.nombreDespacho, regimenFiscal: cfg.regimenFiscal };
      datos.lugarExpedicion = cfg.codigoPostal;
    }
    if (datos.estatus === 'pagada' && !datos.fechaPago) datos.fechaPago = new Date();
    return datos;
  };
  crud(r, '/facturas', Factura, { buscarEn: ['receptor.nombre', 'receptor.rfc'], orden: { fecha: -1 }, filtros: ['estatus', 'cliente'], antesDeGuardar: calcularFactura });
  borrar(r, '/facturas', Factura, async (id) => {
    const f = await Factura.findById(id).lean();
    if (f?.timbre?.uuid) throw err(409, 'Una factura timbrada no se puede eliminar; cancélela.');
  });

  // Plantillas y contratos
  crud(r, '/plantillas', Plantilla, { buscarEn: ['nombre', 'categoria'], orden: { categoria: 1, nombre: 1 } });
  borrar(r, '/plantillas', Plantilla);
  crud(r, '/contratos', Contrato, { buscarEn: ['titulo'], poblar: 'cliente', filtros: ['cliente'], antesDeGuardar: vacioANull('cliente') });
  borrar(r, '/contratos', Contrato);

  // Ventas (protegido)
  const rangoMes = (mes) => {
    const [a, m] = String(mes || '').split('-').map(Number);
    const hoy = new Date();
    const anio = a || hoy.getFullYear();
    const mesIdx = m ? m - 1 : hoy.getMonth();
    return [new Date(anio, mesIdx, 1), new Date(anio, mesIdx + 1, 1)];
  };

  r.get('/ventas', requiereAccesoVentas, async (req, res) => {
    const [desde, hasta] = rangoMes(req.query.mes);
    const [facturas, ingresos] = await Promise.all([
      Factura.find({ fecha: { $gte: desde, $lt: hasta }, estatus: { $in: ['emitida', 'pagada'] } })
        .sort({ fecha: 1 }).select('serie folio fecha receptor.nombre total estatus').lean(),
      Ingreso.find({ fecha: { $gte: desde, $lt: hasta } }).sort({ fecha: 1 }).populate('cliente', 'nombre').lean(),
    ]);
    const totalFacturado = redondear(facturas.reduce((s, f) => s + (f.total || 0), 0));
    const totalCobrado = redondear(facturas.filter((f) => f.estatus === 'pagada').reduce((s, f) => s + (f.total || 0), 0));
    const totalIngresos = redondear(ingresos.reduce((s, i) => s + i.monto, 0));
    res.json({
      desde, hasta, facturas, ingresos,
      totales: { facturado: totalFacturado, cobrado: totalCobrado, ingresosSinFactura: totalIngresos, total: redondear(totalFacturado + totalIngresos) },
    });
  });
  r.get('/ventas/anual', requiereAccesoVentas, async (req, res) => {
    const anio = Number(req.query.anio) || new Date().getFullYear();
    const meses = Array.from({ length: 12 }, () => 0);
    const desde = new Date(anio, 0, 1);
    const hasta = new Date(anio + 1, 0, 1);
    const [facturas, ingresos] = await Promise.all([
      Factura.find({ fecha: { $gte: desde, $lt: hasta }, estatus: { $in: ['emitida', 'pagada'] } }).select('fecha total').lean(),
      Ingreso.find({ fecha: { $gte: desde, $lt: hasta } }).select('fecha monto').lean(),
    ]);
    for (const f of facturas) meses[new Date(f.fecha).getMonth()] += f.total || 0;
    for (const i of ingresos) meses[new Date(i.fecha).getMonth()] += i.monto || 0;
    res.json({ anio, meses: meses.map(redondear) });
  });
  r.post('/ventas/ingresos', requiereAccesoVentas, async (req, res) => {
    res.status(201).json(await Ingreso.create(vacioANull('cliente')({ ...req.body })));
  });
  r.delete('/ventas/ingresos/:id', requiereAccesoVentas, async (req, res) => {
    await Ingreso.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });

  // Resumen del tablero
  r.get('/resumen', async (_req, res) => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy); manana.setDate(manana.getDate() + 1);
    const [clientes, citasHoy, documentos] = await Promise.all([
      Cliente.estimatedDocumentCount(),
      Cita.countDocuments({ estado: 'programada', inicio: { $gte: hoy, $lt: manana } }),
      Documento.estimatedDocumentCount(),
    ]);
    res.json({ clientes, citasHoy, documentos });
  });

  r.use((_req, _res, next) => next(err(404, 'Ruta no encontrada.')));
  return r;
}
