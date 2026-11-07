import { useState } from 'react'
import { CheckCircle2, ClipboardCheck, X } from 'lucide-react'
import { recordUsabilityEvent, submitUsabilitySurvey } from '../services/usabilityService.js'

const AGE_GROUPS = [
  { value: '1', label: 'Menor de 18' },
  { value: '2', label: '18 a 29' },
  { value: '3', label: '30 a 49' },
  { value: '4', label: '50 o más' },
]

const QUESTIONS = [
  { key: 'chatbotDiscoverability', label: '¿Qué tan fácil fue encontrar y abrir el chatbot?' },
  { key: 'chatbotPromptingEase', label: '¿Qué tan fácil fue explicarle al chatbot qué vehículo buscabas?' },
  { key: 'chatbotResultRelevance', label: '¿Qué tan útiles y relevantes fueron los resultados del chatbot?' },
  { key: 'catalogNavigation', label: '¿Qué tan fácil fue explorar el catálogo y sus filtros?' },
  { key: 'vehicleDetailsClarity', label: '¿Qué tan clara fue la información de la ficha del vehículo?' },
  { key: 'comparisonDiscoverability', label: '¿Qué tan fácil fue encontrar y usar la comparación de vehículos?' },
  { key: 'inventoryVariety', label: '¿Qué tan adecuada te pareció la variedad de vehículos disponibles?' },
  { key: 'taskCompletion', label: '¿Qué tan fácil fue encontrar y elegir un vehículo que te interesara?' },
  { key: 'overallSatisfaction', label: 'En general, ¿qué tan satisfactoria fue tu experiencia en la página?' },
]

const ANSWER_OPTIONS = [
  { value: '0', label: 'No la encontré / no la usé' },
  { value: '1', label: '1 — Muy mala / muy difícil' },
  { value: '2', label: '2 — Mala / difícil' },
  { value: '3', label: '3 — Regular' },
  { value: '4', label: '4 — Buena / fácil' },
  { value: '5', label: '5 — Muy buena / muy fácil' },
]

export default function UsabilitySurveyModal({ open, onClose }) {
  const [ageGroup, setAgeGroup] = useState('')
  const [answers, setAnswers] = useState({})
  const [consent, setConsent] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function handleSubmit(event) {
    event.preventDefault()
    if (!consent || submitting) return

    setSubmitting(true)
    setError('')
    try {
      recordUsabilityEvent('usability_survey_submitted')
      await submitUsabilitySurvey(Number(ageGroup), Object.fromEntries(
        QUESTIONS.map(({ key }) => [key, Number(answers[key])]),
      ))
      setSubmitted(true)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    if (submitting) return
    if (!submitted) recordUsabilityEvent('usability_survey_closed')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <section
        className="usability-modal glass hairline-gold"
        role="dialog"
        aria-modal="true"
        aria-labelledby="usability-survey-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal__close" onClick={handleClose} aria-label="Cerrar encuesta" disabled={submitting}>
          <X size={20} strokeWidth={1.75} />
        </button>

        {submitted ? (
          <div className="usability-survey__success">
            <CheckCircle2 size={38} strokeWidth={1.5} />
            <h2 id="usability-survey-title">¡Gracias por participar!</h2>
            <p>Tus respuestas anónimas nos ayudarán a mejorar la experiencia.</p>
            <button type="button" className="btn btn-primary" onClick={onClose}>Cerrar</button>
          </div>
        ) : (
          <>
            <header className="usability-survey__header">
              <span className="label label--gold"><ClipboardCheck size={14} /> Prueba de usabilidad</span>
              <h2 id="usability-survey-title">¿Cómo fue tu experiencia?</h2>
              <p>Son 10 preguntas breves. No pedimos nombre, correo ni teléfono. Los tiempos se mantienen temporalmente en esta página y solo se guardan si envías la encuesta. La participación es voluntaria; si eres menor de 18 años, participa con autorización de tu acudiente.</p>
            </header>

            <form className="usability-survey__form" onSubmit={handleSubmit}>
              <label className="usability-survey__question">
                <span><strong>1.</strong> ¿En qué grupo de edad estás?</span>
                <select value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)} required>
                  <option value="">Selecciona una opción</option>
                  {AGE_GROUPS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>

              {QUESTIONS.map(({ key, label }, index) => (
                <label className="usability-survey__question" key={key}>
                  <span><strong>{index + 2}.</strong> {label}</span>
                  <select
                    value={answers[key] ?? ''}
                    onChange={(event) => setAnswers((current) => ({ ...current, [key]: event.target.value }))}
                    required
                  >
                    <option value="">Selecciona una opción</option>
                    {ANSWER_OPTIONS.map(({ value, label: optionLabel }) => (
                      <option key={value} value={value}>{optionLabel}</option>
                    ))}
                  </select>
                </label>
              ))}

              <label className="usability-survey__consent">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required />
                <span>Participo voluntariamente y autorizo guardar mis respuestas y tiempos de interacción sin datos personales. Si soy menor de edad, cuento con autorización de mi acudiente.</span>
              </label>

              {error && <p className="auth-form__error" role="alert">{error}</p>}
              <button type="submit" className="btn btn-primary usability-survey__submit" disabled={submitting || !consent}>
                {submitting ? 'Enviando respuestas…' : 'Enviar encuesta'}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  )
}
