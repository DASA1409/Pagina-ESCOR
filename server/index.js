import http from 'node:http'
import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import dotenv from 'dotenv'
import pg from 'pg'
import { answerVehicleChat } from './chatAssistant.js'
import openApiDocument from './openapi.js'

const { Pool } = pg
const require = createRequire(import.meta.url)
const swaggerUiPath = require('swagger-ui-dist').getAbsoluteFSPath()
const scrypt = promisify(scryptCallback)
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: path.join(projectRoot, '.env') })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

const port = Number(process.env.PORT || 3001)
const sessions = new Map()
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || 'https://pagina-escor.vercel.app')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
)
const usabilityEventTypes = new Set([
  'session_started',
  'catalog_search_submitted',
  'catalog_filter_changed',
  'chat_search_submitted',
  'compare_vehicle_toggled',
  'vehicle_selected',
  'usability_survey_opened',
  'usability_survey_closed',
  'usability_survey_submitted',
])
const usabilitySurveyFields = [
  'chatbotDiscoverability',
  'chatbotPromptingEase',
  'chatbotResultRelevance',
  'catalogNavigation',
  'vehicleDetailsClarity',
  'comparisonDiscoverability',
  'inventoryVariety',
  'taskCompletion',
  'overallSatisfaction',
]

const DEFAULT_USERS = [
  { name: 'Administrador ESCOR', email: process.env.ADMIN_EMAIL || 'admin@escor.com', password: process.env.ADMIN_PASSWORD || 'admin123', role: 'admin' },
  { name: 'Usuario ESCOR', email: process.env.USER_EMAIL || 'usuario@escor.com', password: process.env.USER_PASSWORD || 'usuario123', role: 'user' },
]

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scrypt(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

async function verifyPassword(password, storedHash) {
  const [salt, key] = storedHash.split(':')
  if (!salt || !key) return false
  const derivedKey = await scrypt(password, salt, 64)
  const storedKey = Buffer.from(key, 'hex')
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey)
}

function parseCookies(request) {
  return Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((cookie) => {
    const [key, ...value] = cookie.trim().split('=')
    return [key, decodeURIComponent(value.join('='))]
  }))
}

function getSessionCookieAttributes(request) {
  const forwardedProtocol = request.headers['x-forwarded-proto']?.split(',')[0].trim()
  const isSecure = forwardedProtocol === 'https' || request.headers.origin?.startsWith('https://')
  return `HttpOnly; Path=/; SameSite=${isSecure ? 'None; Secure' : 'Lax'}`
}

async function readBody(request) {
  let body = ''
  for await (const chunk of request) body += chunk
  return JSON.parse(body || '{}')
}

async function getAuthenticatedUser(request) {
  const sessionId = parseCookies(request).escor_session
  if (!sessionId) return null
  const userId = sessions.get(sessionId)
  if (!userId) return null
  const { rows } = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [userId])
  return rows[0] || null
}

function mapVehicle(row) {
  return {
    id: row.id,
    source: row.source,
    isCollector: row.is_collector,
    make: row.make,
    model: row.model,
    year: row.year,
    bodyType: row.body_type,
    fuelType: row.fuel_type,
    transmission: row.transmission,
    drivetrain: row.drivetrain,
    color: row.color,
    engine: row.engine,
    horsepower: row.horsepower,
    mpg: row.mpg === null ? null : Number(row.mpg),
    doors: row.doors,
    seats: row.seats,
    mileage: row.mileage,
    price: Number(row.price),
    vin: row.vin,
    title: `${row.year} ${row.make} ${row.model}`,
    location: row.location,
    condition: row.condition,
    imageUrl: row.image_url,
    dimensions: null,
  }
}

function mapUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role }
}

async function getVehicles() {
  const { rows } = await pool.query('SELECT * FROM vehicles ORDER BY created_at DESC, make, model')
  return rows.map(mapVehicle)
}

async function initializeDatabase() {
  const schema = await readFile(path.join(projectRoot, 'schema.sql'), 'utf8')
  await pool.query(schema)
  for (const user of DEFAULT_USERS) {
    const passwordHash = await hashPassword(user.password)
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      [randomUUID(), user.name, user.email.toLowerCase(), passwordHash, user.role],
    )
  }
  console.log('Base de datos ESCOR conectada y schema.sql aplicado.')
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(body))
}

const server = http.createServer(async (request, response) => {
  response.setHeader('Vary', 'Origin')
  const origin = request.headers.origin
  if (origin && allowedOrigins.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Access-Control-Allow-Credentials', 'true')
  }

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    response.end()
    return
  }

  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`)

    if (request.method === 'GET' && requestUrl.pathname === '/api/openapi.json') {
      sendJson(response, 200, openApiDocument)
      return
    }

    if (request.method === 'GET' && ['/api/docs', '/api/docs/'].includes(requestUrl.pathname)) {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      response.end(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ESCOR API - Swagger UI</title>
    <link rel="stylesheet" href="/api/docs/swagger-ui.css">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/api/docs/swagger-ui-bundle.js"></script>
    <script src="/api/docs/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/api/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          displayRequestDuration: true,
          persistAuthorization: true,
          withCredentials: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: 'StandaloneLayout',
        })
      }
    </script>
  </body>
</html>`)
      return
    }

    const swaggerAsset = requestUrl.pathname.match(/^\/api\/docs\/(swagger-ui(?:-bundle|-standalone-preset)?\.(?:css|js))$/)
    if (request.method === 'GET' && swaggerAsset) {
      const assetName = swaggerAsset[1]
      const asset = await readFile(path.join(swaggerUiPath, assetName))
      const contentType = assetName.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8'
      response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' })
      response.end(asset)
      return
    }

    if (request.method === 'GET' && request.url === '/api/health') {
      await pool.query('SELECT 1')
      sendJson(response, 200, { ok: true })
      return
    }

    if (request.method === 'GET' && request.url === '/api/auth/me') {
      const user = await getAuthenticatedUser(request)
      sendJson(response, 200, { user })
      return
    }

    if (request.method === 'POST' && request.url === '/api/auth/login') {
      const { email, password } = await readBody(request)
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [String(email || '').trim().toLowerCase()])
      if (!rows[0] || !(await verifyPassword(String(password || ''), rows[0].password_hash))) {
        sendJson(response, 401, { error: 'Correo o contraseña incorrectos' })
        return
      }
      const sessionId = randomBytes(32).toString('hex')
      sessions.set(sessionId, rows[0].id)
      response.setHeader('Set-Cookie', `escor_session=${sessionId}; ${getSessionCookieAttributes(request)}`)
      sendJson(response, 200, { user: mapUser(rows[0]) })
      return
    }

    if (request.method === 'POST' && request.url === '/api/auth/register') {
      const { name, email, password } = await readBody(request)
      const cleanName = typeof name === 'string' ? name.trim() : ''
      const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
      if (!cleanName || cleanName.length > 100) {
        sendJson(response, 400, { error: 'El nombre es obligatorio y debe tener 100 caracteres o menos.' })
        return
      }
      if (cleanEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        sendJson(response, 400, { error: 'Ingresa un correo electrónico válido.' })
        return
      }
      if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
        sendJson(response, 400, { error: 'La contraseña debe tener entre 8 y 128 caracteres.' })
        return
      }

      const passwordHash = await hashPassword(password)
      let rows
      try {
        const result = await pool.query(
          `INSERT INTO users (id, name, email, password_hash, role)
           VALUES ($1, $2, $3, $4, 'user')
           RETURNING id, name, email, role`,
          [randomUUID(), cleanName, cleanEmail, passwordHash],
        )
        rows = result.rows
      } catch (registrationError) {
        if (registrationError.code !== '23505') throw registrationError
        sendJson(response, 409, { error: 'Ya existe una cuenta con ese correo electrónico.' })
        return
      }

      const sessionId = randomBytes(32).toString('hex')
      sessions.set(sessionId, rows[0].id)
      response.setHeader('Set-Cookie', `escor_session=${sessionId}; ${getSessionCookieAttributes(request)}`)
      sendJson(response, 201, { user: mapUser(rows[0]) })
      return
    }

    if (request.method === 'POST' && request.url === '/api/auth/logout') {
      const sessionId = parseCookies(request).escor_session
      if (sessionId) sessions.delete(sessionId)
      response.setHeader('Set-Cookie', `escor_session=; ${getSessionCookieAttributes(request)}; Max-Age=0`)
      sendJson(response, 200, { ok: true })
      return
    }

    if (request.method === 'POST' && request.url === '/api/chat') {
      const payload = await readBody(request)
      const result = await answerVehicleChat(pool, payload)
      sendJson(response, 200, result)
      return
    }

    if (request.method === 'POST' && request.url === '/api/usability/surveys') {
      const { sessionId, ageGroup, consent, answers, comment, events } = await readBody(request)
      const validSessionId = typeof sessionId === 'string'
        && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)
      const validAnswers = answers && typeof answers === 'object'
        && usabilitySurveyFields.every((field) => Number.isInteger(answers[field]) && answers[field] >= 0 && answers[field] <= 5)
      const validEvents = Array.isArray(events) && events.length > 0 && events.length <= 5000
        && events.every((event, index) => (
          event
          && event.sequenceNumber === index + 1
          && usabilityEventTypes.has(event.eventType)
          && Number.isInteger(event.elapsedMs)
          && event.elapsedMs >= 0
          && event.elapsedMs <= 86_400_000
          && (index === 0 || event.elapsedMs >= events[index - 1].elapsedMs)
        ))
        && events[0]?.eventType === 'session_started'
        && events.at(-1)?.eventType === 'usability_survey_submitted'
      const validComment = comment === undefined
        || (typeof comment === 'string' && comment.length <= 2000)
      if (!validSessionId || !Number.isInteger(ageGroup) || ageGroup < 2 || ageGroup > 4
        || consent !== true || !validAnswers || !validEvents || !validComment) {
        sendJson(response, 400, { error: 'Las respuestas de la encuesta no son válidas.' })
        return
      }

      const fields = [
        'chatbot_discoverability',
        'chatbot_prompting_ease',
        'chatbot_result_relevance',
        'catalog_navigation',
        'vehicle_details_clarity',
        'comparison_discoverability',
        'inventory_variety',
        'task_completion',
        'overall_satisfaction',
      ]
      const normalizedComment = typeof comment === 'string' ? comment.trim() || null : null
      const values = [sessionId, ageGroup, consent, normalizedComment, ...usabilitySurveyFields.map((field) => answers[field])]
      const placeholders = values.map((_, index) => `$${index + 1}`)
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        await client.query(
          'INSERT INTO usability_test_sessions (session_id) VALUES ($1) ON CONFLICT (session_id) DO NOTHING',
          [sessionId],
        )
        const result = await client.query(
          `INSERT INTO usability_test_surveys (
             session_id, age_group, consent_confirmed, feedback_comment, ${fields.join(', ')}
           ) VALUES (${placeholders.join(', ')})
           ON CONFLICT (session_id) DO NOTHING`,
          values,
        )
        if (result.rowCount === 0) {
          await client.query('ROLLBACK')
          sendJson(response, 409, { error: 'Esta sesión ya envió una encuesta.' })
          return
        }
        let previousElapsedMs = 0
        for (const event of events) {
          const intervalMs = Math.max(0, event.elapsedMs - previousElapsedMs)
          await client.query(
            `INSERT INTO usability_test_events (session_id, sequence_number, event_type, elapsed_ms, interval_ms)
             VALUES ($1, $2, $3, $4, $5)`,
            [sessionId, event.sequenceNumber, event.eventType, event.elapsedMs, intervalMs],
          )
          previousElapsedMs = event.elapsedMs
        }
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
      sendJson(response, 201, { ok: true })
      return
    }

    if (request.method === 'GET' && request.url === '/api/vehicles') {
      sendJson(response, 200, { vehicles: await getVehicles() })
      return
    }

    const vehicleRoute = request.url.match(/^\/api\/vehicles(?:\/([^?]+))?(?:\?.*)?$/)
    if (request.method === 'DELETE' && vehicleRoute?.[1]) {
      const user = await getAuthenticatedUser(request)
      if (!user || user.role !== 'admin') {
        sendJson(response, 403, { error: 'Se requiere una cuenta admin' })
        return
      }

      const vehicleId = decodeURIComponent(vehicleRoute[1])
      const { confirmation } = await readBody(request)
      const { rows } = await pool.query('SELECT id, year, make, model FROM vehicles WHERE id = $1', [vehicleId])
      if (!rows[0]) {
        sendJson(response, 404, { error: 'El vehículo no existe' })
        return
      }

      const vehicleTitle = `${rows[0].year} ${rows[0].make} ${rows[0].model}`
      const normalizeVehicleName = (name) => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
      if (typeof confirmation !== 'string' || normalizeVehicleName(confirmation) !== normalizeVehicleName(vehicleTitle)) {
        sendJson(response, 400, { error: 'El nombre escrito no coincide con el vehículo.' })
        return
      }

      await pool.query('DELETE FROM vehicles WHERE id = $1', [vehicleId])
      sendJson(response, 200, { deleted: true })
      return
    }

    if ((request.method === 'POST' || request.method === 'PUT') && vehicleRoute) {
      const user = await getAuthenticatedUser(request)
      if (!user || user.role !== 'admin') {
        sendJson(response, 403, { error: 'Se requiere una cuenta admin' })
        return
      }

      const vehicle = await readBody(request)
      const vehicleId = vehicleRoute[1] ? decodeURIComponent(vehicleRoute[1]) : null
      const values = [vehicle.make, vehicle.model, Number(vehicle.year), vehicle.bodyType, vehicle.fuelType, vehicle.transmission,
        vehicle.drivetrain, vehicle.color, vehicle.engine, Number(vehicle.horsepower), vehicle.mpg ? Number(vehicle.mpg) : null,
        Number(vehicle.doors), Number(vehicle.seats), Number(vehicle.mileage), Number(vehicle.price), vehicle.vin,
        vehicle.location, vehicle.condition, vehicle.imageUrl || null]

      if (request.method === 'PUT' && vehicleId) {
        const updateResult = await pool.query(
          `UPDATE vehicles SET make = $1, model = $2, year = $3, body_type = $4, fuel_type = $5,
           transmission = $6, drivetrain = $7, color = $8, engine = $9, horsepower = $10, mpg = $11,
           doors = $12, seats = $13, mileage = $14, price = $15, vin = $16, location = $17,
           condition = $18, image_url = $19, updated_at = NOW() WHERE id = $20`,
          [...values, vehicleId],
        )
        if (updateResult.rowCount === 0) {
          sendJson(response, 404, { error: 'El vehículo no existe' })
          return
        }
      } else if (request.method === 'PUT') {
        sendJson(response, 400, { error: 'Falta el id del vehículo' })
        return
      } else {
        const id = vehicle.id || `${String(vehicle.make).toLowerCase()}-${String(vehicle.model).toLowerCase()}-${vehicle.year}-${randomBytes(4).toString('hex')}`
        await pool.query(
          `INSERT INTO vehicles (
            id, make, model, year, body_type, fuel_type, transmission, drivetrain,
            color, engine, horsepower, mpg, doors, seats, mileage, price, vin,
            location, condition, image_url, source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'database')`,
          [id, ...values],
        )
        vehicle.id = id
      }
      const { rows } = await pool.query('SELECT * FROM vehicles WHERE id = $1', [vehicleId || vehicle.id])
      if (!rows[0]) {
        sendJson(response, 404, { error: 'El vehículo no existe' })
        return
      }
      sendJson(response, 201, { vehicle: mapVehicle(rows[0]) })
      return
    }

    if (request.method === 'GET' && request.url === '/api/schema.sql') {
      const schema = await readFile(path.join(projectRoot, 'schema.sql'), 'utf8')
      response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end(schema)
      return
    }

    sendJson(response, 404, { error: 'Ruta no encontrada' })
  } catch (error) {
    console.error(error)
    sendJson(response, error.status || 500, {
      error: error.status ? error.message : 'No se pudo procesar la solicitud',
    })
  }
})

initializeDatabase()
  .then(() => {
    server.listen(port, () => {
      console.log(`ESCOR API escuchando en http://localhost:${port} — Swagger UI: http://localhost:${port}/api/docs`)
    })
  })
  .catch((error) => {
    console.error('No se pudo conectar o inicializar PostgreSQL.')
    console.error(error.message)
    process.exitCode = 1
    pool.end()
  })
