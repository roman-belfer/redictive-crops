import React, { useState, useRef } from 'react';
import axios from 'axios';
import './ControlPanel.css';

function ControlPanel({ ndviEnabled, setNdviEnabled, analysisResult, setAnalysisResult, loading, setLoading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    watering: false,
    predictions: false,
    financial: false
  });
  const [expandedFertilizers, setExpandedFertilizers] = useState({});
  const [showKnowledgeBaseInfo, setShowKnowledgeBaseInfo] = useState(false);
  const [financialData, setFinancialData] = useState(null);
  const fileInputRef = useRef(null);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleFertilizer = (idx) => {
    setExpandedFertilizers(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleUploadClick = () => {
    setShowKnowledgeBaseInfo(true);
  };

  const handleCloseInfo = () => {
    setShowKnowledgeBaseInfo(false);
  };

  const handleProceedWithUpload = () => {
    setShowKnowledgeBaseInfo(false);
    fileInputRef.current.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('');
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) {
      alert('Please select a knowledge base file first');
      return;
    }

    setLoading(true);
    setUploadStatus('Uploading knowledge base...');
    console.log('📤 Starting file upload and analysis...');

    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      console.log('📤 Uploading file:', selectedFile.name);
      const uploadResponse = await axios.post('/api/upload-knowledge-base', formData);
      console.log('✅ File uploaded successfully');
      
      setUploadStatus('Processing data...');

      // Fetch weather data
      console.log('🌤️ Fetching weather data...');
      const weatherResponse = await axios.get('/api/weather-history', {
        params: {
          startYear: 2019,
          endYear: 2023
        }
      });
      console.log('✅ Weather data received');

      // Prepare analysis request
      const analysisPayload = {
        knowledgeBase: uploadResponse.data.content,
        weatherData: weatherResponse.data,
        ndviData: { note: 'NDVI data integration pending Sentinel Hub setup' }
      };

      setUploadStatus('Running AI analysis...');
      console.log('🤖 Sending to AI analysis...');
      
      const analysisResponse = await axios.post('/api/analyze', analysisPayload);
      console.log('✅ AI Analysis complete:', analysisResponse.data);

      setAnalysisResult(analysisResponse.data.analysis);
      
      // Fetch financial analysis
      setUploadStatus('Calculating financial projections...');
      console.log('💰 Fetching financial analysis...');
      
      const financialResponse = await axios.post('/api/financial-analysis', {
        recommendations: analysisResponse.data.analysis,
        farmSize: 100
      });
      
      console.log('✅ Financial analysis complete:', financialResponse.data);
      setFinancialData(financialResponse.data);
      setUploadStatus('Analysis complete!');
    } catch (error) {
      console.error('❌ Error in handleUploadAndAnalyze:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setUploadStatus('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoData = async () => {
    setLoading(true);
    setUploadStatus('Loading demo data...');
    console.log('🎯 Starting demo data analysis...');

    try {
      const demoKnowledgeBase = `SOYBEAN CULTIVATION HISTORY - DODOMA REGION, TANZANIA
Farm Size: 100 hectares
Crop: Soybeans (Glycine max)
Period: 2019-2023

YEAR 2019:
- Planting Date: November 15
- Variety: TGx 1835-10E
- Watering: 450mm total (rainfall + irrigation)
- Fertilization: 
  * NPK 10-20-10: 120 kg/ha at planting
  * Rhizobium inoculant applied
- Harvest: April 2020, Yield: 2.1 tons/ha
- NDVI Peak: Week 9 (0.72)

YEAR 2020:
- Planting Date: November 20
- Variety: TGx 1835-10E
- Watering: 520mm total
- Fertilization:
  * NPK 10-20-10: 140 kg/ha at planting
  * Potassium sulfate: 60 kg/ha at flowering
- Harvest: April 2021, Yield: 2.4 tons/ha
- NDVI Peak: Week 8 (0.78)

YEAR 2021:
- Planting Date: November 10
- Variety: Gazelle
- Watering: 480mm total
- Fertilization:
  * NPK 10-20-10: 150 kg/ha at planting
  * Rhizobium inoculant
  * Foliar micronutrients week 6
- Harvest: April 2022, Yield: 2.6 tons/ha
- NDVI Peak: Week 9 (0.81)

YEAR 2022:
- Planting Date: November 18
- Variety: Gazelle
- Watering: 510mm total
- Fertilization:
  * NPK 10-20-10: 150 kg/ha
  * Potassium sulfate: 70 kg/ha
  * Rhizobium inoculant
- Harvest: April 2023, Yield: 2.7 tons/ha
- NDVI Peak: Week 8-9 (0.83)

YEAR 2023:
- Planting Date: November 12
- Variety: Gazelle
- Watering: 495mm total
- Fertilization:
  * NPK 10-20-10: 155 kg/ha
  * Potassium sulfate: 75 kg/ha
  * Rhizobium + micronutrients
- Harvest: April 2024, Yield: 2.8 tons/ha
- NDVI Peak: Week 9 (0.85)

OBSERVATIONS:
- Consistent improvement in yields
- NDVI peaks correlate with proper watering at flowering stage
- Gazelle variety shows better performance than TGx 1835-10E
- Potassium supplementation improves pod filling`;

      console.log('📚 Demo knowledge base prepared');
      console.log('🌤️ Fetching weather data...');
      setUploadStatus('Fetching weather data...');

      const weatherResponse = await axios.get('/api/weather-history', {
        params: { startYear: 2019, endYear: 2023 }
      });

      console.log('✅ Weather data received:', weatherResponse.data ? 'Success' : 'Empty');
      console.log('🤖 Preparing AI analysis...');
      setUploadStatus('Running AI analysis...');

      const analysisPayload = {
        knowledgeBase: demoKnowledgeBase,
        weatherData: weatherResponse.data,
        ndviData: { note: 'Using historical NDVI data from knowledge base' }
      };

      const analysisResponse = await axios.post('/api/analyze', analysisPayload);
      console.log('✅ AI Analysis response received:', analysisResponse.data);
      console.log('Analysis result structure:', {
        hasAnalysis: !!analysisResponse.data.analysis,
        hasWatering: !!analysisResponse.data.analysis?.watering,
        hasFertilization: !!analysisResponse.data.analysis?.fertilization,
        hasPredictions: !!analysisResponse.data.analysis?.predictions
      });
      
      setAnalysisResult(analysisResponse.data.analysis);
      
      // Fetch financial analysis
      console.log('💰 Fetching financial analysis...');
      setUploadStatus('Calculating financial projections...');
      
      const financialResponse = await axios.post('/api/financial-analysis', {
        recommendations: analysisResponse.data.analysis,
        farmSize: 100
      });
      
      console.log('✅ Financial analysis response:', financialResponse.data);
      console.log('Financial data structure:', {
        success: financialResponse.data.success,
        hasCosts: !!financialResponse.data.costs,
        hasRevenue: !!financialResponse.data.revenue,
        hasProfitability: !!financialResponse.data.profitability
      });
      
      setFinancialData(financialResponse.data);
      console.log('✅ All data loaded successfully!');
      setUploadStatus('Demo analysis complete!');
    } catch (error) {
      console.error('❌ Error in handleUseDemoData:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      setUploadStatus('Error loading demo data: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="control-panel">
      <div className="panel-section">
        <h3>📍 Location</h3>
        <div className="info-box">
          <p><strong>Region:</strong> Dodoma, Tanzania</p>
          <p><strong>Coordinates:</strong> 6.37°S, 34.89°E</p>
          <p><strong>Farm Size:</strong> 100 hectares</p>
          <p><strong>Crop:</strong> Soybeans</p>
        </div>
      </div>

      <div className="panel-section">
        <h3>📁 Knowledge Base</h3>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".txt,.doc,.docx,.pdf"
          style={{ display: 'none' }}
        />
        <button 
          className="upload-btn"
          onClick={handleUploadClick}
          disabled={loading}
        >
          {selectedFile ? '✓ File Selected' : '📤 Upload Knowledge Base'}
        </button>
        {selectedFile && (
          <p className="file-name">📄 {selectedFile.name}</p>
        )}
        
        <button
          className="demo-btn"
          onClick={handleUseDemoData}
          disabled={loading}
        >
          🎯 Use Demo Data
        </button>

        {selectedFile && (
          <button
            className="analyze-btn"
            onClick={handleUploadAndAnalyze}
            disabled={loading}
          >
            {loading ? '⏳ Processing...' : '🤖 Analyze with AI'}
          </button>
        )}

        {uploadStatus && (
          <div className={`status-message ${uploadStatus.includes('Error') ? 'error' : 'success'}`}>
            {uploadStatus}
          </div>
        )}
      </div>

      {analysisResult && (
        <div className="panel-section results-section">
          <h3>📈 AI Recommendations</h3>
          
          <div className="result-card collapsible">
            <div 
              className="result-card-header"
              onClick={() => toggleSection('watering')}
            >
              <h4>💧 Watering Schedule</h4>
              <span className="toggle-icon">{expandedSections.watering ? '▼' : '▶'}</span>
            </div>
            {expandedSections.watering && (
              <div className="result-card-content">
                <p className="schedule">{analysisResult.watering?.schedule}</p>
                <p className="description">{analysisResult.watering?.description}</p>
              </div>
            )}
          </div>

          {analysisResult.fertilization && analysisResult.fertilization.map((fert, idx) => (
            <div key={idx} className="result-card collapsible">
              <div 
                className="result-card-header"
                onClick={() => toggleFertilizer(idx)}
              >
                <h4>🌿 {fert.type}</h4>
                <span className="toggle-icon">{expandedFertilizers[idx] ? '▼' : '▶'}</span>
              </div>
              {expandedFertilizers[idx] && (
                <div className="result-card-content">
                  <p className="schedule">{fert.schedule}</p>
                  <p className="description">{fert.description}</p>
                </div>
              )}
            </div>
          ))}

          {analysisResult.predictions && (
            <div className="result-card collapsible prediction-card">
              <div 
                className="result-card-header"
                onClick={() => toggleSection('predictions')}
              >
                <h4>🎯 Predictions</h4>
                <span className="toggle-icon">{expandedSections.predictions ? '▼' : '▶'}</span>
              </div>
              {expandedSections.predictions && (
                <div className="result-card-content">
                  <p><strong>Peak Green Mass:</strong> {analysisResult.predictions.peakGreenMass}</p>
                  <p><strong>Yield Estimate:</strong> {analysisResult.predictions.yieldEstimate}</p>
                  <p><strong>Confidence:</strong> {analysisResult.predictions.confidence}</p>
                </div>
              )}
            </div>
          )}

          {financialData && financialData.success && (
            <div className="result-card collapsible financial-card">
              <div 
                className="result-card-header"
                onClick={() => toggleSection('financial')}
              >
                <h4>💰 Financial Analysis</h4>
                <span className="toggle-icon">{expandedSections.financial ? '▼' : '▶'}</span>
              </div>
              {expandedSections.financial && (
                <div className="result-card-content">
                  <div className="financial-summary">
                    <div className="financial-row highlight">
                      <strong>Expected Profit:</strong>
                      <span className="profit-amount" style={{color: financialData.profitability.grossProfit > 0 ? '#4caf50' : '#f44336'}}>
                        ${financialData.profitability.grossProfit.toLocaleString()}
                      </span>
                    </div>
                    <div className="financial-row">
                      <strong>ROI:</strong>
                      <span className="roi-value">{financialData.profitability.roi}%</span>
                    </div>
                    <div className="financial-row">
                      <strong>Profit per Hectare:</strong>
                      <span>${financialData.profitability.profitPerHa.toLocaleString()}/ha</span>
                    </div>
                  </div>

                  <div className="financial-section">
                    <h5>💵 Revenue Projection</h5>
                    <div className="financial-row">
                      <span>Expected Yield:</span>
                      <strong>{financialData.revenue.totalYield} tons ({financialData.revenue.yieldPerHa} tons/ha)</strong>
                    </div>
                    <div className="financial-row">
                      <span>Soybean Price:</span>
                      <strong>${financialData.revenue.pricePerTon}/ton</strong>
                    </div>
                    <div className="financial-row highlight">
                      <span>Total Revenue:</span>
                      <strong>${financialData.revenue.totalRevenue.toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="financial-section">
                    <h5>💸 Cost Breakdown</h5>
                    <div className="financial-row">
                      <span>Fertilizers:</span>
                      <strong>${financialData.costs.fertilizers.toLocaleString()}</strong>
                    </div>
                    <div className="financial-row">
                      <span>Irrigation:</span>
                      <strong>${financialData.costs.irrigation.toLocaleString()}</strong>
                    </div>
                    <div className="financial-row">
                      <span>Labor:</span>
                      <strong>${financialData.costs.labor.toLocaleString()}</strong>
                    </div>
                    <div className="financial-row">
                      <span>Seeds:</span>
                      <strong>${financialData.costs.seeds.toLocaleString()}</strong>
                    </div>
                    <div className="financial-row highlight total-row">
                      <span>Total Costs:</span>
                      <strong>${financialData.costs.total.toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="financial-section">
                    <h5>📊 Break-Even Analysis</h5>
                    <div className="financial-row">
                      <span>Break-Even Yield:</span>
                      <strong>{financialData.profitability.breakEvenYield} tons ({financialData.profitability.breakEvenPerHa} tons/ha)</strong>
                    </div>
                  </div>

                  <div className="financial-note">
                    <small>💡 Prices based on {financialData.marketPrices.lastUpdated} Tanzania market data</small>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showKnowledgeBaseInfo && (
        <div className="modal-overlay" onClick={handleCloseInfo}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseInfo}>✕</button>
            <h3>📚 Knowledge Base Format</h3>
            <p>Your knowledge base should contain historical farm data including:</p>
            
            <div className="format-section">
              <h4>Required Information:</h4>
              <ul>
                <li><strong>Farm Details:</strong> Size (hectares), location, crop type</li>
                <li><strong>Historical Years:</strong> At least 2-5 years of data</li>
                <li><strong>For Each Year:</strong>
                  <ul>
                    <li>Planting date and variety</li>
                    <li>Watering schedule and amounts (mm or liters)</li>
                    <li>Fertilization types, amounts (kg/ha), and timing</li>
                    <li>Harvest date and yield (tons/ha)</li>
                    <li>NDVI observations (if available)</li>
                  </ul>
                </li>
              </ul>
            </div>

            <div className="format-section">
              <h4>Example Format:</h4>
              <pre className="example-text">{`FARM: 100 hectares, Dodoma Region, Tanzania
CROP: Soybeans

YEAR 2023:
- Planting: November 15, Variety TGx 1835-10E
- Watering: 450mm total (rainfall + irrigation)
- Fertilization:
  * NPK 10-20-10: 120 kg/ha at planting
  * Rhizobium inoculant applied
- Harvest: April 2024, Yield: 2.1 tons/ha
- NDVI Peak: Week 9 (0.72)`}</pre>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleCloseInfo}>Cancel</button>
              <button className="btn-primary" onClick={handleProceedWithUpload}>
                📤 Proceed to Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ControlPanel;
