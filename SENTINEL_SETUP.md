# Sentinel Hub Setup Guide for Real NDVI Data

## Current Status
✅ OAuth Client configured  
✅ Client ID and Secret added  
✅ Configuration created (ID: `a4009b6e-1a87-4000-9eb1-e6823de8255d`)
❌ **WMS Layers not configured** - "Layer NDVI not found"

## 🚨 IMPORTANT: Your Configuration Needs WMS Layers

Your configuration exists but has **no WMS layers** yet. You need to add them!

## How to Add WMS Layers:

### Step 1: Go to Your Configuration

1. Visit: https://apps.sentinel-hub.com/dashboard/#/configurations
2. Find your configuration: **"NDVI"** (ID: `a4009b6e-1a87-4000-9eb1-e6823de8255d`)
3. Click **Edit** or **Configure**

### Step 2: Add WMS Layer

1. Look for **"Layers"** section
2. Click **"Add Layer"** or **"Create Layer"**
3. Fill in:
   - **Layer ID**: `default` (or `NDVI`, `TRUE-COLOR-NDVI`, etc.)
   - **Data Source**: Select `Sentinel-2 L2A`
   - **Script Type**: Custom Script

### Step 3: Paste the Evalscript

Use the NDVI script you provided (it's perfect!):

```javascript
//VERSION=3
function setup() {
  return {
    input: [{
      bands: ["B04", "B08", "SCL"],
      units: "DN"
    }],
    output: {
      bands: 4,
      sampleType: "AUTO"
    }
  };
}

const ramp = [
  [-0.5, 0x0c0c0c],
  [-0.2, 0xbfbfbf],
  [-0.1, 0xdbdbdb],
  [0, 0xeaeaea],
  [0.025, 0xfff9cc],
  [0.05, 0xede8b5],
  [0.075, 0xddd89b],
  [0.1, 0xccc782],
  [0.125, 0xbcb76b],
  [0.15, 0xafc160],
  [0.175, 0xa3cc59],
  [0.2, 0x91bf51],
  [0.25, 0x7fb247],
  [0.3, 0x70a33f],
  [0.35, 0x609635],
  [0.4, 0x4f892d],
  [0.45, 0x3f7c23],
  [0.5, 0x306d1c],
  [0.55, 0x216011],
  [0.6, 0x0f540a],
  [1, 0x004400],
];

const visualizer = new ColorRampVisualizer(ramp);

function evaluatePixel(samples) {
  let ndvi = (samples.B08 - samples.B04) / (samples.B08 + samples.B04);
  
  // Mask clouds
  if (samples.SCL === 3 || samples.SCL === 8 || samples.SCL === 9 || samples.SCL === 10) {
    return [1, 1, 1, 0];
  }
  
  let imgVals = visualizer.process(ndvi);
  return imgVals.concat(samples.dataMask);
}
```

4. **Save and Copy Instance ID**:
   - After saving, you'll see an **Instance ID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
   - Copy this ID

### Step 2: Add Instance ID to .env

Open `/server/.env` and replace:
```
SENTINEL_INSTANCE_ID=your_instance_id_here
```

With your actual instance ID:
```
SENTINEL_INSTANCE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Step 3: Restart the Server

The app will automatically detect the configuration and start using real NDVI data!

## Preview NDVI Data Before Setup

Visit **EO Browser** to see what the data will look like:
- URL: https://apps.sentinel-hub.com/eo-browser/
- Navigate to Tanzania coordinates: `-6.369028, 34.888822`
- Select: Sentinel-2 L2A
- Choose: NDVI visualization
- Pick a date with low cloud coverage

## Verification

Once configured, check the browser console. You should see:
```
NDVI configuration: {configured: true, instanceId: "your-id"}
Using real Sentinel Hub NDVI data
Real NDVI layer added
```

Instead of:
```
Using demo NDVI visualization
```

## Troubleshooting

**Issue**: Still seeing colored squares  
**Solution**: Make sure Instance ID is correct and restart server

**Issue**: White/blank tiles  
**Solution**: Check date range and cloud coverage in the area

**Issue**: Authentication errors  
**Solution**: Verify OAuth Client ID and Secret are correct

## API Limits

Free tier includes:
- 30,000 Processing Units per month
- Each WMS tile request = ~1 processing unit
- Monitor usage: https://apps.sentinel-hub.com/dashboard/#/account/settings

## Resources

- Dashboard: https://apps.sentinel-hub.com/dashboard/
- Documentation: https://docs.sentinel-hub.com/api/latest/
- Evalscript examples: https://custom-scripts.sentinel-hub.com/
- Community Forum: https://forum.sentinel-hub.com/
