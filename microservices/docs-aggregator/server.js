const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Service endpoints configuration
const SERVICES = {
  'device-service': {
    name: 'Device Service',
    url: process.env.DEVICE_SERVICE_URL || 'http://device-service:8080',
    description: 'iOS device registration and management'
  },
  'push-service': {
    name: 'Push Service', 
    url: process.env.PUSH_SERVICE_URL || 'http://push-service:8080',
    description: 'Push notifications via APNS'
  },
  'water-service': {
    name: 'Water Service',
    url: process.env.WATER_SERVICE_URL || 'http://water-service:8080',
    description: 'Water intake tracking and hydration reminders'
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// API to get aggregated OpenAPI spec
app.get('/api-docs/openapi.json', async (req, res) => {
  try {
    const aggregatedSpec = await aggregateOpenApiSpecs();
    res.json(aggregatedSpec);
  } catch (error) {
    console.error('Error aggregating OpenAPI specs:', error);
    res.status(500).json({ error: 'Failed to aggregate API specs', message: error.message });
  }
});

// Individual service specs endpoint
app.get('/api-docs/:service/openapi.json', async (req, res) => {
  const serviceName = req.params.service;
  const service = SERVICES[serviceName];
  
  if (!service) {
    return res.status(404).json({ error: `Service '${serviceName}' not found` });
  }
  
  try {
    const spec = await fetchServiceSpec(service.url);
    res.json(spec);
  } catch (error) {
    console.error(`Error fetching spec for ${serviceName}:`, error);
    res.status(502).json({ 
      error: `Failed to fetch spec for ${serviceName}`, 
      message: error.message,
      serviceUrl: service.url
    });
  }
});

// Swagger UI options
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    url: '/api-docs/openapi.json',
    urls: Object.entries(SERVICES).map(([key, service]) => ({
      url: `/api-docs/${key}/openapi.json`,
      name: service.name
    })),
    tryItOutEnabled: true,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    validatorUrl: null,
    displayRequestDuration: true,
    filter: true,
    deepLinking: true,
    showExtensions: true,
    showCommonExtensions: true
  },
  customSiteTitle: 'Drink Water API Documentation',
  customCss: `
    .swagger-ui .topbar { background-color: #2563eb; }
    .swagger-ui .info .title { color: #2563eb; }
  `
};

// Serve Swagger UI at /api-docs
// Order matters: serve static assets first, then setup the UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, swaggerOptions));

// Also serve at root
app.use('/', swaggerUi.serve, swaggerUi.setup(null, swaggerOptions));

// Fetch OpenAPI spec from a service
async function fetchServiceSpec(serviceUrl) {
  const apiDocsUrl = `${serviceUrl}/v3/api-docs`;
  console.log(`Fetching spec from: ${apiDocsUrl}`);
  
  try {
    const response = await axios.get(apiDocsUrl, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`Connection refused to ${serviceUrl}. Service may be down.`);
    }
    if (error.response?.status === 404) {
      throw new Error(`OpenAPI spec not found at ${apiDocsUrl}`);
    }
    throw error;
  }
}

// Aggregate all service specs into one
async function aggregateOpenApiSpecs() {
  const aggregated = {
    openapi: '3.0.3',
    info: {
      title: 'Drink Water API - Aggregated Documentation',
      version: '1.0.0',
      description: 'Complete API documentation for all Drink Water microservices',
      contact: {
        name: 'Drink Water Team',
        email: 'support@drinkwater.app'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'Gateway API'
      }
    ],
    tags: [],
    paths: {},
    components: {
      schemas: {}
    }
  };
  
  for (const [serviceKey, service] of Object.entries(SERVICES)) {
    try {
      const spec = await fetchServiceSpec(service.url);
      
      // Add service tag
      aggregated.tags.push({
        name: service.name,
        description: service.description
      });
      
      // Merge paths with tag annotation
      if (spec.paths) {
        for (const [path, methods] of Object.entries(spec.paths)) {
          const prefixedPath = `/${serviceKey}${path}`;
          aggregated.paths[prefixedPath] = {};
          
          for (const [method, operation] of Object.entries(methods)) {
            if (typeof operation === 'object') {
              operation.tags = [service.name];
              aggregated.paths[prefixedPath][method] = operation;
            }
          }
        }
      }
      
      // Merge schemas
      if (spec.components?.schemas) {
        Object.assign(aggregated.components.schemas, spec.components.schemas);
      }
      
      console.log(`✓ Successfully aggregated ${service.name}`);
    } catch (error) {
      console.warn(`✗ Failed to aggregate ${service.name}: ${error.message}`);
    }
  }
  
  return aggregated;
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`📚 API Documentation Aggregator running on port ${PORT}`);
  console.log(`🔗 Swagger UI: http://localhost:${PORT}/`);
  console.log(`📋 Available services:`);
  Object.entries(SERVICES).forEach(([key, service]) => {
    console.log(`   - ${service.name}: ${service.url}`);
  });
});
