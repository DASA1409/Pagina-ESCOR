import { parseNaturalLanguage } from '../chat/nlpParser.js'
import { mergeChatFilters } from '../chat/mergeChatFilters.js'
import { formatCOP } from '../services/priceEstimate.js'
import { filterVehicles } from '../services/vehicleCatalogService.js'

function summarizeFilters(filters) {
  const parts = []
  if (filters.make) parts.push(filters.make)
  if (filters.bodyType) parts.push(filters.bodyType)
  if (filters.fuelType) parts.push(filters.fuelType)
  if (filters.minYear && filters.maxYear) parts.push(`${filters.minYear}–${filters.maxYear}`)
  else if (filters.minYear) parts.push(`desde ${filters.minYear}`)
  else if (filters.maxYear) parts.push(`hasta ${filters.maxYear}`)
  if (filters.maxBudget) parts.push(`bajo ${formatCOP(filters.maxBudget)}`)
  if (filters.minBudget) parts.push(`sobre ${formatCOP(filters.minBudget)}`)
  return parts.join(' · ')
}

export function processMessage({ text, currentFilters, allVehicles, currentVehicle }) {
  const { filters: parsedFilters, intent } = parseNaturalLanguage(text)

  if (intent === 'greeting') {
    const reply = currentVehicle
      ? `Bienvenido al Concierge de ESCOR. Veo que está revisando el ${currentVehicle.title}. Puedo darle su información legal, ficha técnica o un dato rápido sobre él.`
      : 'Bienvenido al Concierge de ESCOR. Cuénteme qué vehículo busca: marca, tipo de carrocería, presupuesto o año.'
    return { reply, filters: currentFilters, intent }
  }

  if (intent === 'thanks') {
    return {
      reply: 'Con gusto. Estoy aquí para afinar la búsqueda cuando lo necesite.',
      filters: currentFilters,
      intent,
    }
  }

  if (intent === 'compare') {
    return {
      reply: 'Seleccione hasta dos vehículos desde el catálogo y presione "Comparar" para ver la ficha comparativa lado a lado.',
      filters: currentFilters,
      intent,
    }
  }

  if (intent === 'legal_info') {
    if (currentVehicle) {
      return {
        reply:
          `Información legal de ${currentVehicle.title}: VIN ${currentVehicle.vin}, sin gravámenes ni prendas registradas (simulado), condición "${currentVehicle.condition}". ` +
          `¿Le genero el documento en PDF?`,
        filters: currentFilters,
        intent,
        action: { type: 'legal-pdf', vehicle: currentVehicle },
      }
    }
    return {
      reply: 'Abra la ficha de un vehículo desde el catálogo y con gusto le doy su información legal específica.',
      filters: currentFilters,
      intent,
    }
  }

  if (intent === 'document') {
    if (currentVehicle) {
      return {
        reply: `Preparo la ficha técnica de ${currentVehicle.title} con motor, potencia, transmisión y kilometraje.`,
        filters: currentFilters,
        intent,
        action: { type: 'technical-pdf', vehicle: currentVehicle },
      }
    }
    return {
      reply: 'Abra la ficha de un vehículo y use los botones de descarga, o pídame la ficha técnica mientras lo está revisando.',
      filters: currentFilters,
      intent,
    }
  }

  const merged = mergeChatFilters(currentFilters, parsedFilters)
  const hasCriteria = Object.keys(parsedFilters).length > 0
  const summary = summarizeFilters(merged)
  const resultsCount = filterVehicles(allVehicles, merged).length

  let reply
  if (!hasCriteria) {
    reply = 'No identifiqué criterios claros. Intente algo como "SUV familiar bajo 30000" o "Toyota Corolla 2020 en adelante".'
  } else if (resultsCount === 0) {
    reply = `Apliqué ${summary || 'sus criterios'}, pero no encontré coincidencias. Intente ampliar el presupuesto o el año.`
  } else {
    reply = `Encontré ${resultsCount} vehículo${resultsCount === 1 ? '' : 's'} que coincide${resultsCount === 1 ? '' : 'n'} con ${summary || 'su búsqueda'}.`
  }

  return { reply, filters: merged, intent }
}
