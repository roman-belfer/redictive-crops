const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const OpenAI = require('openai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Initialize OpenAI client (works with OpenAI-compatible APIs)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key',
  baseURL: process.env.OPENAI_BASE_URL // Optional: for custom endpoints
});

// Tanzania coordinates (agriculture region)
const TANZANIA_COORDS = {
  lat: -6.369028,
  lon: 34.888822,
  region: 'Dodoma Region'
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Get weather history data
app.get('/api/weather-history', async (req, res) => {
  try {
    const { lat, lon, startYear, endYear } = req.query;
    
    // Using Open-Meteo free weather API
    const url = `https://archive-api.open-meteo.com/v1/archive`;
    const params = {
      latitude: lat || TANZANIA_COORDS.lat,
      longitude: lon || TANZANIA_COORDS.lon,
      start_date: `${startYear || 2019}-01-01`,
      end_date: `${endYear || 2023}-12-31`,
      daily: 'temperature_2m_mean,precipitation_sum,et0_fao_evapotranspiration',
      timezone: 'Africa/Dar_es_Salaam'
    };
    
    const response = await axios.get(url, { params });
    res.json(response.data);
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Sentinel Hub OAuth token cache
let sentinelToken = null;
let tokenExpiry = null;

// Get Sentinel Hub access token
async function getSentinelToken() {
  if (sentinelToken && tokenExpiry && Date.now() < tokenExpiry) {
    return sentinelToken;
  }

  const clientId = process.env.SENTINEL_CLIENT_ID;
  const clientSecret = process.env.SENTINEL_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId.includes('your_client')) {
    return null;
  }

  try {
    const response = await axios.post(
      'https://services.sentinel-hub.com/oauth/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    sentinelToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 min early
    return sentinelToken;
  } catch (error) {
    console.error('Sentinel Hub auth error:', error.message);
    return null;
  }
}

// Get NDVI data info (Sentinel Hub or similar)
app.get('/api/ndvi-info', async (req, res) => {
  // Return NDVI tile service information
  const instanceId = process.env.SENTINEL_INSTANCE_ID;
  const configured = !!(
    process.env.SENTINEL_CLIENT_ID && 
    !process.env.SENTINEL_CLIENT_ID.includes('your_client') &&
    instanceId &&
    !instanceId.includes('your_instance')
  );

  let layerInfo = null;
  let wmsCapabilities = null;
  
  // Try to fetch configuration details from Sentinel Hub
  if (configured) {
    try {
      const token = await getSentinelToken();
      if (token) {
        // Get configuration details
        const configResponse = await axios.get(
          `https://services.sentinel-hub.com/configuration/v1/wms/instances/${instanceId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        layerInfo = configResponse.data;
        console.log('Sentinel Hub configuration retrieved:', layerInfo.name);
        console.log('Available layers:', layerInfo.layers?.map(l => l.id).join(', '));
        
        // Try to get WMS capabilities
        try {
          const capsResponse = await axios.get(
            `https://services.sentinel-hub.com/ogc/wms/${instanceId}?REQUEST=GetCapabilities&SERVICE=WMS`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          wmsCapabilities = capsResponse.data;
        } catch (err) {
          console.log('Could not fetch WMS capabilities:', err.message);
        }
      }
    } catch (error) {
      console.error('Error fetching Sentinel config:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
  }
  
  res.json({
    tileUrl: `https://services.sentinel-hub.com/ogc/wms/${instanceId}`,
    attribution: 'Sentinel Hub',
    layers: Array.isArray(layerInfo?.layers) ? layerInfo.layers.map(l => l.id) : ['3_NDVI', 'default'],
    defaultLayer: '3_NDVI',
    accountId: process.env.SENTINEL_ACCOUNT_ID,
    instanceId: instanceId,
    configured: configured,
    configDetails: layerInfo,
    hasWMS: !!wmsCapabilities,
    note: configured 
      ? 'Sentinel Hub configured and ready' 
      : 'Create Configuration Instance at https://apps.sentinel-hub.com/dashboard/#/configurations',
    alternativeTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    fallbackMessage: 'Using demo visualization. Configure Sentinel Hub Instance ID for real NDVI data.'
  });
});

// Test WMS tile endpoint
app.get('/api/test-wms-tile', async (req, res) => {
  const instanceId = process.env.SENTINEL_INSTANCE_ID;
  
  if (!instanceId || instanceId.includes('your_instance')) {
    return res.status(400).json({ error: 'Instance ID not configured' });
  }
  
  try {
    const token = await getSentinelToken();
    if (!token) {
      return res.status(401).json({ error: 'Could not authenticate with Sentinel Hub' });
    }
    
    // First, get the configuration to see available layers
    let availableLayers = [];
    try {
      const configResponse = await axios.get(
        `https://services.sentinel-hub.com/configuration/v1/wms/instances/${instanceId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      availableLayers = configResponse.data.layers?.map(l => l.id) || [];
      console.log('Available WMS layers:', availableLayers);
    } catch (err) {
      console.log('Could not fetch layer info:', err.message);
    }
    
    // Use the first available layer or try common names
    const layerToTest = availableLayers.length > 0 
      ? availableLayers[0] 
      : (availableLayers.includes('TRUE-COLOR') ? 'TRUE-COLOR' : 'default');
    
    console.log('Testing with layer:', layerToTest);
    
    // Tanzania coordinates for a test tile
    const bbox = '34.8,-6.4,34.95,-6.3'; // lon_min, lat_min, lon_max, lat_max
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const wmsUrl = `https://services.sentinel-hub.com/ogc/wms/${instanceId}`;
    const params = {
      SERVICE: 'WMS',
      REQUEST: 'GetMap',
      VERSION: '1.3.0',
      LAYERS: layerToTest,
      CRS: 'EPSG:4326',
      BBOX: bbox,
      WIDTH: 512,
      HEIGHT: 512,
      FORMAT: 'image/png',
      TIME: `${startDate}/${endDate}`,
      MAXCC: 30,
      PRIORITY: 'leastCC'
    };
    
    const queryString = new URLSearchParams(params).toString();
    const testUrl = `${wmsUrl}?${queryString}`;
    
    console.log('Testing WMS tile request:', testUrl);
    
    const response = await axios.get(testUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'arraybuffer',
      validateStatus: () => true // Accept any status
    });
    
    res.json({
      success: response.status === 200,
      status: response.status,
      contentType: response.headers['content-type'],
      availableLayers: availableLayers,
      testedLayer: layerToTest,
      testUrl: testUrl,
      message: response.status === 200 
        ? `WMS tile request successful! Layer '${layerToTest}' is available.` 
        : `WMS request failed with status ${response.status}. Available layers: ${availableLayers.join(', ') || 'none found'}`,
      errorDetails: response.status !== 200 ? response.data?.toString('utf8').substring(0, 500) : null
    });
  } catch (error) {
    console.error('WMS test error:', error.message);
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data?.toString() || 'No details available'
    });
  }
});

// Get NDVI historical data from Sentinel Hub
app.post('/api/ndvi-history', async (req, res) => {
  try {
    const token = await getSentinelToken();
    
    if (!token) {
      return res.json({
        success: false,
        demo: true,
        message: 'Sentinel Hub not configured. Using demo NDVI data.',
        data: generateDemoNDVI()
      });
    }

    const { bbox, startDate, endDate } = req.body;
    
    // Tanzania agriculture region default bbox
    const defaultBbox = [34.8, -6.4, 34.95, -6.3];
    const useBbox = bbox || defaultBbox;

    const evalscript = `
      //VERSION=3
      function setup() {
        return {
          input: [{
            bands: ["B04", "B08"]
          }],
          output: {
            bands: 1,
            sampleType: "FLOAT32"
          }
        };
      }
      function evaluatePixel(sample) {
        let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
        return [ndvi];
      }
    `;

    const requestBody = {
      input: {
        bounds: {
          bbox: useBbox,
          properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' }
        },
        data: [{
          type: 'sentinel-2-l2a',
          dataFilter: {
            timeRange: {
              from: startDate || '2019-01-01T00:00:00Z',
              to: endDate || '2023-12-31T23:59:59Z'
            }
          }
        }]
      },
      output: {
        width: 512,
        height: 512,
        responses: [{
          identifier: 'default',
          format: { type: 'image/tiff' }
        }]
      },
      evalscript: evalscript
    };

    const response = await axios.post(
      'https://services.sentinel-hub.com/api/v1/process',
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    res.json({
      success: true,
      message: 'NDVI data retrieved successfully',
      dataSize: response.data.length
    });
  } catch (error) {
    console.error('NDVI fetch error:', error.message);
    res.json({
      success: false,
      demo: true,
      message: 'Using demo NDVI data',
      data: generateDemoNDVI()
    });
  }
});

// Generate demo NDVI data
function generateDemoNDVI() {
  const years = [2019, 2020, 2021, 2022, 2023];
  return years.map(year => ({
    year,
    growingSeason: {
      early: 0.35 + Math.random() * 0.1,
      mid: 0.65 + Math.random() * 0.15,
      late: 0.45 + Math.random() * 0.1
    },
    averageNDVI: 0.55 + Math.random() * 0.1,
    peakNDVI: 0.75 + Math.random() * 0.1,
    peakDate: `${year}-${String(Math.floor(Math.random() * 2) + 3).padStart(2, '0')}-15`
  }));
}

// Summarize weather data to reduce token usage
function summarizeWeatherData(weatherData) {
  if (!weatherData || !weatherData.daily) {
    return 'Weather data not available';
  }

  const { time, temperature_2m_mean, precipitation_sum, et0_fao_evapotranspiration } = weatherData.daily;
  
  // Group by year
  const yearlyStats = {};
  time.forEach((date, idx) => {
    const year = date.substring(0, 4);
    if (!yearlyStats[year]) {
      yearlyStats[year] = {
        temps: [],
        precip: [],
        et0: []
      };
    }
    yearlyStats[year].temps.push(temperature_2m_mean[idx]);
    yearlyStats[year].precip.push(precipitation_sum[idx]);
    if (et0_fao_evapotranspiration) {
      yearlyStats[year].et0.push(et0_fao_evapotranspiration[idx]);
    }
  });

  // Calculate yearly summaries
  const summary = Object.entries(yearlyStats).map(([year, data]) => {
    const avgTemp = (data.temps.reduce((a, b) => a + b, 0) / data.temps.length).toFixed(1);
    const totalPrecip = data.precip.reduce((a, b) => a + b, 0).toFixed(0);
    const avgET0 = data.et0.length > 0 
      ? (data.et0.reduce((a, b) => a + b, 0) / data.et0.length).toFixed(2)
      : 'N/A';
    
    return `${year}: Avg Temp ${avgTemp}°C, Total Rainfall ${totalPrecip}mm, Avg ET0 ${avgET0}mm/day`;
  });

  return summary.join('\n');
}

// Upload and process knowledge base
app.post('/api/upload-knowledge-base', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fs = require('fs');
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    
    res.json({
      success: true,
      filename: req.file.filename,
      content: fileContent,
      message: 'Knowledge base uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// AI Analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { knowledgeBase, weatherData, ndviData } = req.body;

    // Summarize weather data to reduce tokens
    const weatherSummary = summarizeWeatherData(weatherData);
    const ndviSummary = ndviData && typeof ndviData === 'object' 
      ? JSON.stringify(ndviData).substring(0, 500) 
      : 'NDVI data integration pending';

    const prompt = `You are an expert agricultural consultant specializing in soybean cultivation in Tanzania.

Analyze the following data for a 100-hectare soybean farm:

HISTORICAL DATA:
${knowledgeBase}

WEATHER HISTORY SUMMARY (2019-2023):
${weatherSummary}

NDVI DATA SUMMARY:
${ndviSummary}

Based on this analysis, provide:
1. Optimal watering schedule for the next growing season
2. Recommended fertilization plan (types, amounts, timing)
3. Expected outcomes and peak green mass predictions

Format your response as JSON with the following structure:
{
  "watering": {
    "schedule": "detailed schedule",
    "description": "brief explanation",
    "imagePrompt": "description for visualization"
  },
  "fertilization": [
    {
      "type": "fertilizer name",
      "schedule": "timing and amounts",
      "description": "brief explanation",
      "imagePrompt": "description for visualization"
    }
  ],
  "predictions": {
    "peakGreenMass": "expected peak",
    "yieldEstimate": "estimated yield",
    "confidence": "confidence level"
  }
}`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert agricultural consultant. Provide concise, actionable recommendations.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const responseText = completion.choices[0].message.content;
    
    // Try to parse JSON response
    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: responseText };
    } catch {
      analysis = { raw: responseText };
    }

    res.json({
      success: true,
      analysis,
      usage: completion.usage
    });
  } catch (error) {
    console.error('AI Analysis error:', error.message);
    
    // Fallback demo response
    res.json({
      success: true,
      analysis: {
        watering: {
          schedule: "Week 1-2: Daily irrigation (25mm/day), Week 3-8: Every 2-3 days (20mm), Week 9-12: Reduce to 15mm every 3 days",
          description: "Soybean water requirements peak during flowering and pod development",
          imagePrompt: "Calendar showing watering schedule with water droplets for a soybean field"
        },
        fertilization: [
          {
            type: "NPK 10-20-10",
            schedule: "Apply 150 kg/ha at planting",
            description: "Phosphorus critical for root development and nodulation",
            imagePrompt: "Diagram showing NPK fertilizer application at field preparation"
          },
          {
            type: "Rhizobium Inoculant",
            schedule: "Seed treatment before planting",
            description: "Enhances nitrogen fixation in root nodules",
            imagePrompt: "Seeds being treated with bacterial inoculant"
          },
          {
            type: "Potassium Sulfate",
            schedule: "75 kg/ha at flowering stage (week 6)",
            description: "Supports pod filling and grain quality",
            imagePrompt: "Foliar application during soybean flowering"
          }
        ],
        predictions: {
          peakGreenMass: "Week 8-9 (full flowering to early pod development)",
          yieldEstimate: "2.5-3.0 tons/hectare based on optimal conditions",
          confidence: "High - based on 5 years of historical data"
        }
      },
      demo: true,
      message: 'Using demo data. Configure OPENAI_API_KEY for AI analysis.'
    });
  }
});

// Financial analysis endpoint - calculates costs, revenue, and profitability
app.post('/api/financial-analysis', async (req, res) => {
  try {
    const { recommendations, farmSize = 100 } = req.body; // farmSize in hectares
    
    // Current market prices (sourced from World Bank, FAO data for Tanzania/East Africa)
    const prices = {
      // Fertilizers ($/ton) - 2024 average prices
      npk: 600,        // NPK compound fertilizer
      urea: 450,       // Urea (nitrogen)
      dap: 650,        // DAP (phosphorus)
      potassium: 550,  // Potassium sulfate
      micronutrient: 800, // Micronutrient mix
      
      // Soybeans ($/ton) - Tanzania market price
      soybeans: 450,
      
      // Water/irrigation costs ($/hectare)
      irrigationPerHa: 150,
      
      // Labor costs ($/hectare) - Tanzania average
      laborPerHa: 80,
      
      // Seed costs ($/hectare)
      seedsPerHa: 60
    };
    
    // Calculate fertilizer costs
    let fertilizerCosts = 0;
    let fertilizerDetails = [];
    
    if (recommendations?.fertilization) {
      recommendations.fertilization.forEach(fert => {
        const fertName = fert.type.toLowerCase();
        let costPerHa = 0;
        let amount = 0;
        
        // Extract kg/ha from schedule string
        const kgMatch = fert.schedule.match(/(\d+)\s*kg\/ha/i);
        if (kgMatch) {
          amount = parseFloat(kgMatch[1]);
          
          // Determine fertilizer type and calculate cost
          if (fertName.includes('npk') || fertName.includes('compound')) {
            costPerHa = (amount / 1000) * prices.npk;
          } else if (fertName.includes('urea') || fertName.includes('nitrogen')) {
            costPerHa = (amount / 1000) * prices.urea;
          } else if (fertName.includes('dap') || fertName.includes('phosph')) {
            costPerHa = (amount / 1000) * prices.dap;
          } else if (fertName.includes('potassium') || fertName.includes('sulfate')) {
            costPerHa = (amount / 1000) * prices.potassium;
          } else if (fertName.includes('micro') || fertName.includes('zinc') || fertName.includes('boron')) {
            costPerHa = (amount / 1000) * prices.micronutrient;
          } else {
            // Default to NPK price for unknown fertilizers
            costPerHa = (amount / 1000) * prices.npk;
          }
          
          const totalCost = costPerHa * farmSize;
          fertilizerCosts += totalCost;
          
          fertilizerDetails.push({
            type: fert.type,
            amountPerHa: `${amount} kg/ha`,
            totalAmount: `${(amount * farmSize).toFixed(0)} kg`,
            costPerHa: costPerHa.toFixed(2),
            totalCost: totalCost.toFixed(2),
            schedule: fert.schedule
          });
        }
      });
    }
    
    // Calculate irrigation costs
    let irrigationCosts = 0;
    let wateringDetails = [];
    
    if (recommendations?.watering) {
      // Handle both string and object formats for watering
      let wateringEvents = 4; // Default to 4 watering cycles
      
      if (typeof recommendations.watering === 'string') {
        wateringEvents = recommendations.watering.split(',').length || 
                        recommendations.watering.split(';').length || 4;
      } else if (typeof recommendations.watering === 'object' && recommendations.watering.schedule) {
        // If watering is an object with schedule property
        if (typeof recommendations.watering.schedule === 'string') {
          wateringEvents = recommendations.watering.schedule.split(',').length || 
                          recommendations.watering.schedule.split(';').length || 4;
        }
      }
      
      irrigationCosts = prices.irrigationPerHa * farmSize;
      
      wateringDetails.push({
        description: 'Irrigation system operation',
        events: wateringEvents,
        costPerHa: prices.irrigationPerHa.toFixed(2),
        totalCost: irrigationCosts.toFixed(2)
      });
    }
    
    // Calculate other costs
    const laborCosts = prices.laborPerHa * farmSize;
    const seedCosts = prices.seedsPerHa * farmSize;
    
    // Total costs
    const totalCosts = fertilizerCosts + irrigationCosts + laborCosts + seedCosts;
    
    // Calculate revenue (based on yield prediction)
    let yieldPerHa = 2.5; // Default tons/hectare
    let revenue = 0;
    
    if (recommendations?.predictions?.yieldEstimate) {
      const yieldMatch = recommendations.predictions.yieldEstimate.match(/(\d+\.?\d*)/);
      if (yieldMatch) {
        yieldPerHa = parseFloat(yieldMatch[1]);
      }
    }
    
    const totalYield = yieldPerHa * farmSize; // tons
    revenue = totalYield * prices.soybeans;
    
    // Calculate profit and ROI
    const profit = revenue - totalCosts;
    const roi = ((profit / totalCosts) * 100).toFixed(1);
    
    // Breakeven analysis
    const breakEvenYield = (totalCosts / prices.soybeans).toFixed(2);
    const breakEvenPerHa = (breakEvenYield / farmSize).toFixed(2);
    
    res.json({
      success: true,
      farmSize,
      currency: 'USD',
      costs: {
        fertilizers: parseFloat(fertilizerCosts.toFixed(2)),
        irrigation: parseFloat(irrigationCosts.toFixed(2)),
        labor: parseFloat(laborCosts.toFixed(2)),
        seeds: parseFloat(seedCosts.toFixed(2)),
        total: parseFloat(totalCosts.toFixed(2)),
        breakdown: {
          fertilizerDetails,
          wateringDetails,
          labor: {
            description: 'Field preparation, planting, maintenance, harvesting',
            costPerHa: prices.laborPerHa.toFixed(2),
            totalCost: laborCosts.toFixed(2)
          },
          seeds: {
            description: 'Certified soybean seeds',
            costPerHa: prices.seedsPerHa.toFixed(2),
            totalCost: seedCosts.toFixed(2)
          }
        }
      },
      revenue: {
        yieldPerHa: yieldPerHa.toFixed(2),
        totalYield: totalYield.toFixed(2),
        pricePerTon: prices.soybeans,
        totalRevenue: parseFloat(revenue.toFixed(2))
      },
      profitability: {
        grossProfit: parseFloat(profit.toFixed(2)),
        roi: parseFloat(roi),
        breakEvenYield: parseFloat(breakEvenYield),
        breakEvenPerHa: parseFloat(breakEvenPerHa),
        profitPerHa: parseFloat((profit / farmSize).toFixed(2))
      },
      marketPrices: {
        soybeans: `$${prices.soybeans}/ton`,
        npk: `$${prices.npk}/ton`,
        lastUpdated: '2024 Market Average'
      }
    });
    
  } catch (error) {
    console.error('Financial analysis error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to calculate financial analysis',
      message: error.message 
    });
  }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
