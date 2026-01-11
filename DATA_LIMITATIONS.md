# Data Limitations & Improvement Guide

## Current Data Sources

**Primary Source: Alpaca Markets API**
- ✅ Real-time and historical price/volume data (OHLCV bars)
- ✅ Quote data (bid/ask/last price)
- ✅ Multiple timeframes (1Min, 5Min, 1Hour, 1Day)
- ✅ Batch data fetching support (up to 100 symbols)

---

## Major Limitations for CANSLIM & Weinstein Analysis

### ❌ **What's Missing (Cannot Get from Alpaca)**

#### 1. **Earnings Data** (Critical for CANSLIM)
- **Current Quarterly Earnings (C)**: CANSLIM requires EPS growth of 25%+ vs previous quarter
- **Annual Earnings Growth (A)**: Need 3-year earnings history
- **Impact**: Currently using price momentum as a proxy, which is inaccurate
- **Solution Needed**: 
  - Free options: Alpha Vantage, Financial Modeling Prep, Yahoo Finance (unofficial)
  - Paid options: IEX Cloud, Polygon.io, Quandl, Bloomberg API

#### 2. **Fundamental Data** (Important for CANSLIM)
- **P/E Ratio**: Price-to-Earnings ratio
- **P/S Ratio**: Price-to-Sales ratio
- **Revenue Growth**: Quarterly and annual revenue
- **Debt Ratios**: Debt-to-equity, current ratio
- **Impact**: Cannot fully evaluate company fundamentals
- **Solution Needed**: Same as earnings data providers

#### 3. **Shares Outstanding** (Important for CANSLIM "S")
- **Supply and Demand**: CANSLIM requires knowing shares outstanding to evaluate float
- **Impact**: Currently using volume patterns as a proxy
- **Solution Needed**: Available from fundamental data providers

#### 4. **Institutional Ownership** (Important for CANSLIM "I")
- **13F Filings**: Quarterly institutional holdings
- **Mutual Fund Ownership**: CANSLIM looks for institutional sponsorship
- **Impact**: Currently using volume patterns as a proxy
- **Solution Needed**: 
  - Free: SEC EDGAR API (requires parsing)
  - Paid: IEX Cloud, Polygon.io, Nasdaq Data Link

#### 5. **Extended Historical Data** (Important for Weinstein)
- **Current**: Fetching ~252 days (1 year)
- **Ideal for Weinstein**: 2-3 years (500-750 trading days)
- **Impact**: 30-week MA calculation is less accurate with limited data
- **Solution**: ✅ **CAN BE IMPROVED** (see improvements below)

---

## ✅ Improvements Made on Our End

### 1. **Enhanced Historical Data Fetching**
- ✅ Added date range support for more reliable data retrieval
- ✅ Increased default request to 252 days (1 year)
- ✅ Better fallback logic when date ranges fail
- ✅ Respects Alpaca's API limits (max 10,000 bars)

### 2. **Batch Data Fetching**
- ✅ Added `getBatchMarketData()` method for scanning multiple stocks
- ✅ Added `getBatchBars()` method for efficient multi-symbol requests
- ✅ Processes up to 100 symbols per batch (Alpaca's limit)
- ✅ Reduces API calls significantly for scanner functionality

### 3. **Better Error Handling**
- ✅ Graceful degradation when data is missing
- ✅ Multiple fallback strategies
- ✅ Detailed logging for debugging

---

## 🔧 What You Need to Add

### Option 1: **Add Alpha Vantage API** (Free Tier Available)
```bash
# Add to .env
VITE_ALPHA_VANTAGE_API_KEY=your_key_here
```

**Provides:**
- Earnings data (quarterly/annual)
- Basic fundamentals (P/E, P/S, EPS)
- Revenue data
- Free tier: 5 API calls per minute, 500 per day

**Integration Steps:**
1. Sign up at https://www.alphavantage.co/support/#api-key
2. Add API key to environment variables
3. Create `src/services/alphaVantageService.ts`
4. Merge earnings/fundamental data with Alpaca price data

### Option 2: **Add Financial Modeling Prep** (Free Tier Available)
```bash
# Add to .env
VITE_FMP_API_KEY=your_key_here
```

**Provides:**
- Comprehensive fundamentals
- Earnings data
- Financial statements
- Company profiles
- Free tier: 250 requests/day

**Integration Steps:**
1. Sign up at https://financialmodelingprep.com/developer/docs/
2. Add API key to environment variables
3. Create `src/services/fmpService.ts`
4. Merge data with Alpaca price data

### Option 3: **Add IEX Cloud** (Paid, but Comprehensive)
```bash
# Add to .env
VITE_IEX_CLOUD_API_KEY=your_key_here
```

**Provides:**
- All fundamental data
- Earnings data
- Institutional ownership
- News/sentiment
- Paid tier: $9-999/month depending on usage

---

## 📊 Recommended Implementation Priority

### Phase 1: **Quick Wins** (Do First)
1. ✅ **DONE**: Improved historical data fetching (date ranges, batch support)
2. Add Alpha Vantage for earnings data (free tier)
3. Merge earnings data into CANSLIM analysis
4. Update CANSLIM service to use real earnings instead of price proxies

### Phase 2: **Enhanced Analysis** (Do Next)
1. Add fundamental data (P/E, P/S, revenue)
2. Add shares outstanding data
3. Enhance CANSLIM "S" (Supply/Demand) with actual float data
4. Improve CANSLIM "I" (Institutional) with ownership data

### Phase 3: **Advanced Features** (Future)
1. Add 13F filing data for institutional ownership
2. Add news/sentiment data for qualitative analysis
3. Add options data for volatility analysis
4. Add sector/industry data for relative strength

---

## 🚀 Immediate Actions You Can Take

### 1. **Sign Up for Alpha Vantage** (5 minutes)
- Go to https://www.alphavantage.co/support/#api-key
- Get free API key
- Add to `.env` file
- I can help integrate it into the codebase

### 2. **Test Current Improvements**
- Try scanning multiple stocks using batch functionality
- Check if you're getting more historical data (up to 252 days)
- Monitor console logs to see data quality

### 3. **Consider Paid Options**
- If free tier limits are too restrictive
- IEX Cloud offers comprehensive data
- Polygon.io is another strong option
- Both have developer-friendly APIs

---

## 📝 Code Changes Needed for Full Integration

Once you add an earnings/fundamental data provider, we'll need to:

1. **Update MarketData Interface**
```typescript
export interface MarketData {
  symbol: string;
  quote: StockQuote;
  dailyBar?: Bar;
  historicalBars?: Bar[];
  fundamentals?: {
    earnings?: EarningsData;
    financials?: FinancialData;
    sharesOutstanding?: number;
  };
}
```

2. **Update CANSLIM Service**
- Replace price momentum proxies with actual earnings data
- Use real P/E ratios instead of estimates
- Use actual shares outstanding for "S" criterion

3. **Update Data Fetching**
- Merge Alpaca price data with earnings/fundamental data
- Handle missing data gracefully
- Cache frequently accessed data

---

## 💡 Questions to Consider

1. **Budget**: Are you willing to pay for data ($9-50/month) or need free options?
2. **Volume**: How many stocks do you want to scan? (Affects API tier needs)
3. **Real-time vs Delayed**: Do you need real-time earnings or is delayed acceptable?
4. **Data Freshness**: How often do you need data updated? (Daily, hourly, real-time)

Let me know which direction you'd like to go, and I can help implement the integration!
