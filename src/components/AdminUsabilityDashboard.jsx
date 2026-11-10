import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, BarChart3, Download, RefreshCw } from 'lucide-react'
import { getUsabilityDashboard } from '../services/usabilityAdminService.js'

const RATING_LABELS = {
  chatbotDiscoverability: 'Encontrar el chatbot',
  chatbotPromptingEase: 'Explicar qué vehículo buscaban',
  chatbotResultRelevance: 'Relevancia del chatbot',
  catalogNavigation: 'Navegar el catálogo',
  vehicleDetailsClarity: 'Claridad de la ficha',
  comparisonDiscoverability: 'Encontrar la comparación',
  inventoryVariety: 'Variedad del inventario',
  taskCompletion: 'Elegir un vehículo',
  overallSatisfaction: 'Satisfacción general',
}

const AGE_LABELS = { 2: '18–29 años', 3: '30–49 años', 4: '50+ años' }
const DURATION_LABELS = {
  vehicleSelection: 'Inicio → primera ficha',
  surveyOpen: 'Inicio → abrir encuesta',
  surveyCompletion: 'Abrir → enviar encuesta',
  total: 'Inicio → enviar encuesta',
}

const RATING_SEGMENTS = [
  { key: 'notFound', label: 'No encontrada / no usada', color: '#b8bec9' },
  { key: 'low', label: '1–2', color: '#cb806f' },
  { key: 'neutral', label: '3', color: '#d9ac54' },
  { key: 'high', label: '4–5', color: '#679c83' },
]

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function ChartPanel({ title, filename, svgRef, children }) {
  const [exportError, setExportError] = useState('')

  function getSvgBlob() {
    const svg = svgRef.current
    if (!svg) throw new Error('No se pudo encontrar la gráfica para exportar.')
    const clone = svg.cloneNode(true)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', '1200')
    const [, , viewBoxWidth, viewBoxHeight] = clone.getAttribute('viewBox').split(/\s+/).map(Number)
    clone.setAttribute('height', String(Math.round(1200 * viewBoxHeight / viewBoxWidth)))
    const markup = new XMLSerializer().serializeToString(clone)
    return new Blob([markup], { type: 'image/svg+xml;charset=utf-8' })
  }

  function exportSvg() {
    try {
      setExportError('')
      downloadBlob(getSvgBlob(), `${filename}.svg`)
    } catch (error) {
      setExportError(error.message)
    }
  }

  async function exportPng() {
    try {
      setExportError('')
      const svgBlob = getSvgBlob()
      const imageUrl = URL.createObjectURL(svgBlob)
      try {
        const image = new Image()
        image.src = imageUrl
        await image.decode()
        const canvas = document.createElement('canvas')
        canvas.width = 2400
        canvas.height = Math.round(2400 * image.height / image.width)
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Este navegador no permite exportar la gráfica.')
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const pngBlob = await new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('No se pudo generar la imagen PNG.'))
          }, 'image/png')
        })
        downloadBlob(pngBlob, `${filename}.png`)
      } finally {
        URL.revokeObjectURL(imageUrl)
      }
    } catch (error) {
      setExportError(error.message)
    }
  }

  return (
    <section className="usability-dashboard__panel">
      <div className="usability-dashboard__panel-heading">
        <h2>{title}</h2>
        <div className="usability-dashboard__exports" aria-label={`Exportar ${title}`}>
          <button type="button" className="btn btn-outline" onClick={exportPng} title="Descargar PNG para Word">
            <Download size={15} /> PNG
          </button>
          <button type="button" className="btn btn-outline" onClick={exportSvg} title="Descargar SVG vectorial">
            <Download size={15} /> SVG
          </button>
        </div>
      </div>
      {children}
      {exportError && <p className="usability-dashboard__error" role="alert">{exportError}</p>}
    </section>
  )
}

function RatingDistributionChart({ ratings }) {
  const svgRef = useRef(null)
  const width = 1120
  const height = 490
  const labelWidth = 280
  const barWidth = 540
  const barStart = labelWidth
  const rowHeight = 38
  const chartTop = 55
  const legendTop = chartTop + ratings.length * rowHeight + 20

  return (
    <ChartPanel title="Calificación de funciones" filename="escor-calificacion-funciones" svgRef={svgRef}>
      <div className="usability-dashboard__chart">
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Distribución de calificaciones por función">
          <rect width={width} height={height} fill="#ffffff" />
          <text x="20" y="28" fill="#394150" fontSize="16">Distribución de respuestas (número de personas); 0 = no la encontró/no la usó</text>
          {ratings.map((rating, index) => {
            const y = chartTop + index * rowHeight
            const denominator = rating.count || 1
            const segments = [
              rating.counts[0],
              rating.counts[1] + rating.counts[2],
              rating.counts[3],
              rating.counts[4] + rating.counts[5],
            ]
            let x = barStart
            return (
              <g key={rating.key}>
                <text x="20" y={y + 20} fill="#202633" fontSize="15">{RATING_LABELS[rating.key]}</text>
                {segments.map((count, segmentIndex) => {
                  const segmentWidth = (count / denominator) * barWidth
                  const segmentX = x
                  x += segmentWidth
                  return count > 0 ? (
                    <g key={segmentIndex}>
                      <rect x={segmentX} y={y + 4} width={segmentWidth} height="24" fill={RATING_SEGMENTS[segmentIndex].color} />
                      {segmentWidth > 28 && (
                        <text x={segmentX + segmentWidth / 2} y={y + 21} textAnchor="middle" fill="#17202a" fontSize="13" fontWeight="700">
                          {count}
                        </text>
                      )}
                      <title>{RATING_SEGMENTS[segmentIndex].label}: {count}</title>
                    </g>
                  ) : null
                })}
                <text x={barStart + barWidth + 18} y={y + 20} fill="#202633" fontSize="14">
                  {rating.average === null ? 'Sin respuestas' : `${rating.average.toFixed(2)} / 5 · n=${rating.scoredCount}`}
                </text>
              </g>
            )
          })}
          {RATING_SEGMENTS.map((segment, index) => {
            const x = 20 + index * 270
            return (
              <g key={segment.key} transform={`translate(${x}, ${legendTop})`}>
                <rect width="15" height="15" fill={segment.color} />
                <text x="22" y="13" fill="#394150" fontSize="14">{segment.label}</text>
              </g>
            )
          })}
          <text x="20" y={height - 15} fill="#596273" fontSize="12">Los promedios excluyen las respuestas 0. Cada segmento muestra la cantidad de respuestas.</text>
        </svg>
      </div>
    </ChartPanel>
  )
}

function AgeDistributionChart({ ageGroups }) {
  const svgRef = useRef(null)
  const width = 720
  const height = 290
  const maxCount = Math.max(1, ...ageGroups.map((group) => group.count))
  const barMaxWidth = 400

  return (
    <ChartPanel title="Participantes por grupo de edad" filename="escor-participantes-por-edad" svgRef={svgRef}>
      <div className="usability-dashboard__chart">
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Participantes por grupo de edad">
          <rect width={width} height={height} fill="#ffffff" />
          {ageGroups.map((group, index) => {
            const y = 55 + index * 68
            const barWidth = (group.count / maxCount) * barMaxWidth
            return (
              <g key={group.ageGroup}>
                <text x="24" y={y + 23} fill="#202633" fontSize="17">{AGE_LABELS[group.ageGroup]}</text>
                <rect x="220" y={y} width={barWidth} height="34" fill="#c5a059" />
                <text x={230 + barWidth} y={y + 23} fill="#202633" fontSize="17" fontWeight="700">{group.count}</text>
              </g>
            )
          })}
          <text x="24" y="270" fill="#596273" fontSize="13">Personas que enviaron la encuesta</text>
        </svg>
      </div>
    </ChartPanel>
  )
}

function DurationChart({ durations }) {
  const svgRef = useRef(null)
  const width = 820
  const height = 350
  const maxSeconds = Math.max(1, ...durations.map((duration) => duration.medianMs / 1000))
  const barMaxWidth = 460

  return (
    <ChartPanel title="Tiempos medianos de interacción" filename="escor-tiempos-medianos" svgRef={svgRef}>
      <div className="usability-dashboard__chart">
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Tiempos medianos entre hitos de interacción">
          <rect width={width} height={height} fill="#ffffff" />
          {durations.map((duration, index) => {
            const seconds = duration.medianMs === null ? 0 : duration.medianMs / 1000
            const barWidth = (seconds / maxSeconds) * barMaxWidth
            const y = 48 + index * 68
            return (
              <g key={duration.key}>
                <text x="20" y={y + 23} fill="#202633" fontSize="15">{DURATION_LABELS[duration.key]}</text>
                <rect x="270" y={y} width={barWidth} height="34" fill="#6c8caa" />
                <text x={280 + barWidth} y={y + 23} fill="#202633" fontSize="15" fontWeight="700">
                  {duration.medianMs === null ? 'Sin datos' : `${Math.round(seconds)} s · n=${duration.sampleCount}`}
                </text>
              </g>
            )
          })}
          <text x="20" y="332" fill="#596273" fontSize="13">Medianas calculadas por sesión; usar como referencia exploratoria.</text>
        </svg>
      </div>
    </ChartPanel>
  )
}

export default function AdminUsabilityDashboard({ onBack, onLogin, user, onLogout }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadDashboard() {
    setLoading(true)
    setError('')
    try {
      setData(await getUsabilityDashboard())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getUsabilityDashboard()
      .then((dashboard) => {
        if (active) setData(dashboard)
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const downloadableComments = data?.feedbackComments || []

  return (
    <main className="usability-dashboard">
      <header className="usability-dashboard__header">
        <div>
          <span className="label label--gold"><BarChart3 size={14} /> Administración ESCOR</span>
          <h1>Resultados de usabilidad</h1>
          <p>Encuestas y tiempos de interacción. Las respuestas “no la encontré/no la usé” se muestran por separado.</p>
        </div>
        <div className="usability-dashboard__header-actions">
          <button type="button" className="btn btn-outline" onClick={onBack}><ArrowLeft size={15} /> Volver al catálogo</button>
          {user ? (
            <button type="button" className="btn btn-outline" onClick={onLogout}>Cerrar sesión</button>
          ) : <button type="button" className="btn btn-outline" onClick={onLogin}>Iniciar sesión</button>}
        </div>
      </header>

      {loading && <div className="usability-dashboard__notice">Cargando estadísticas…</div>}
      {error && (
        <div className="usability-dashboard__error" role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn-outline" onClick={loadDashboard}><RefreshCw size={15} /> Reintentar</button>
        </div>
      )}
      {!loading && !error && data && (
        <>
          <section className="usability-dashboard__summary" aria-label="Resumen de la encuesta">
            <article><span className="label">Encuestas recibidas</span><strong>{data.surveyCount}</strong></article>
            <article><span className="label">Sesiones con eventos</span><strong>{data.eventSessionCount}</strong></article>
            <article><span className="label">Satisfacción general</span><strong>{data.ratingDistributions.find((rating) => rating.key === 'overallSatisfaction')?.average?.toFixed(2) ?? '—'}<small> / 5</small></strong></article>
          </section>
          {data.surveyCount === 0 ? (
            <div className="usability-dashboard__notice">Todavía no hay encuestas enviadas.</div>
          ) : (
            <>
              <RatingDistributionChart ratings={data.ratingDistributions} />
              <div className="usability-dashboard__charts-row">
                <AgeDistributionChart ageGroups={data.surveyOnlyAgeCounts} />
                <DurationChart durations={data.durations} />
              </div>
              {downloadableComments.length > 0 && (
                <section className="usability-dashboard__panel">
                  <h2>Comentarios opcionales</h2>
                  <p className="usability-dashboard__privacy-note">Solo para revisión administrativa. Revisa y anonimiza cualquier dato personal antes de exportar o incluir comentarios en un informe.</p>
                  <ul className="usability-dashboard__comments">
                    {downloadableComments.map((comment, index) => <li key={`${index}-${comment}`}>{comment}</li>)}
                  </ul>
                </section>
              )}
              <p className="usability-dashboard__footnote">Las gráficas se pueden descargar como PNG (para insertar en Word) o SVG (vectorial). La muestra es exploratoria; los tiempos excluyen sesiones que no enviaron encuesta.</p>
            </>
          )}
        </>
      )}
    </main>
  )
}
