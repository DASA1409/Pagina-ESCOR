const errorResponse = {
  description: 'La solicitud no se pudo completar.',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: { error: { type: 'string' } },
        required: ['error'],
      },
    },
  },
}

const vehicleProperties = {
  id: { type: 'string', example: 'toyota-corolla-2024' },
  source: { type: 'string', example: 'database' },
  isCollector: { type: 'boolean' },
  make: { type: 'string', example: 'Toyota' },
  model: { type: 'string', example: 'Corolla' },
  year: { type: 'integer', example: 2024 },
  bodyType: { type: 'string', example: 'Sedan' },
  fuelType: { type: 'string', example: 'Gasolina' },
  transmission: { type: 'string', example: 'Automática' },
  drivetrain: { type: 'string', example: 'FWD' },
  color: { type: 'string', example: 'Gris' },
  engine: { type: 'string', example: '2.0L I4' },
  horsepower: { type: 'integer', minimum: 0, example: 169 },
  mpg: { type: 'number', nullable: true, example: 35 },
  doors: { type: 'integer', minimum: 1, example: 4 },
  seats: { type: 'integer', minimum: 1, example: 5 },
  mileage: { type: 'integer', minimum: 0, example: 12000 },
  price: { type: 'number', minimum: 0, example: 22000 },
  vin: { type: 'string', example: 'VIN12345678901234' },
  title: { type: 'string', example: '2024 Toyota Corolla' },
  location: { type: 'string', example: 'Ciudad de México' },
  condition: { type: 'string', example: 'Excelente' },
  imageUrl: { type: 'string', nullable: true, example: 'https://example.com/car.jpg' },
  dimensions: { type: 'object', nullable: true, additionalProperties: true },
}

const vehicleInputProperties = Object.fromEntries(
  Object.entries(vehicleProperties)
    .filter(([name]) => !['source', 'isCollector', 'title', 'dimensions'].includes(name))
    .map(([name, schema]) => [name, { ...schema }]),
)
delete vehicleInputProperties.id

const vehicleInputRequired = [
  'make', 'model', 'year', 'bodyType', 'fuelType', 'transmission', 'drivetrain',
  'color', 'engine', 'horsepower', 'doors', 'seats', 'mileage', 'price', 'vin',
  'location', 'condition',
]

const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'ESCOR API',
    version: '1.0.0',
    description: 'API para el catálogo de vehículos, autenticación y asistente de ESCOR.',
  },
  servers: [{ url: '/api', description: 'API ESCOR' }],
  tags: [
    { name: 'Estado', description: 'Disponibilidad del API' },
    { name: 'Autenticación', description: 'Sesión de usuario' },
    { name: 'Vehículos', description: 'Consulta y administración del inventario' },
    { name: 'Asistente', description: 'Concierge de vehículos' },
    { name: 'Esquema', description: 'Esquema SQL de la base de datos' },
  ],
  components: {
    securitySchemes: {
      escorSession: {
        type: 'apiKey',
        in: 'cookie',
        name: 'escor_session',
        description: 'Cookie de sesión creada por POST /auth/login.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
        required: ['error'],
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['user', 'admin'] },
        },
        required: ['id', 'name', 'email', 'role'],
      },
      Vehicle: {
        type: 'object',
        properties: vehicleProperties,
        required: vehicleInputRequired.concat(['source', 'isCollector', 'title']),
      },
      VehicleInput: {
        type: 'object',
        properties: vehicleInputProperties,
        required: vehicleInputRequired,
      },
      ChatMessage: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['user', 'assistant'] },
          text: { type: 'string' },
        },
        required: ['role', 'text'],
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Estado'],
        summary: 'Comprueba que el API y la base de datos estén disponibles',
        responses: {
          200: {
            description: 'API y base de datos disponibles.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { ok: { type: 'boolean', example: true } },
                  required: ['ok'],
                },
              },
            },
          },
          500: errorResponse,
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Autenticación'],
        summary: 'Devuelve el usuario de la sesión actual',
        responses: {
          200: {
            description: 'Usuario autenticado o null si no hay sesión.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      nullable: true,
                      allOf: [{ $ref: '#/components/schemas/User' }],
                    },
                  },
                  required: ['user'],
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Inicia sesión y establece la cookie de sesión',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@escor.com' },
                  password: { type: 'string', format: 'password' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Sesión iniciada.',
            headers: { 'Set-Cookie': { schema: { type: 'string' }, description: 'Cookie HttpOnly escor_session.' } },
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/User' } },
                  required: ['user'],
                },
              },
            },
          },
          401: errorResponse,
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Autenticación'],
        summary: 'Cierra la sesión actual',
        security: [{ escorSession: [] }],
        responses: {
          200: {
            description: 'Sesión cerrada.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { ok: { type: 'boolean', example: true } },
                  required: ['ok'],
                },
              },
            },
          },
        },
      },
    },
    '/chat': {
      post: {
        tags: ['Asistente'],
        summary: 'Envía mensajes al Concierge de ESCOR',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  messages: { type: 'array', items: { $ref: '#/components/schemas/ChatMessage' } },
                  currentVehicleId: { type: 'string', nullable: true },
                  currentFilters: { type: 'object', additionalProperties: true },
                  compareIds: { type: 'array', items: { type: 'string' }, maxItems: 2 },
                },
                required: ['messages'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Respuesta del Concierge y acciones contextuales.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    reply: { type: 'string' },
                    filters: { type: 'object', nullable: true, additionalProperties: true },
                    action: { type: 'object', nullable: true, additionalProperties: true },
                  },
                  required: ['reply', 'filters', 'action'],
                },
              },
            },
          },
          400: errorResponse,
          502: errorResponse,
          503: errorResponse,
        },
      },
    },
    '/vehicles': {
      get: {
        tags: ['Vehículos'],
        summary: 'Lista los vehículos del inventario',
        responses: {
          200: {
            description: 'Inventario de vehículos.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    vehicles: { type: 'array', items: { $ref: '#/components/schemas/Vehicle' } },
                  },
                  required: ['vehicles'],
                },
              },
            },
          },
          500: errorResponse,
        },
      },
      post: {
        tags: ['Vehículos'],
        summary: 'Crea un vehículo (solo admin)',
        security: [{ escorSession: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/VehicleInput' } } },
        },
        responses: {
          201: {
            description: 'Vehículo creado.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { vehicle: { $ref: '#/components/schemas/Vehicle' } },
                  required: ['vehicle'],
                },
              },
            },
          },
          403: errorResponse,
          500: errorResponse,
        },
      },
    },
    '/vehicles/{id}': {
      put: {
        tags: ['Vehículos'],
        summary: 'Actualiza un vehículo existente (solo admin)',
        security: [{ escorSession: [] }],
        parameters: [{
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Identificador del vehículo.',
        }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/VehicleInput' } } },
        },
        responses: {
          201: {
            description: 'Vehículo actualizado.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { vehicle: { $ref: '#/components/schemas/Vehicle' } },
                  required: ['vehicle'],
                },
              },
            },
          },
          403: errorResponse,
          404: errorResponse,
        },
      },
    },
    '/schema.sql': {
      get: {
        tags: ['Esquema'],
        summary: 'Obtiene el esquema SQL',
        responses: {
          200: {
            description: 'Contenido SQL.',
            content: { 'text/plain': { schema: { type: 'string' } } },
          },
          500: errorResponse,
        },
      },
    },
  },
}

export default openApiDocument
