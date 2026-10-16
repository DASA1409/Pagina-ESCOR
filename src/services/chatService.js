const API_URL = import.meta.env.VITE_API_URL || '/api'

export async function sendChatMessage(payload) {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'No se pudo obtener respuesta del Concierge')
  return data
}
