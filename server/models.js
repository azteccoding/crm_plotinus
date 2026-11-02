import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name });
const opts = { timestamps: true, versionKey: false };

export const Cliente = model('Cliente', new Schema({
  nombre: { type: String, required: true, trim: true },
  tipoPersona: { type: String, enum: ['fisica', 'moral'], default: 'fisica' },
  telefono: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  curp: { type: String, trim: true, uppercase: true },
  rfc: { type: String, trim: true, uppercase: true },
  domicilio: { type: String, trim: true },
  ocupacion: { type: String, trim: true },
  identificacion: { type: String, trim: true },
  materia: { type: String, trim: true },
  expediente: { type: String, trim: true },
  notas: { type: String },
  // Datos fiscales del receptor (CFDI 4.0)
  regimenFiscal: { type: String, trim: true },
  codigoPostal: { type: String, trim: true },
  usoCfdi: { type: String, trim: true, default: 'G03' },
}, opts), 'clientes');

export const Cita = model('Cita', new Schema({
  cliente: ref('Cliente'),
  titulo: { type: String, required: true, trim: true },
  tipo: { type: String, default: 'Consulta' },
  inicio: { type: Date, required: true, index: true },
  duracionMin: { type: Number, default: 60 },
  lugar: { type: String, trim: true },
  notas: { type: String },
  estado: { type: String, enum: ['programada', 'realizada', 'cancelada'], default: 'programada' },
}, opts), 'citas');

export const Documento = model('Documento', new Schema({
  cliente: { ...ref('Cliente'), required: true, index: true },
  titulo: { type: String, required: true, trim: true },
  tipo: { type: String, default: 'Acuerdo' },
  expediente: { type: String, trim: true },
  juzgado: { type: String, trim: true },
  fechaDocumento: { type: Date },
  notas: { type: String },
  archivoId: { type: Schema.Types.ObjectId, required: true },
  nombreArchivo: String,
  mime: String,
  tamano: Number,
}, opts), 'documentos');

export const Servicio = model('Servicio', new Schema({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  categoria: { type: String, trim: true, default: 'General' },
  precio: { type: Number, required: true, min: 0 },
  unidad: { type: String, trim: true, default: 'por asunto' },
  claveProdServ: { type: String, trim: true },
  activo: { type: Boolean, default: true },
}, opts), 'servicios');

const partidaSchema = new Schema({
  servicio: ref('Servicio'),
  descripcion: { type: String, required: true },
  cantidad: { type: Number, default: 1, min: 0 },
  precioUnitario: { type: Number, default: 0, min: 0 },
  importe: { type: Number, default: 0 },
}, { _id: false });

export const Cotizacion = model('Cotizacion', new Schema({
  folio: { type: Number, index: true },
  fecha: { type: Date, default: Date.now },
  cliente: ref('Cliente'),
  clienteNombre: { type: String, required: true, trim: true },
  partidas: [partidaSchema],
  subtotal: Number,
  descuento: { type: Number, default: 0 },
  conIva: { type: Boolean, default: false },
  iva: { type: Number, default: 0 },
  total: Number,
  vigenciaDias: { type: Number, default: 15 },
  notas: String,
}, opts), 'cotizaciones');

// Estructura alineada con el Anexo 20 (CFDI 4.0) para facilitar el timbrado futuro con un PAC.
const impuestoSchema = new Schema({
  impuesto: { type: String, default: '002' }, // 001 ISR, 002 IVA
  tipoFactor: { type: String, default: 'Tasa' },
  tasaOCuota: Number,
  base: Number,
  importe: Number,
}, { _id: false });

const conceptoSchema = new Schema({
  claveProdServ: { type: String, default: '' },
  noIdentificacion: String,
  cantidad: { type: Number, default: 1 },
  claveUnidad: { type: String, default: 'E48' },
  unidad: { type: String, default: 'Unidad de servicio' },
  descripcion: { type: String, required: true },
  valorUnitario: { type: Number, default: 0 },
  importe: Number,
  descuento: { type: Number, default: 0 },
  objetoImp: { type: String, default: '02' },
  traslados: [impuestoSchema],
  retenciones: [impuestoSchema],
}, { _id: false });

export const Factura = model('Factura', new Schema({
  version: { type: String, default: '4.0' },
  serie: { type: String, default: 'A' },
  folio: Number,
  fecha: { type: Date, default: Date.now, index: true },
  tipoDeComprobante: { type: String, default: 'I' },
  exportacion: { type: String, default: '01' },
  lugarExpedicion: String,
  moneda: { type: String, default: 'MXN' },
  tipoCambio: Number,
  formaPago: { type: String, default: '03' },
  metodoPago: { type: String, default: 'PUE' },
  condicionesDePago: String,
  emisor: { rfc: String, nombre: String, regimenFiscal: String },
  cliente: ref('Cliente'),
  receptor: {
    rfc: { type: String, default: 'XAXX010101000' },
    nombre: { type: String, required: true },
    domicilioFiscalReceptor: String,
    regimenFiscalReceptor: { type: String, default: '616' },
    usoCFDI: { type: String, default: 'G03' },
    email: String,
  },
  conceptos: [conceptoSchema],
  subTotal: Number,
  descuento: { type: Number, default: 0 },
  totalImpuestosTrasladados: { type: Number, default: 0 },
  totalImpuestosRetenidos: { type: Number, default: 0 },
  total: Number,
  estatus: { type: String, enum: ['borrador', 'emitida', 'pagada', 'cancelada'], default: 'emitida' },
  fechaPago: Date,
  notas: String,
  timbre: {
    uuid: String,
    fechaTimbrado: Date,
    rfcProvCertif: String,
    noCertificadoSAT: String,
    selloCFD: String,
    selloSAT: String,
    xml: String,
  },
}, opts), 'facturas');

export const Ingreso = model('Ingreso', new Schema({
  fecha: { type: Date, default: Date.now, index: true },
  concepto: { type: String, required: true, trim: true },
  cliente: ref('Cliente'),
  monto: { type: Number, required: true, min: 0 },
  formaPago: { type: String, default: 'Efectivo' },
  notas: String,
}, opts), 'ingresos');

export const Plantilla = model('Plantilla', new Schema({
  clave: { type: String, index: true },
  nombre: { type: String, required: true, trim: true },
  categoria: { type: String, default: 'Contrato' },
  descripcion: String,
  cuerpo: { type: String, required: true },
}, opts), 'plantillas');

export const Contrato = model('Contrato', new Schema({
  plantilla: ref('Plantilla'),
  titulo: { type: String, required: true },
  cliente: ref('Cliente'),
  valores: { type: Map, of: String },
  contenido: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
}, opts), 'contratos');

export const Config = model('Config', new Schema({
  _id: { type: String, default: 'despacho' },
  nombreDespacho: String,
  abogado: String,
  cedula: String,
  rfc: String,
  regimenFiscal: String,
  domicilio: String,
  ciudad: String,
  codigoPostal: String,
  telefono: String,
  whatsapp: String,
  email: String,
  sitioWeb: String,
  serieFactura: String,
  notasCotizacion: String,
}, { versionKey: false, timestamps: true }), 'configuracion');

export const Seguridad = model('Seguridad', new Schema({
  _id: { type: String, default: 'claves' },
  secretariaHash: String,
  abogadoHash: String,
  superHash: String,
}, { versionKey: false, timestamps: true }), 'seguridad');

const Contador = model('Contador', new Schema({ _id: String, seq: Number }, { versionKey: false }), 'contadores');

export async function siguienteFolio(clave) {
  const c = await Contador.findByIdAndUpdate(clave, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return c.seq;
}
