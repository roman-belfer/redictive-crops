# Financial Analysis - Data Sources & Implementation

## 📊 Free Data Sources for Agricultural Economics

### 1. **Fertilizer Prices**

#### FAO (Food and Agriculture Organization)
- **API**: http://www.fao.org/faostat/en/#data
- **Coverage**: Global fertilizer prices, imports/exports
- **Format**: CSV, JSON available
- **Cost**: Free
- **Data**: NPK, Urea, Phosphate, Potassium prices by country/region

#### World Bank Commodity Prices (Pink Sheet)
- **API**: https://www.worldbank.org/en/research/commodity-markets
- **Endpoint**: `https://api.worldbank.org/v2/en/indicator/FERTILIZER.PRICES`
- **Coverage**: Monthly fertilizer price indices
- **Format**: JSON, XML
- **Cost**: Free
- **Example prices (Tanzania region, 2024)**:
  - NPK (10-20-10): $550-650/ton
  - Urea: $400-500/ton
  - DAP (Diammonium Phosphate): $600-700/ton

#### IndexMundi
- **Website**: https://www.indexmundi.com/commodities/
- **Coverage**: Fertilizer market prices
- **Update**: Monthly
- **Cost**: Free (web scraping possible)

### 2. **Soybean Prices**

#### USDA (US Department of Agriculture)
- **API**: https://quickstats.nass.usda.gov/api
- **Coverage**: Global agricultural commodity prices
- **Format**: JSON, CSV
- **Cost**: Free with API key

#### FAO GIEWS (Global Information and Early Warning System)
- **URL**: http://www.fao.org/giews/food-prices/tool/public/
- **Coverage**: Food prices by country including soybeans
- **Format**: CSV, Excel
- **Cost**: Free

#### Current Soybean Prices (Tanzania, 2024-2025)
- **Farm Gate Price**: $400-500/ton (TZS 1,000,000-1,250,000/ton)
- **Export Price**: $550-650/ton
- **Wholesale**: $480-580/ton

### 3. **Tanzania-Specific Agricultural Data**

#### Tanzania Ministry of Agriculture
- **Website**: https://www.kilimo.go.tz/
- **Data**: Local market prices, agricultural inputs
- **Format**: Reports (PDF), some data tables

#### East African Grain Council (EAGC)
- **Website**: https://www.eagc.org/
- **Market Watch**: Weekly grain prices across East Africa
- **Cost**: Free registration

## 💰 Financial Plan Implementation

### Step 1: Add Financial Calculation Endpoint

Create `/api/financial-analysis` endpoint that calculates:

```javascript
{
  inputs: {
    landSize: 100, // hectares
    fertilizers: [
      { type: "NPK 10-20-10", amount: 150, unit: "kg/ha", pricePerTon: 600 },
      { type: "Rhizobium", amount: 5, unit: "kg/ha", pricePerTon: 50 },
      { type: "Potassium Sulfate", amount: 75, unit: "kg/ha", pricePerTon: 550 }
    ],
    irrigation: {
      totalMM: 450,
      costPerMM: 2.5 // USD per mm per hectare
    },
    labor: {
      plantingDays: 10,
      harvestDays: 15,
      costPerDay: 8 // USD
    },
    seeds: {
      kgPerHa: 50,
      pricePerKg: 2.5
    }
  },
  outputs: {
    expectedYield: 2.8, // tons/ha
    soybeanPrice: 500 // USD/ton
  }
}
```

### Step 2: Cost Calculation

```javascript
// Fertilizer costs
const fertilizerCost = fertilizers.reduce((total, fert) => {
  return total + (fert.amount * landSize * fert.pricePerTon / 1000);
}, 0);

// Irrigation costs
const irrigationCost = irrigation.totalMM * irrigation.costPerMM * landSize;

// Labor costs
const laborCost = (labor.plantingDays + labor.harvestDays) * labor.costPerDay * (landSize / 10); // 10ha per crew

// Seed costs
const seedCost = seeds.kgPerHa * landSize * seeds.pricePerKg;

// Total input costs
const totalCosts = fertilizerCost + irrigationCost + laborCost + seedCost;
```

### Step 3: Revenue Calculation

```javascript
// Expected revenue
const totalYield = expectedYield * landSize; // tons
const grossRevenue = totalYield * soybeanPrice;

// Net profit
const netProfit = grossRevenue - totalCosts;

// ROI
const roi = (netProfit / totalCosts) * 100;
```

### Step 4: Sample Financial Report Output

```javascript
{
  financial: {
    costs: {
      fertilizers: {
        NPK: 900, // USD
        Rhizobium: 25,
        Potassium: 412.5,
        total: 1337.5
      },
      irrigation: 11250,
      labor: 2000,
      seeds: 12500,
      totalInputCosts: 27087.5
    },
    revenue: {
      expectedYield: 280, // tons
      pricePerTon: 500,
      grossRevenue: 140000
    },
    profit: {
      netProfit: 112912.5,
      roi: 416.7, // %
      profitPerHectare: 1129.13
    },
    breakEven: {
      yieldRequired: 54.2, // tons total
      yieldPerHectare: 0.542 // tons/ha
    }
  }
}
```

## 🔌 API Integration Example

### World Bank API for Fertilizer Prices

```javascript
async function getFertilizerPrices() {
  const response = await axios.get(
    'https://api.worldbank.org/v2/country/all/indicator/FERTILIZER.PRICES',
    {
      params: {
        format: 'json',
        date: '2024:2025',
        per_page: 100
      }
    }
  );
  return response.data[1]; // Prices array
}
```

### FAO Price API

```javascript
async function getSoybeanPrices(country = 'TZA') {
  const response = await axios.get(
    'http://www.fao.org/faostat/api/v1/en/data/PP',
    {
      params: {
        area: country,
        element: 'Producer Price',
        item: 'Soybeans'
      }
    }
  );
  return response.data;
}
```

## 📈 UI Implementation

Add a collapsible financial section in the AI recommendations:

```jsx
{analysisResult.financial && (
  <div className="result-card collapsible">
    <div className="result-card-header" onClick={() => toggleSection('financial')}>
      <h4>💰 Financial Analysis</h4>
      <span className="toggle-icon">{expandedSections.financial ? '▼' : '▶'}</span>
    </div>
    {expandedSections.financial && (
      <div className="result-card-content">
        <div className="financial-summary">
          <p><strong>Total Input Costs:</strong> ${analysisResult.financial.costs.totalInputCosts.toLocaleString()}</p>
          <p><strong>Expected Revenue:</strong> ${analysisResult.financial.revenue.grossRevenue.toLocaleString()}</p>
          <p><strong>Net Profit:</strong> ${analysisResult.financial.profit.netProfit.toLocaleString()}</p>
          <p><strong>ROI:</strong> {analysisResult.financial.profit.roi.toFixed(1)}%</p>
        </div>
        
        <div className="cost-breakdown">
          <h5>Cost Breakdown:</h5>
          <ul>
            <li>Fertilizers: ${analysisResult.financial.costs.fertilizers.total}</li>
            <li>Irrigation: ${analysisResult.financial.costs.irrigation}</li>
            <li>Labor: ${analysisResult.financial.costs.labor}</li>
            <li>Seeds: ${analysisResult.financial.costs.seeds}</li>
          </ul>
        </div>
      </div>
    )}
  </div>
)}
```

## 🎯 Next Steps

1. **Register for API Keys**:
   - World Bank: No key needed
   - USDA NASS: https://quickstats.nass.usda.gov/api (free)
   - FAO: No key needed

2. **Add to `.env`**:
   ```
   WORLDBANK_API_URL=https://api.worldbank.org/v2
   USDA_API_KEY=your_key_here
   FAO_API_URL=http://www.fao.org/faostat/api/v1
   ```

3. **Create Financial Service** (`server/src/services/financial.js`):
   - Fetch current prices
   - Calculate costs
   - Generate financial report

4. **Update AI Prompt** to include financial analysis request

5. **Add Financial Section** to UI results

## 📚 Additional Resources

- **Fertilizer Market Analysis**: https://www.ifastat.org/
- **African Market Prices**: https://www.eagc.org/market-data
- **Tanzania Agricultural Statistics**: https://www.nbs.go.tz/
- **Commodity Trading**: https://www.indexmundi.com/commodities/

Would you like me to implement the financial analysis feature now?
