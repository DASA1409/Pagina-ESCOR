import { GoogleGenAI, FunctionCallingConfigMode, Type } from '@google/genai'

let ai = null

const toolDeclarations = [
  {
    name: 'search_inventory',
    description: 'Busca vehículos reales del inventario aplicando criterios que pidió el usuario. Úsala para cualquier recomendación o búsqueda de vehículos.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        make: { type: Type.STRING, description: 'Marca, por ejemplo Toyota' },
        model: { type: Type.STRING, description: 'Modelo del vehículo' },
        bodyType: { type: Type.STRING, description: 'Carrocería, por ejemplo SUV o Sedan' },
        fuelType: { type: Type.STRING, description: 'Tipo de combustible' },
        transmission: { type: Type.STRING, description: 'Tipo de transmisión' },
        minYear: { type: Type.INTEGER, description: 'Año mínimo' },
        maxYear: { type: Type.INTEGER, description: 'Año máximo' },
        minBudget: { type: Type.NUMBER, description: 'Precio mínimo' },
        maxBudget: { type: Type.NUMBER, description: 'Precio máximo' },
        query: { type: Type.STRING, description: 'Texto libre que debe aparecer en marca, modelo, carrocería o combustible' },
      },
    },
  },
  {
    name: 'get_current_vehicle',
    description: 'Consulta los datos guardados en la base de datos para el vehículo que el usuario tiene abierto.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'open_vehicle_details',
    description: 'Abre la ficha detallada del vehículo cuando el usuario pide más detalles. Si menciona un vehículo, identifica marca, modelo y año; si ya está viendo uno, puedes abrir el actual.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        vehicleId: { type: Type.STRING, description: 'Id exacto de un vehículo obtenido del inventario' },
        make: { type: Type.STRING, description: 'Marca mencionada por el usuario' },
        model: { type: Type.STRING, description: 'Modelo mencionado por el usuario' },
        year: { type: Type.INTEGER, description: 'Año si el usuario lo mencionó' },
      },
    },
  },
  {
    name: 'get_comparison_vehicles',
    description: 'Obtiene dos vehículos del inventario para compararlos. Si el usuario nombra los vehículos, completa firstVehicle y secondVehicle con marca, modelo y año si lo menciona. Si no los nombra, usa los vehículos seleccionados en el comparador.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        firstVehicle: {
          type: Type.OBJECT,
          properties: {
            vehicleId: { type: Type.STRING },
            make: { type: Type.STRING },
            model: { type: Type.STRING },
            year: { type: Type.INTEGER },
          },
        },
        secondVehicle: {
          type: Type.OBJECT,
          properties: {
            vehicleId: { type: Type.STRING },
            make: { type: Type.STRING },
            model: { type: Type.STRING },
            year: { type: Type.INTEGER },
          },
        },
      },
    },
  },
  {
    name: 'request_vehicle_pdf',
    description: 'Solicita generar una ficha técnica o un documento informativo legal del vehículo actualmente abierto.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        documentType: { type: Type.STRING, enum: ['technical', 'legal'] },
      },
      required: ['documentType'],
    },
  },
]

const systemInstruction = `Eres ESCOR Concierge, un asistente de compra de vehículos que responde en español, con tono claro y amable.
Usa las funciones para obtener información del inventario; nunca inventes vehículos, especificaciones, precios, VIN ni disponibilidad. Todos los precios y presupuestos están en pesos colombianos: escribe siempre COP antes del símbolo $, por ejemplo COP $85.000.000. Valores conocidos de carrocería: Sedan, SUV, Hatchback, Pickup, Coupe y Minivan; busca sin distinguir mayúsculas y espacios alrededor.
Si no hay un vehículo abierto, dilo antes de ofrecer datos específicos de uno. Para solicitudes legales, aclara que el PDF disponible es informativo y simulado, no una certificación oficial.
Cuando el usuario describa una búsqueda, llama search_inventory con sus criterios. No digas que aplicaste filtros si la función no fue llamada. Si la consulta no coincide con el inventario, explica que no hay coincidencias y propone criterios más amplios.
Cada mensaje nuevo inicia una búsqueda limpia: no heredes filtros de mensajes anteriores; usa solo los criterios explícitos del mensaje actual y consulta el inventario desde cero.
Si el usuario pide más detalles de un vehículo, usa open_vehicle_details para resolverlo en el inventario y ofrecer abrir su ficha; no te limites a describirlo en el chat.
Si el usuario pide una comparación, consulta get_comparison_vehicles con los dos vehículos que nombró. Si no nombró ninguno, consulta los seleccionados en el comparador. Compara solo datos devueltos por la función. Para pedir un PDF, usa request_vehicle_pdf y confirma qué tipo de documento se preparó.`

function getProviderStatus(error) {
  const directStatus = Number(error?.status || error?.code)
  if (Number.isFinite(directStatus) && directStatus >= 400) return directStatus
  try {
    const parsed = JSON.parse(error?.message || '')
    const parsedStatus = Number(parsed?.error?.code || parsed?.code)
    return Number.isFinite(parsedStatus) ? parsedStatus : 0
  } catch {
    return 0
  }
}

function friendlyProviderError(error) {
  const status = getProviderStatus(error)
  const message = status === 503
    ? 'Gemini está temporalmente saturado. Intenta de nuevo en unos segundos.'
    : status === 429
      ? 'Se alcanzó el límite de solicitudes disponible para Gemini. Espera un momento y vuelve a intentarlo.'
      : 'No se pudo completar la consulta con Gemini. Intenta de nuevo más tarde.'
  const friendlyError = new Error(message)
  friendlyError.status = status === 429 || status === 503 ? status : 502
  return friendlyError
}

async function generateWithFallback(request, primaryModel) {
  try {
    return { response: await ai.models.generateContent({ ...request, model: primaryModel }), model: primaryModel }
  } catch (primaryError) {
    if (getProviderStatus(primaryError) !== 503) throw friendlyProviderError(primaryError)

    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite'
    if (fallbackModel === primaryModel) throw friendlyProviderError(primaryError)

    try {
      console.warn(`Gemini ${primaryModel} está saturado; se intentará ${fallbackModel}.`)
      return { response: await ai.models.generateContent({ ...request, model: fallbackModel }), model: fallbackModel }
    } catch (fallbackError) {
      throw friendlyProviderError(fallbackError)
    }
  }
}

function safeNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function mergeFilters(currentFilters, requestedFilters) {
  const merged = { ...currentFilters }
  for (const [key, value] of Object.entries(requestedFilters || {})) {
    if (value !== null && value !== undefined && value !== '') merged[key] = value
  }
  return merged
}

function toVehicle(row) {
  if (!row) return null
  return {
    id: row.id,
    source: row.source,
    isCollector: row.is_collector,
    make: row.make.trim(),
    model: row.model.trim(),
    year: row.year,
    bodyType: row.body_type.trim(),
    fuelType: row.fuel_type.trim(),
    transmission: row.transmission.trim(),
    drivetrain: row.drivetrain.trim(),
    color: row.color.trim(),
    engine: row.engine.trim(),
    horsepower: row.horsepower,
    mpg: row.mpg === null ? null : Number(row.mpg),
    doors: row.doors,
    seats: row.seats,
    mileage: row.mileage,
    price: Number(row.price),
    vin: row.vin,
    title: `${row.year} ${row.make} ${row.model}`,
    location: row.location.trim(),
    condition: row.condition.trim(),
    imageUrl: row.image_url,
    dimensions: null,
  }
}

async function getCurrentVehicle(pool, vehicleId) {
  if (!vehicleId) return null
  const { rows } = await pool.query('SELECT * FROM vehicles WHERE id = $1', [vehicleId])
  return toVehicle(rows[0])
}

async function searchInventory(pool, requestedFilters, currentFilters) {
  const filters = mergeFilters(currentFilters, requestedFilters)
  const clauses = []
  const values = []
  const add = (clause, value) => {
    values.push(value)
    clauses.push(clause.replace('?', `$${values.length}`))
  }

  if (filters.make) add('LOWER(BTRIM(make)) = LOWER(?)', String(filters.make).trim().slice(0, 80))
  if (filters.model) add('LOWER(BTRIM(model)) = LOWER(?)', String(filters.model).trim().slice(0, 80))
  if (filters.bodyType) add('LOWER(BTRIM(body_type)) = LOWER(?)', String(filters.bodyType).trim().slice(0, 50))
  if (filters.fuelType) add('LOWER(BTRIM(fuel_type)) = LOWER(?)', String(filters.fuelType).trim().slice(0, 50))
  if (filters.transmission) add('LOWER(BTRIM(transmission)) = LOWER(?)', String(filters.transmission).trim().slice(0, 50))
  if (safeNumber(filters.minYear)) add('year >= ?', safeNumber(filters.minYear))
  if (safeNumber(filters.maxYear)) add('year <= ?', safeNumber(filters.maxYear))
  if (safeNumber(filters.minBudget)) add('price >= ?', safeNumber(filters.minBudget))
  if (safeNumber(filters.maxBudget)) add('price <= ?', safeNumber(filters.maxBudget))
  if (filters.collectorOnly) clauses.push('is_collector = TRUE')
  if (filters.query) {
    const searchTerm = `%${String(filters.query).slice(0, 100)}%`
    values.push(searchTerm)
    const parameter = `$${values.length}`
    clauses.push(`(BTRIM(make) ILIKE ${parameter} OR BTRIM(model) ILIKE ${parameter} OR BTRIM(body_type) ILIKE ${parameter} OR BTRIM(fuel_type) ILIKE ${parameter})`)
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const { rows } = await pool.query(`SELECT * FROM vehicles ${where} ORDER BY created_at DESC LIMIT 20`, values)
  return {
    filters,
    count: rows.length,
    vehicles: rows.map(toVehicle),
  }
}

async function executeTool(pool, name, args, context, state) {
  if (name === 'search_inventory') {
    const requestedFilters = { ...(args || {}) }
    state.filters = mergeFilters(context.currentFilters, requestedFilters)
    const result = await searchInventory(pool, requestedFilters, context.currentFilters)
    state.filters = result.filters
    return result
  }

  if (name === 'get_current_vehicle') {
    const vehicle = await getCurrentVehicle(pool, context.currentVehicleId)
    return vehicle ? { vehicle } : { error: 'No hay un vehículo abierto en este momento.' }
  }

  if (name === 'open_vehicle_details') {
    let vehicle = null
    if (typeof args?.vehicleId === 'string' && args.vehicleId) {
      vehicle = await getCurrentVehicle(pool, args.vehicleId)
    } else if (args?.make && args?.model) {
      const values = [String(args.make).trim().slice(0, 80), String(args.model).trim().slice(0, 80)]
      let query = 'SELECT * FROM vehicles WHERE LOWER(make) = LOWER($1) AND LOWER(model) = LOWER($2)'
      if (safeNumber(args.year)) {
        values.push(safeNumber(args.year))
        query += ` AND year = $${values.length}`
      }
      query += ' ORDER BY year DESC LIMIT 6'
      const { rows } = await pool.query(query, values)
      if (rows.length > 1 && !safeNumber(args.year)) {
        return { error: 'Hay varias unidades de ese modelo. Pregunta el año para elegir la ficha correcta.', matches: rows.map((row) => ({ id: row.id, title: `${row.year} ${row.make} ${row.model}` })) }
      }
      vehicle = toVehicle(rows[0])
    } else {
      vehicle = await getCurrentVehicle(pool, context.currentVehicleId)
    }

    if (!vehicle) return { error: 'No encontré ese vehículo en el inventario. Pide marca, modelo y año.' }
    state.action = { type: 'vehicle-detail', vehicle }
    return { vehicle }
  }

  if (name === 'get_comparison_vehicles') {
    const resolveVehicle = async (requestedVehicle) => {
      if (requestedVehicle?.vehicleId) return getCurrentVehicle(pool, requestedVehicle.vehicleId)
      if (!requestedVehicle?.make || !requestedVehicle?.model) return null
      const values = [String(requestedVehicle.make).trim().slice(0, 80), String(requestedVehicle.model).trim().slice(0, 80)]
      let query = 'SELECT * FROM vehicles WHERE LOWER(BTRIM(make)) = LOWER($1) AND LOWER(BTRIM(model)) = LOWER($2)'
      if (safeNumber(requestedVehicle.year)) {
        values.push(safeNumber(requestedVehicle.year))
        query += ` AND year = $${values.length}`
      }
      query += ' ORDER BY year DESC, created_at DESC LIMIT 1'
      const { rows } = await pool.query(query, values)
      return toVehicle(rows[0])
    }

    if (args?.firstVehicle && args?.secondVehicle) {
      const vehicles = await Promise.all([
        resolveVehicle(args.firstVehicle),
        resolveVehicle(args.secondVehicle),
      ])
      if (vehicles.some((vehicle) => !vehicle)) {
        return { vehicles: vehicles.filter(Boolean), error: 'No encontré ambos vehículos en el inventario. Comprueba las marcas y modelos.' }
      }
      return { vehicles }
    }

    const ids = [...new Set((context.compareIds || []).filter((id) => typeof id === 'string'))].slice(0, 2)
    if (!ids.length) return { vehicles: [], message: 'El comparador está vacío.' }
    const { rows } = await pool.query(
      'SELECT * FROM vehicles WHERE id = ANY($1::text[]) ORDER BY array_position($1::text[], id)',
      [ids],
    )
    return { vehicles: rows.map(toVehicle), message: rows.length < 2 ? 'Selecciona dos vehículos para una comparación completa.' : undefined }
  }

  if (name === 'request_vehicle_pdf') {
    const vehicle = await getCurrentVehicle(pool, context.currentVehicleId)
    if (!vehicle) return { error: 'Abre primero un vehículo para generar su documento.' }
    const type = args?.documentType === 'legal' ? 'legal-pdf' : 'technical-pdf'
    state.action = { type, vehicle }
    return { prepared: true, documentType: args?.documentType, vehicle: vehicle.title }
  }

  return { error: 'Herramienta desconocida.' }
}

export async function answerVehicleChat(pool, payload) {
  const apiKey = process.env.GEMINI_API_KEY
  if (apiKey && !ai) ai = new GoogleGenAI({ apiKey })
  if (!ai) {
    const error = new Error('Falta configurar GEMINI_API_KEY en el entorno del servidor.')
    error.status = 503
    throw error
  }

  const messages = Array.isArray(payload.messages) ? payload.messages.slice(-16) : []
  const contents = messages
    .filter((message) => ['user', 'assistant'].includes(message.role) && typeof message.text === 'string')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.text.slice(0, 3000) }],
    }))

  if (!contents.some((message) => message.role === 'user')) {
    const error = new Error('Envía un mensaje para iniciar la conversación.')
    error.status = 400
    throw error
  }

  const context = {
    currentVehicleId: typeof payload.currentVehicleId === 'string' ? payload.currentVehicleId : null,
    currentFilters: {},
    compareIds: Array.isArray(payload.compareIds) ? payload.compareIds : [],
  }
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.text || ''
  const isComparisonRequest = /compar/i.test(latestUserMessage)
  const state = { filters: {}, action: null }
  const contextualInstruction = `${systemInstruction}\nVehículo abierto: ${context.currentVehicleId || 'ninguno'}.\nIDs seleccionados para comparar: ${JSON.stringify(context.compareIds.slice(0, 2))}.`
  const tools = [{ functionDeclarations: toolDeclarations }]
  let activeModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash'
  let response
  let comparisonToolCalled = false

  for (let turn = 0; turn < 4; turn += 1) {
    const config = { systemInstruction: contextualInstruction, tools }
    if (isComparisonRequest && !comparisonToolCalled) {
      config.toolConfig = {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.ANY,
          allowedFunctionNames: ['get_comparison_vehicles'],
        },
      }
    }
    const generated = await generateWithFallback({
      contents,
      config,
    }, activeModel)
    response = generated.response
    activeModel = generated.model
    const functionCalls = response.functionCalls || []
    if (!functionCalls.length) break

    if (response.candidates?.[0]?.content) contents.push(response.candidates[0].content)
    const results = await Promise.all(functionCalls.map(async (call) => ({
      call,
      result: await executeTool(pool, call.name, call.args, context, state),
    })))
    if (functionCalls.some((call) => call.name === 'get_comparison_vehicles')) comparisonToolCalled = true
    contents.push({
      role: 'user',
      parts: results.map(({ call, result }) => ({
        functionResponse: {
          ...(call.id ? { id: call.id } : {}),
          name: call.name,
          response: result,
        },
      })),
    })
  }

  const reply = response?.text?.trim()
  return {
    reply: reply || 'No pude completar esa respuesta. ¿Puedes reformular la pregunta?',
    filters: state.filters,
    action: state.action,
  }
}
