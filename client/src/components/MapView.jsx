import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import config from '../config';
import './MapView.css';

const API_URL = config.apiUrl;

// Tanzania agriculture region coordinates
// Tanzania spans: 7° to 11.5° South latitude, 30° to 38° East longitude
// Using center coordinates: ~9.25°S, 34°E (central Tanzania agricultural region)
const TANZANIA_CENTER = [-9.25, 34.0];
const DEFAULT_ZOOM = 15;

// 100-hectare field boundary (irregular octagon shape)
// 100 hectares = 1,000,000 square meters
// Irregular octagon to represent realistic farm boundaries
const FIELD_BOUNDARY = [
  [-9.245500, 33.998500],  // North
  [-9.246500, 34.002000],  // North-East
  [-9.249000, 34.004000],  // East
  [-9.252500, 34.003000],  // South-East
  [-9.254000, 34.000000],  // South
  [-9.253500, 33.996500],  // South-West
  [-9.250500, 33.995500],  // West
  [-9.247000, 33.996500],  // North-West
];

function NDVILayer({ enabled }) {
  const map = useMap();
  
  useEffect(() => {
    if (!enabled) return;

    let ndviLayer = null;

    // Fetch Sentinel Hub configuration
    fetch(`${API_URL}/api/ndvi-info`)
      .then(res => res.json())
      .then(config => {
        console.log('NDVI configuration:', config);
        
        if (config.configured && config.instanceId && !config.instanceId.includes('your_instance')) {
          // Use real Sentinel Hub NDVI WMS layer
          console.log('✅ Sentinel Hub configured!');
          console.log('Instance ID:', config.instanceId);
          console.log('Available layers:', config.layers);
          console.log('WMS URL:', `https://services.sentinel-hub.com/ogc/wms/${config.instanceId}`);
          
          // Test WMS connectivity
          fetch(`${API_URL}/api/test-wms-tile`)
            .then(r => r.json())
            .then(testResult => {
              console.log('WMS Test Result:', testResult);
              if (testResult.success) {
                console.log('🎉 WMS is working! You should see NDVI tiles.');
              } else {
                console.warn('⚠️ WMS test failed:', testResult.message);
              }
            });
          
          // Get the first available layer or use default NDVI layer
          const layerName = config.defaultLayer || 
                           (Array.isArray(config.layers) && config.layers.length > 0 
                             ? config.layers[0] 
                             : '3_NDVI');
          
          console.log('Using layer:', layerName);
          
          // Get current date range (last 6 months)
          const endDate = new Date();
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 6);
          
          const timeRange = `${startDate.toISOString().split('T')[0]}/${endDate.toISOString().split('T')[0]}`;
          console.log('Time range:', timeRange);
          
          ndviLayer = L.tileLayer.wms(`https://services.sentinel-hub.com/ogc/wms/${config.instanceId}`, {
            layers: layerName,
            format: 'image/png',
            transparent: true,
            opacity: 0.7,
            attribution: '&copy; <a href="https://www.sentinel-hub.com/">Sentinel Hub</a> | <a href="https://scihub.copernicus.eu/">Copernicus Sentinel-2</a>',
            maxcc: 30,
            time: timeRange,
            priority: 'leastCC',
            tileSize: 512,
            width: 512,
            height: 512,
            zIndex: 1000
          });
          
          ndviLayer.on('tileerror', (error) => {
            console.error('❌ NDVI tile error:', error);
            if (error.tile && error.tile.src) {
              console.log('Failed tile URL:', error.tile.src);
            }
            console.log('Check configuration at: https://apps.sentinel-hub.com/dashboard/#/configurations');
          });
          
          ndviLayer.on('tileload', (e) => {
            console.log('✅ NDVI tile loaded successfully! 🛰️');
          });
          
          ndviLayer.on('loading', () => {
            console.log('🔄 Loading NDVI tiles...');
          });
          
          ndviLayer.addTo(map);
          console.log('✅ Real NDVI WMS layer added to map');
          
        } else {
          // Fallback to demo visualization with better visibility
          console.log('⚠️ Using demo NDVI visualization. Configure SENTINEL_INSTANCE_ID for real data.');
          
          // Create custom pane for NDVI if it doesn't exist
          if (!map.getPane('ndviPane')) {
            const ndviPane = map.createPane('ndviPane');
            ndviPane.style.zIndex = 650;
            ndviPane.style.pointerEvents = 'none';
          }

          const getNDVIColor = (x, y, z) => {
            const hash = ((x + y) * (x + y + 1) / 2 + y) % 5;
            const colors = [
              'rgba(139, 69, 19, 0.5)',    // Brown
              'rgba(255, 255, 0, 0.5)',     // Yellow
              'rgba(144, 238, 144, 0.6)',   // Light green
              'rgba(34, 139, 34, 0.6)',     // Green
              'rgba(0, 100, 0, 0.6)'        // Dark green
            ];
            return colors[hash];
          };

          const NDVITileLayer = L.GridLayer.extend({
            createTile: function(coords) {
              const tile = document.createElement('div');
              tile.style.width = '256px';
              tile.style.height = '256px';
              tile.style.backgroundColor = getNDVIColor(coords.x, coords.y, coords.z);
              tile.style.border = '1px solid rgba(255,255,255,0.1)';
              return tile;
            }
          });

          ndviLayer = new NDVITileLayer({
            pane: 'ndviPane',
            opacity: 1,
            tileSize: 256
          });

          ndviLayer.addTo(map);
          console.log('✅ Demo NDVI layer added to map');
          
          // Force layer to front
          setTimeout(() => {
            const pane = map.getPane('ndviPane');
            if (pane) {
              console.log('NDVI pane z-index:', pane.style.zIndex);
            }
          }, 100);
        }
      })
      .catch(err => {
        console.error('Error fetching NDVI config:', err);
      });

    return () => {
      if (ndviLayer && map.hasLayer(ndviLayer)) {
        map.removeLayer(ndviLayer);
        console.log('NDVI layer removed');
      }
    };
  }, [enabled, map]);

  return null;
}

function CenterButton() {
  const map = useMap();
  
  const handleCenter = () => {
    map.setView(TANZANIA_CENTER, DEFAULT_ZOOM);
    console.log('Map centered to Tanzania:', TANZANIA_CENTER);
  };

  return (
    <button 
      className="center-button"
      onClick={handleCenter}
      title="Center map on Tanzania agriculture region"
    >
      📍 Center
    </button>
  );
}

function MapView({ ndviEnabled, setNdviEnabled }) {
  const [mapReady, setMapReady] = useState(false);

  return (
    <div className="map-container">
      <div className="map-controls-right">
        <button 
          className={`ndvi-toggle ${ndviEnabled ? 'active' : ''}`}
          onClick={() => setNdviEnabled(!ndviEnabled)}
        >
          {ndviEnabled ? '🟢' : '⚪'} NDVI Layer
        </button>
      </div>
      
      <MapContainer
        center={TANZANIA_CENTER}
        zoom={DEFAULT_ZOOM}
        className="leaflet-map"
        whenReady={() => setMapReady(true)}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          zIndex={1}
          maxZoom={19}
        />
        
        {/* 100-hectare field boundary */}
        <Polygon 
          positions={FIELD_BOUNDARY}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            dashArray: '10, 10'
          }}
        />
        
        {mapReady && <CenterButton />}
        {mapReady && ndviEnabled && <NDVILayer enabled={ndviEnabled} />}
      </MapContainer>
      
      {ndviEnabled && (
        <div className="ndvi-legend">
          <h4>NDVI Legend</h4>
          <div className="legend-item">
            <span className="legend-color" style={{background: '#8B4513'}}></span>
            <span>Bare Soil (0.0-0.2)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{background: '#FFFF00'}}></span>
            <span>Sparse Vegetation (0.2-0.4)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{background: '#90EE90'}}></span>
            <span>Moderate Vegetation (0.4-0.6)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{background: '#228B22'}}></span>
            <span>Dense Vegetation (0.6-0.8)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{background: '#006400'}}></span>
            <span>Very Dense (0.8-1.0)</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapView;
