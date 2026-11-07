const API_URL = import.meta.env.VITE_API_URL || '/api'
const sessionId = crypto.randomUUID()
let sequenceNumber = 0
let sessionStarted = false
const events = []

export function recordUsabilityEvent(eventType) {
  if (eventType === 'session_started') {
    if (sessionStarted) return
    sessionStarted = true
  }
  const currentSequence = ++sequenceNumber
  events.push({
    sequenceNumber: currentSequence,
    eventType,
    elapsedMs: Math.round(performance.now()),
  })
}

export async function submitUsabilitySurvey(ageGroup, answers) {
  const response = await fetch(`${API_URL}/usability/surveys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, ageGroup, consent: true, answers, events }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'No se pudo guardar la encuesta.')
  return data
}
