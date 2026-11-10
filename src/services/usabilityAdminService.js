const API_URL = import.meta.env.VITE_API_URL || '/api'

export async function getUsabilityDashboard() {
  const response = await fetch(`${API_URL}/admin/usability`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las estadísticas.')
  return data
}
