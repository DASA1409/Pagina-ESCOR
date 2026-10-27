import { jsPDF } from 'jspdf'
import { formatCOP } from '../services/priceEstimate.js'

const GOLD = [197, 160, 89]
const CARBON = [11, 12, 16]
const GRAY = [100, 106, 118]

function baseDoc(title, vehicle) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  doc.setFillColor(...CARBON)
  doc.rect(0, 0, 595, 90, 'F')
  doc.setTextColor(...GOLD)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('ESCOR', 48, 45)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(title.toUpperCase(), 48, 65)

  doc.setTextColor(...GRAY)
  doc.setFontSize(9)
  doc.text(`Generado: ${new Date().toLocaleDateString()}`, 420, 45)
  doc.text(`Vehículo: ${vehicle.title}`, 420, 60)

  doc.setTextColor(30, 30, 30)
  return doc
}

function drawSectionTitle(doc, text, y) {
  doc.setTextColor(...GOLD)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(text, 48, y)
  doc.setDrawColor(...GOLD)
  doc.line(48, y + 6, 547, y + 6)
  doc.setTextColor(40, 40, 40)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
}

function drawRow(doc, label, value, x, y) {
  doc.setFont('helvetica', 'bold')
  doc.text(label, x, y)
  doc.setFont('helvetica', 'normal')
  doc.text(String(value ?? '—'), x, y + 14)
}

export function generateTechnicalSheet(vehicle) {
  const doc = baseDoc('Ficha Técnica', vehicle)
  let y = 130

  drawSectionTitle(doc, 'Identificación', y)
  y += 26
  drawRow(doc, 'MARCA', vehicle.make, 48, y)
  drawRow(doc, 'MODELO', vehicle.model, 220, y)
  drawRow(doc, 'AÑO', vehicle.year, 400, y)
  y += 40

  drawSectionTitle(doc, 'Especificaciones mecánicas', y)
  y += 26
  drawRow(doc, 'MOTOR', vehicle.engine, 48, y)
  drawRow(doc, 'POTENCIA', `${vehicle.horsepower} hp`, 220, y)
  drawRow(doc, 'TRANSMISIÓN', vehicle.transmission, 400, y)
  y += 40
  drawRow(doc, 'TRACCIÓN', vehicle.drivetrain, 48, y)
  drawRow(doc, 'COMBUSTIBLE', vehicle.fuelType, 220, y)
  drawRow(doc, 'RENDIMIENTO', vehicle.mpg ? `${vehicle.mpg} mpg` : 'N/A', 400, y)
  y += 40

  drawSectionTitle(doc, 'Carrocería y confort', y)
  y += 26
  drawRow(doc, 'TIPO', vehicle.bodyType, 48, y)
  drawRow(doc, 'PUERTAS', vehicle.doors, 220, y)
  drawRow(doc, 'ASIENTOS', vehicle.seats, 400, y)
  y += 40
  drawRow(doc, 'COLOR', vehicle.color, 48, y)
  drawRow(doc, 'CONDICIÓN', vehicle.condition, 220, y)
  drawRow(doc, 'KILOMETRAJE', `${vehicle.mileage.toLocaleString()} km`, 400, y)
  y += 40

  drawSectionTitle(doc, 'Precio', y)
  y += 26
  drawRow(doc, 'PRECIO DE LISTA', formatCOP(vehicle.price), 48, y)

  doc.save(`ESCOR-ficha-tecnica-${vehicle.make}-${vehicle.model}-${vehicle.year}.pdf`)
}

export function generateLegalInfo(vehicle) {
  const doc = baseDoc('Información Legal', vehicle)
  let y = 130

  drawSectionTitle(doc, 'Identificación del vehículo', y)
  y += 26
  drawRow(doc, 'VIN (SIMULADO)', vehicle.vin, 48, y)
  drawRow(doc, 'PLACA', 'Pendiente de registro', 300, y)
  y += 40

  drawSectionTitle(doc, 'Situación legal', y)
  y += 26
  doc.text('• Sin reportes de accidentes graves registrados (simulado).', 48, y)
  y += 18
  doc.text('• Sin gravámenes ni prendas activas (simulado).', 48, y)
  y += 18
  doc.text('• Documento de traspaso disponible al cierre de la venta.', 48, y)
  y += 18
  doc.text('• Revisión técnica vehicular vigente (simulado).', 48, y)
  y += 40

  drawSectionTitle(doc, 'Nota', y)
  y += 26
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.text(
    'Este documento es de carácter informativo y forma parte de la simulación de la plataforma ESCOR.',
    48,
    y,
    { maxWidth: 500 },
  )

  doc.save(`ESCOR-info-legal-${vehicle.make}-${vehicle.model}-${vehicle.year}.pdf`)
}

export function generateSalesAgreement(vehicle, buyer = {}) {
  const doc = baseDoc('Contrato de Compraventa', vehicle)
  let y = 130

  drawSectionTitle(doc, 'Partes', y)
  y += 26
  drawRow(doc, 'VENDEDOR', 'ESCOR Marketplace S.A.', 48, y)
  drawRow(doc, 'COMPRADOR', buyer.name || '__________________________', 300, y)
  y += 40

  drawSectionTitle(doc, 'Objeto del contrato', y)
  y += 26
  doc.setFontSize(10)
  doc.text(
    `El vendedor transfiere al comprador la propiedad del vehículo ${vehicle.title}, VIN ${vehicle.vin}, ` +
      `por el precio acordado de ${formatCOP(vehicle.price)}, sujeto a los términos y condiciones descritos a continuación.`,
    48,
    y,
    { maxWidth: 500 },
  )
  y += 60

  drawSectionTitle(doc, 'Condiciones', y)
  y += 26
  doc.setFontSize(10)
  doc.text('1. El vehículo se entrega en el estado descrito en la ficha técnica adjunta.', 48, y)
  y += 18
  doc.text('2. El comprador declara haber inspeccionado el vehículo previamente.', 48, y)
  y += 18
  doc.text('3. La transferencia legal se formaliza ante notario o entidad correspondiente.', 48, y)
  y += 60

  drawSectionTitle(doc, 'Firmas', y)
  y += 50
  doc.line(48, y, 250, y)
  doc.line(320, y, 522, y)
  doc.setFontSize(9)
  doc.text('Vendedor', 48, y + 14)
  doc.text('Comprador', 320, y + 14)

  doc.save(`ESCOR-compraventa-${vehicle.make}-${vehicle.model}-${vehicle.year}.pdf`)
}
