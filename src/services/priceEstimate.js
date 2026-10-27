import { estimatePriceRange } from './vehicleSimulation.js'

export function formatCOP(amount) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(amount)
  return `COP $${formattedAmount}`
}

export function getPriceEstimate(listing) {
  const { low, high } = estimatePriceRange(listing)
  return {
    low,
    high,
    display: `${formatCOP(low)} – ${formatCOP(high)}`,
  }
}

export function withinBudget(listing, maxBudget) {
  if (!maxBudget) return true
  return listing.price <= maxBudget
}
