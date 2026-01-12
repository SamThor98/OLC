# Alpha Vantage API Guide for CANSLIM & Weinstein Analysis

## 🎯 Best Alpha Vantage Endpoints for Your Needs

Based on your CANSLIM and Weinstein analysis requirements, here are the **optimal Alpha Vantage endpoints** to use:

---

## ✅ **Essential Endpoints (Must Have)**

### 1. **EARNINGS API** ⭐ **HIGHEST PRIORITY**
**Endpoint:** `EARNINGS`  
**URL:** `https://www.alphavantage.co/query?function=EARNINGS&symbol={SYMBOL}&apikey={API_KEY}`

**What it provides:**
- ✅ Quarterly earnings per share (EPS) - **Critical for CANSLIM "C"**
- ✅ Annual earnings per share - **Critical for CANSLIM "A"**
- ✅ Earnings date
- ✅ Revenue (quarterly and annual)

**Why it's critical:**
- CANSLIM "C" requires **25%+ quarterly EPS growth** - you need actual earnings data
- CANSLIM "A" requires **25%+ annual earnings growth over 3 years** - you need historical earnings
- Currently you're using price momentum as a proxy (inaccurate)

**Example Response:**
```json
{
  "quarterlyEarnings": [
    {
      "fiscalDateEnding": "2024-09-30",
      "reportedDate": "2024-10-25",
      "reportedEPS": "1.46",
      "estimatedEPS": "1.38",
      "surprise": "0.08",
      "surprisePercentage": "5.7971"
    }
  ],
  "annualEarnings": [
    {
      "fiscalDateEnding": "2023-12-31",
      "reportedEPS": "6.11"
    }
  ]
}
```

---

### 2. **OVERVIEW API** ⭐ **HIGH PRIORITY**
**Endpoint:** `OVERVIEW`  
**URL:** `https://www.alphavantage.co/query?function=OVERVIEW&symbol={SYMBOL}&apikey={API_KEY}`

**What it provides:**
- ✅ **Shares Outstanding** - Critical for CANSLIM "S" (Supply/Demand)
- ✅ **P/E Ratio** - Fundamental valuation metric
- ✅ **P/S Ratio** - Price-to-Sales ratio
- ✅ **Market Capitalization** - Company size
- ✅ **Dividend Yield** - Additional fundamental data
- ✅ **52 Week High/Low** - For new highs analysis
- ✅ **Beta** - Volatility measure
- ✅ **EPS** - Current earnings per share
- ✅ **Revenue (TTM)** - Trailing twelve months revenue

**Why it's critical:**
- CANSLIM "S" requires evaluating **shares outstanding** (float) - you need this number
- Provides key fundamental ratios for company evaluation
- One API call gives you multiple metrics

**Example Response:**
```json
{
  "Symbol": "AAPL",
  "SharesOutstanding": "15355214000",
  "MarketCapitalization": "3500000000000",
  "PERatio": "28.5",
  "PEGRatio": "2.1",
  "PriceToSalesRatioTTM": "7.2",
  "DividendYield": "0.005",
  "52WeekHigh": "198.23",
  "52WeekLow": "124.17",
  "EPS": "6.11",
  "RevenueTTM": "394328000000"
}
```

---

### 3. **INCOME_STATEMENT API** ⭐ **MEDIUM PRIORITY**
**Endpoint:** `INCOME_STATEMENT`  
**URL:** `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol={SYMBOL}&apikey={API_KEY}`

**What it provides:**
- ✅ Quarterly revenue - For revenue growth analysis
- ✅ Annual revenue - For annual growth trends
- ✅ Net income - For profitability analysis
- ✅ Operating income - For operational efficiency
- ✅ Historical data (5 years of annual, 4 quarters)

**Why it's useful:**
- Validates earnings growth with revenue growth
- Provides additional fundamental context
- Can identify revenue acceleration (strong CANSLIM signal)

**Example Response:**
```json
{
  "quarterlyReports": [
    {
      "fiscalDateEnding": "2024-09-30",
      "totalRevenue": "89498000000",
      "netIncome": "22956000000"
    }
  ],
  "annualReports": [
    {
      "fiscalDateEnding": "2023-12-31",
      "totalRevenue": "383285000000",
      "netIncome": "96995000000"
    }
  ]
}
```

---

## 🔄 **Optional but Helpful Endpoints**

### 4. **BALANCE_SHEET API** (Optional)
**Provides:** Assets, liabilities, debt ratios  
**Use case:** Evaluate financial health and debt levels  
**Priority:** Low (not critical for CANSLIM)

### 5. **CASH_FLOW API** (Optional)
**Provides:** Operating, investing, financing cash flows  
**Use case:** Evaluate cash generation ability  
**Priority:** Low (not critical for CANSLIM)

---

## ❌ **Endpoints You DON'T Need**

### TIME_SERIES APIs
- **Why skip:** You already have better price/volume data from Alpaca
- Alpaca provides real-time data, Alpha Vantage is delayed
- Alpaca has better historical data access

---

## 📊 **Recommended Implementation Strategy**

### Phase 1: Core Integration (Start Here)
1. **EARNINGS API** - For CANSLIM "C" and "A"
2. **OVERVIEW API** - For CANSLIM "S" (shares outstanding) and fundamentals

**API Calls per stock:** 2 calls  
**Free tier limit:** 25 calls/day = ~12 stocks/day  
**Upgrade needed?** Probably yes for scanning (see below)

### Phase 2: Enhanced Analysis
3. **INCOME_STATEMENT API** - For revenue growth validation

**API Calls per stock:** 3 calls  
**Free tier limit:** 25 calls/day = ~8 stocks/day

---

## 💰 **Alpha Vantage Pricing & Limits**

### Free Tier
- **25 API calls per day**
- **5 API calls per minute**
- **Delayed data** (15-20 minutes)
- **Good for:** Testing, single stock analysis

### Premium Tier ($49.99/month)
- **1,200 API calls per day**
- **5 API calls per minute**
- **Real-time data**
- **Good for:** Scanning 50-100 stocks/day

### Professional Tier ($149.99/month)
- **Unlimited API calls**
- **Higher rate limits**
- **Real-time data**
- **Good for:** Large-scale scanning

---

## 🚀 **Implementation Plan**

### Step 1: Create Alpha Vantage Service
```typescript
// src/services/alphaVantageService.ts
class AlphaVantageService {
  async getEarnings(symbol: string): Promise<EarningsData>
  async getOverview(symbol: string): Promise<CompanyOverview>
  async getIncomeStatement(symbol: string): Promise<IncomeStatement>
}
```

### Step 2: Merge with Alpaca Data
```typescript
// Combine Alpaca price data + Alpha Vantage fundamental data
const marketData = await alpacaService.getMarketData(symbol);
const fundamentals = await alphaVantageService.getEarnings(symbol);
const overview = await alphaVantageService.getOverview(symbol);
```

### Step 3: Update CANSLIM Service
- Replace price momentum proxies with actual earnings data
- Use real shares outstanding for "S" criterion
- Use P/E ratios for fundamental validation

---

## 📝 **API Key Setup**

1. **Get API Key:**
   - Go to: https://www.alphavantage.co/support/#api-key
   - Sign up (free)
   - Copy your API key

2. **Add to .env:**
   ```bash
   VITE_ALPHA_VANTAGE_API_KEY=your_api_key_here
   ```

3. **Rate Limiting:**
   - Free tier: 5 calls/minute, 25 calls/day
   - Add delays between requests: `await sleep(12000)` (12 seconds between calls)
   - Consider caching results to reduce API calls

---

## 🎯 **Summary: Best Endpoints for You**

| Endpoint | Priority | Use Case | API Calls/Stock |
|----------|----------|---------|-----------------|
| **EARNINGS** | ⭐⭐⭐⭐⭐ | CANSLIM C & A | 1 |
| **OVERVIEW** | ⭐⭐⭐⭐ | CANSLIM S, Fundamentals | 1 |
| **INCOME_STATEMENT** | ⭐⭐⭐ | Revenue Growth | 1 |
| TIME_SERIES | ❌ Skip | Already have from Alpaca | 0 |

**Total:** 2-3 API calls per stock for full CANSLIM analysis

---

## ⚠️ **Important Considerations**

1. **Rate Limits:** Free tier is very limited (25/day). For scanning, you'll likely need premium.

2. **Data Delay:** Free tier has 15-20 minute delay. Premium has real-time.

3. **Caching Strategy:** Cache fundamental data (changes quarterly) to reduce API calls.

4. **Error Handling:** Alpha Vantage can be unreliable. Add retry logic and fallbacks.

5. **Cost vs. Value:** 
   - Free tier: Good for testing
   - Premium ($50/month): Good for scanning 50-100 stocks/day
   - Consider: Is this cheaper than IEX Cloud or Polygon.io?

---

## 🔄 **Alternative: Hybrid Approach**

**Option:** Use Alpha Vantage for earnings + Alpaca for everything else
- **Earnings:** Alpha Vantage (EARNINGS endpoint)
- **Price/Volume:** Alpaca (already have)
- **Shares Outstanding:** Alpha Vantage (OVERVIEW endpoint)
- **Institutional Data:** Still need another source (IEX Cloud, Polygon.io)

This gives you the critical CANSLIM data while keeping costs reasonable.

---

**Next Steps:** Once you have your Alpha Vantage API key, I can help integrate these endpoints into your codebase!
