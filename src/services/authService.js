const API_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'No se pudo completar la solicitud')
  return data
}

export function getCurrentUser() {
  return request('/auth/me')
}

export function login(email, password) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export function logout() {
  return request('/auth/logout', { method: 'POST' })
}

export function createVehicle(vehicle) {
  return request('/vehicles', { method: 'POST', body: JSON.stringify(vehicle) })
}

export function updateVehicle(vehicle) {
  if (!vehicle.id) throw new Error('El vehículo no tiene un id válido')
  return request(`/vehicles/${vehicle.id}`, { method: 'PUT', body: JSON.stringify(vehicle) })
}
