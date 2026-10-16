const API_URL = import.meta.env.VITE_API_URL || '/api'

export async function getVehicleCatalog() {
  const response = await fetch(`${API_URL}/vehicles`)
  if (!response.ok) throw new Error(`Vehicle API error ${response.status}`)

  const data = await response.json()
  return data.vehicles ?? []
}

export function filterVehicles(vehicles, filters = {}) {
  return vehicles.filter((v) => {
    if (filters.make && v.make.toLowerCase() !== filters.make.toLowerCase()) return false
    if (filters.model && v.model.toLowerCase() !== filters.model.toLowerCase()) return false
    if (filters.bodyType && v.bodyType.toLowerCase() !== filters.bodyType.toLowerCase()) return false
    if (filters.transmission && v.transmission.toLowerCase() !== filters.transmission.toLowerCase()) return false
    if (filters.maxBudget && v.price > filters.maxBudget) return false
    if (filters.minBudget && v.price < filters.minBudget) return false
    if (filters.minYear && v.year < filters.minYear) return false
    if (filters.maxYear && v.year > filters.maxYear) return false
    if (filters.fuelType && v.fuelType.toLowerCase() !== filters.fuelType.toLowerCase()) return false
    if (filters.collectorOnly && !v.isCollector) return false
    if (filters.query) {
      const q = filters.query.toLowerCase()
      const haystack = `${v.make} ${v.model} ${v.bodyType} ${v.fuelType}`.toLowerCase()
      if (!haystack.includes(q)) return false
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
