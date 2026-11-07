const API_URL = import.meta.env.VITE_API_URL || '/api'

function normalizeSearchText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function matchesText(value, requested) {
  const normalizedValue = normalizeSearchText(value)
  const normalizedRequest = normalizeSearchText(requested)
  if (!normalizedValue || !normalizedRequest) return false
  return normalizedValue.includes(normalizedRequest) || normalizedRequest.includes(normalizedValue)
}

export async function getVehicleCatalog() {
  const response = await fetch(`${API_URL}/vehicles`)
  if (!response.ok) throw new Error(`Vehicle API error ${response.status}`)

  const data = await response.json()
  return data.vehicles ?? []
}

export function filterVehicles(vehicles, filters = {}) {
  return vehicles.filter((v) => {
    if (filters.make && !matchesText(v.make, filters.make)) return false
    if (filters.model && !matchesText(v.model, filters.model)) return false
    if (filters.bodyType && !matchesText(v.bodyType, filters.bodyType)) return false
    if (filters.transmission && !matchesText(v.transmission, filters.transmission)) return false
    if (filters.maxBudget && v.price > filters.maxBudget) return false
    if (filters.minBudget && v.price < filters.minBudget) return false
    if (filters.minYear && v.year < filters.minYear) return false
    if (filters.maxYear && v.year > filters.maxYear) return false
    if (filters.fuelType && !matchesText(v.fuelType, filters.fuelType)) return false
    if (filters.collectorOnly && !v.isCollector) return false
    if (filters.query) {
      const searchableFields = [
        v.make,
        v.model,
        v.bodyType,
        v.fuelType,
        v.transmission,
        v.engine,
        v.color,
        v.location,
      ]
      const queryTokens = String(filters.query).trim().split(/\s+/).filter(Boolean)
      if (!queryTokens.every((token) => searchableFields.some((field) => matchesText(field, token)))) return false
    }
    return true
  })
}

export function sortVehicles(vehicles, sortKey) {
  const sorted = [...vehicles]
  if (sortKey === 'price-desc') sorted.sort((a, b) => b.price - a.price)
  else if (sortKey === 'price-asc') sorted.sort((a, b) => a.price - b.price)
  else if (sortKey === 'year-desc') sorted.sort((a, b) => b.year - a.year)
  else if (sortKey === 'mileage-asc') sorted.sort((a, b) => a.mileage - b.mileage)
  return sorted
}

export function getMakeList(vehicles) {
  return [...new Set(vehicles.map((v) => v.make))].sort()
}

export function getModelsForSelectedMake(vehicles, make) {
  if (!make) return []
  return [...new Set(vehicles.filter((v) => v.make === make).map((v) => v.model))].sort()
}

export function getVehicleById(vehicles, id) {
  return vehicles.find((v) => v.id === id) ?? null
}
