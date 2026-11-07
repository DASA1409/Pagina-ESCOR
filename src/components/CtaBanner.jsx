import { ClipboardCheck } from 'lucide-react'

export default function CtaBanner({ onOpenChat, onOpenUsabilitySurvey }) {
  return (
    <section id="asesoria" className="cta-banner">
      <div className="container cta-banner__inner">
        <div className="cta-banner__card glass hairline-gold">
          <span className="label label--gold">Concierge Personal</span>
          <h2>¿Prefiere que le ayudemos a elegir?</h2>
          <p>Cuéntele al Concierge IA qué vehículo busca. Al finalizar, comparta su experiencia para ayudarnos a mejorar la aplicación.</p>
          <div className="cta-banner__actions">
            <button className="btn btn-primary" onClick={onOpenChat}>Hablar con el Concierge IA</button>
            <button className="btn btn-outline" onClick={onOpenUsabilitySurvey}>
              <ClipboardCheck size={16} strokeWidth={1.75} /> Finalizar prueba
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
