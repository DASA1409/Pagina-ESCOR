import { useEffect, useRef, useState } from 'react'
import { X, Send, Sparkles, FileText, ShieldCheck } from 'lucide-react'
import RobotIcon from './icons/RobotIcon.jsx'
import { useVehicleCatalog } from '../context/VehicleCatalogContext.jsx'
import { sendChatMessage } from '../services/chatService.js'
import { generateLegalInfo, generateTechnicalSheet } from '../utils/documentGenerator.js'

const ADVISOR_KEY = 'escor.advisor.asked'

function welcomeText(vehicle) {
  return vehicle
    ? `Bienvenido al Concierge de ESCOR. Veo que está revisando el ${vehicle.title}. Pregúnteme por su información legal, ficha técnica o pídame un dato rápido.`
    : 'Bienvenido al Concierge de ESCOR. Cuénteme qué vehículo busca: marca, tipo de carrocería, presupuesto o año.'
}

export default function ChatDrawer({ currentVehicle, open, onOpenChange, advisorMode, onAdvisorChange }) {
  const { filters, onApplyFilters, compareIds } = useVehicleCatalog()
  const [messages, setMessages] = useState([{ role: 'assistant', text: welcomeText(null) }])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const scrollRef = useRef(null)
  const lastVehicleId = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  useEffect(() => {
    let alreadyAsked = false
    try {
      alreadyAsked = sessionStorage.getItem(ADVISOR_KEY) === '1'
    } catch {
      alreadyAsked = false
    }
    if (alreadyAsked) return
    const timer = setTimeout(() => setShowOnboarding(true), 3500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (open && currentVehicle && currentVehicle.id !== lastVehicleId.current) {
      lastVehicleId.current = currentVehicle.id
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `Ahora está viendo el ${currentVehicle.title}. ¿Le doy su información legal o ficha técnica?` },
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVehicle, open])

  function markAsked() {
    try {
      sessionStorage.setItem(ADVISOR_KEY, '1')
    } catch {
      /* storage unavailable */
    }
  }

  function acceptAdvisor() {
    onAdvisorChange(true)
    setShowOnboarding(false)
    markAsked()
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', text: 'Modo asesor activado. Cuando abra un vehículo, le mostraré datos junto a la ficha.' },
    ])
  }

  function declineAdvisor() {
    onAdvisorChange(false)
    setShowOnboarding(false)
    markAsked()
  }

  function runAction(action) {
    if (!action) return
    if (action.type === 'legal-pdf') generateLegalInfo(action.vehicle)
    if (action.type === 'technical-pdf') generateTechnicalSheet(action.vehicle)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    const userMessage = { role: 'user', text }
    const conversation = [...messages, userMessage]
    setMessages((prev) => [...prev, userMessage, { role: 'assistant', text: 'Consultando el inventario…', pending: true }])
    setInput('')
    setSending(true)

    try {
      const result = await sendChatMessage({
        messages: conversation.map(({ role, text: messageText }) => ({ role, text: messageText })),
        currentVehicleId: currentVehicle?.id,
        currentFilters: filters,
        compareIds,
      })
      if (result.filters) onApplyFilters(result.filters)
      setMessages((prev) => [
        ...prev.filter((message) => !message.pending),
        { role: 'assistant', text: result.reply, action: result.action },
      ])
    } catch (requestError) {
      setMessages((prev) => [
        ...prev.filter((message) => !message.pending),
        { role: 'assistant', text: `No pude conectar con el asistente: ${requestError.message}` },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {showOnboarding && !open && !currentVehicle && (
        <div className="advisor-bubble glass hairline-gold">
          <div className="advisor-bubble__icon"><RobotIcon size={24} /></div>
          <p>¿Quiere que actúe como su asesor personal y le dé recomendaciones mientras navega?</p>
          <div className="advisor-bubble__actions">
            <button className="btn btn-primary" onClick={acceptAdvisor}>Activar asesor</button>
            <button className="btn btn-ghost" onClick={declineAdvisor}>No, gracias</button>
          </div>
        </div>
      )}

      <button
        className={`chat-fab hairline-gold ${open ? 'is-hidden' : ''} ${advisorMode ? 'is-advisor' : ''}`}
        onClick={() => onOpenChange(true)}
        aria-label="Abrir Concierge IA"
        title="Concierge IA"
      >
        <span className="chat-fab__icon"><RobotIcon size={30} /></span>
        <span className="chat-fab__pulse" />
      </button>

      <div className={`chat-drawer glass hairline-gold ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="chat-drawer__header">
          <div className="chat-drawer__title">
            <RobotIcon size={20} />
            <span>ESCOR Concierge</span>
          </div>
          <button className="modal__close" onClick={() => onOpenChange(false)} aria-label="Cerrar chat">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {currentVehicle && (
          <div className="chat-drawer__context label label--gold">
            <Sparkles size={12} strokeWidth={1.75} /> Contexto: {currentVehicle.title}
          </div>
        )}

        <div className="chat-drawer__messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble chat-bubble--${m.role}`}>
              {m.text}
              {m.action && (
                <button className="chat-bubble__action" onClick={() => runAction(m.action)}>
                  {m.action.type === 'legal-pdf' ? <ShieldCheck size={14} strokeWidth={1.75} /> : <FileText size={14} strokeWidth={1.75} />}
                  {m.action.type === 'legal-pdf' ? 'Descargar info legal PDF' : 'Descargar ficha técnica PDF'}
                </button>
              )}
            </div>
          ))}
        </div>

        <form className="chat-drawer__input" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={sending ? 'Consultando...' : 'Escriba su mensaje…'}
            disabled={sending}
          />
          <button type="submit" className="btn btn-primary" aria-label="Enviar" disabled={sending || !input.trim()}>
            <Send size={16} strokeWidth={1.75} />
          </button>
        </form>
      </div>
    </>
  )
}
