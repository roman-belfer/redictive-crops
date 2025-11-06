# AgriAI - Smart Farming Assistant 🌱

An intelligent agricultural technology web application for optimizing soybean cultivation in Tanzania using NDVI satellite imagery, weather data analysis, and AI-powered recommendations.

## Features

### 🗺️ Interactive Map (75% Screen)
- **Leaflet-based mapping** centered on Tanzania agricultural region (Dodoma)
- **NDVI Layer Toggle** - Visualize vegetation health and green mass
- **Real-time satellite imagery** integration capability (Sentinel Hub compatible)
- **Interactive controls** for layer management

### 🎛️ Control Panel (25% Screen)
- **Knowledge Base Upload** - Upload historical farm data documents
- **Demo Mode** - Pre-loaded 5-year soybean cultivation history
- **AI Analysis** - Automated optimization using GenAI services
- **Results Visualization** - Clear recommendations with descriptions

### 🤖 AI-Powered Analysis
- **Historical Data Processing** - 5 years of watering, fertilization, and harvest data
- **NDVI Integration** - Green mass correlation analysis
- **Weather Pattern Analysis** - Historical weather data from Open-Meteo API
- **Smart Recommendations** - Optimized watering and fertilization schedules

## Technology Stack

### Backend
- **Node.js** with Express
- **OpenAI API** integration (or compatible services)
- **Axios** for API requests
- **Multer** for file uploads
- **CORS** enabled

### Frontend
- **React 18** with Vite
- **Leaflet** + React-Leaflet for mapping
- **Axios** for API communication
- **CSS3** for responsive design

### External APIs
- **Open-Meteo** - Free weather history API
- **Sentinel Hub** - NDVI satellite imagery (optional, requires registration)
- **OpenAI-compatible** - GenAI analysis services

## Project Structure

```
agriAI/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapView.jsx       # Map component with NDVI layer
│   │   │   ├── MapView.css
│   │   │   ├── ControlPanel.jsx  # Right panel with controls
│   │   │   └── ControlPanel.css
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   └── index.js       # Express API server
│   ├── uploads/           # File upload directory
│   ├── .env               # Environment variables
│   ├── .env.example
│   └── package.json
├── sample-knowledge-base.txt  # Demo farm data
├── package.json           # Root package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key (optional for AI features)
- Sentinel Hub account (optional for real NDVI data)

### Setup Instructions

1. **Clone and install dependencies:**
```bash
cd agriAI
npm run install-all
```

2. **Configure environment variables:**
```bash
cd server
cp .env.example .env
# Edit .env and add your API keys
```

3. **Start the development servers:**
```bash
# From root directory
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend dev server on `http://localhost:3000`

## Configuration

### Server Environment Variables (.env)

```env
PORT=5000
OPENAI_API_KEY=your_openai_api_key_here
# OPENAI_BASE_URL=https://api.openai.com/v1  # Optional
# OPENAI_MODEL=gpt-3.5-turbo

# Optional: Sentinel Hub for real NDVI data
# SENTINEL_INSTANCE_ID=your_instance_id
# SENTINEL_CLIENT_ID=your_client_id
# SENTINEL_CLIENT_SECRET=your_client_secret
```

## Usage

### Demo Mode
1. Click **"Use Demo Data"** button in the control panel
2. System loads pre-configured 5-year soybean cultivation history
3. AI analyzes the data with weather patterns
4. View recommendations for optimal watering and fertilization

### Custom Knowledge Base
1. Prepare a text document with your farm's historical data
2. Click **"Upload Knowledge Base"** and select your file
3. Click **"Analyze with AI"** to process
4. Review customized recommendations

### NDVI Layer
- Toggle the **NDVI Layer** button to overlay vegetation index data
- View the color-coded legend for interpretation
- Darker green indicates healthier, denser vegetation

## API Endpoints

### Backend API

- `GET /api/health` - Server health check
- `GET /api/weather-history` - Fetch historical weather data
  - Query params: `lat`, `lon`, `startYear`, `endYear`
- `GET /api/ndvi-info` - NDVI tile service information
- `POST /api/upload-knowledge-base` - Upload farm history document
- `POST /api/analyze` - Run AI analysis on uploaded data
  - Body: `{ knowledgeBase, weatherData, ndviData }`

## Sample Knowledge Base Format

See `sample-knowledge-base.txt` for the expected format:

```
YEAR 2023:
- Planting Date: November 12
- Variety: Gazelle
- Watering: 495mm total
- Fertilization:
  * NPK 10-20-10: 155 kg/ha
  * Potassium sulfate: 75 kg/ha
  * Rhizobium inoculant
- Harvest: April 2024, Yield: 2.8 tons/ha
- NDVI Peak: Week 9 (0.85)
```

## Free Services Integration

### Weather Data
- **Service:** Open-Meteo Archive API
- **Cost:** Free
- **Data:** Temperature, precipitation, evapotranspiration
- **URL:** https://open-meteo.com

### NDVI Satellite Imagery
- **Service:** Sentinel Hub (free tier available)
- **Cost:** Free tier: 3000 requests/month
- **Data:** Sentinel-2 NDVI calculations
- **Registration:** https://www.sentinel-hub.com

### AI Analysis
- **Service:** OpenAI API or compatible services
- **Cost:** Pay-per-use (GPT-3.5-turbo ~$0.002/1K tokens)
- **Alternatives:** Anthropic Claude, local LLMs

## Features Roadmap

- [x] Interactive map with Tanzania focus
- [x] NDVI layer toggle
- [x] Knowledge base upload
- [x] Demo data mode
- [x] Weather API integration
- [x] AI-powered analysis
- [x] Recommendation display
- [ ] Real Sentinel Hub NDVI integration
- [ ] Historical NDVI timeline visualization
- [ ] Multi-crop support
- [ ] Export recommendations as PDF
- [ ] Multi-language support

## Troubleshooting

### Map not loading
- Check internet connection
- Verify OpenStreetMap tiles are accessible
- Check browser console for errors

### AI Analysis fails
- Verify `OPENAI_API_KEY` is set in `.env`
- Check API key has sufficient credits
- Review server logs for detailed errors

### NDVI layer not showing
- Demo mode uses overlay visualization
- For real NDVI data, configure Sentinel Hub credentials
- Ensure map is zoomed to appropriate level

## Agricultural Context

### Soybean Cultivation in Tanzania
- **Region:** Dodoma and other agricultural zones
- **Season:** November planting, April harvest
- **Varieties:** TGx 1835-10E, Gazelle
- **Typical Yield:** 2-3 tons/hectare
- **Key Factors:** Water management, nitrogen fixation, potassium for pod filling

### NDVI Interpretation
- **0.0-0.2:** Bare soil or dead vegetation
- **0.2-0.4:** Sparse vegetation
- **0.4-0.6:** Moderate vegetation health
- **0.6-0.8:** Dense, healthy vegetation
- **0.8-1.0:** Very dense vegetation (peak green mass)

## Contributing

Contributions welcome! Areas of focus:
- Enhanced NDVI visualization
- Additional crop types
- Multi-farm management
- Mobile responsiveness
- Localization

## License

MIT License - Feel free to use and modify for your projects.

## Support

For issues or questions:
- Check the troubleshooting section
- Review API documentation for external services
- Ensure all dependencies are correctly installed

---

**Built with ❤️ for sustainable agriculture in Africa**
