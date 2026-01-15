/**
 * Personal Daily Market Email for sttonka9@gmail.com
 * 
 * Comprehensive portfolio tracking with:
 * - Full portfolio positions with cost basis
 * - Technical analysis signals (MAs, RSI, volume)
 * - Position sizing alerts
 * - Profit-taking/stop-loss recommendations
 * - Sector diversification analysis
 * - Daily news with AI-style interpretation
 * - Stock-specific news for your holdings
 * 
 * Uses direct Yahoo Finance API calls for reliable data
 */

const nodemailer = require('nodemailer');
const https = require('https');

// ============================================================================
// CONFIGURATION - YOUR PORTFOLIO
// ============================================================================

const CONFIG = {
  recipient: 'sttonka9@gmail.com',
  sender: process.env.PERSONAL_EMAIL_USER || 'sttonka9@gmail.com',
  
  // Your portfolio positions with cost basis
  portfolio: [
    { symbol: 'ACMR', name: 'ACM Research', sector: 'Semiconductors', shares: 505, costBasis: 39.41 },
    { symbol: 'AEHR', name: 'Aehr Test Systems', sector: 'Semiconductors', shares: 400, costBasis: 26.27 },
    { symbol: 'AMZN', name: 'Amazon', sector: 'Technology', shares: 75, costBasis: 200.00 },
    { symbol: 'ASML', name: 'ASML Holding', sector: 'Semiconductors', shares: 50, costBasis: 783.59 },
    { symbol: 'HOOD', name: 'Robinhood Markets', sector: 'Fintech', shares: 50, costBasis: 47.71 },
    { symbol: 'JKS', name: 'JinkoSolar', sector: 'Solar/Renewables', shares: 208, costBasis: 24.04 },
    { symbol: 'LSCC', name: 'Lattice Semiconductor', sector: 'Semiconductors', shares: 404, costBasis: 68.83 },
    { symbol: 'NVTS', name: 'Navitas Semiconductor', sector: 'Semiconductors', shares: 2000, costBasis: 7.50 },
    { symbol: 'PL', name: 'Planet Labs', sector: 'Space/Satellite', shares: 1250, costBasis: 12.09 }
  ],
  
  marketIndices: [
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^DJI', name: 'Dow Jones' },
    { symbol: '^IXIC', name: 'NASDAQ' },
    { symbol: '^VIX', name: 'VIX (Fear Index)' },
    { symbol: 'SMH', name: 'Semiconductor ETF' }
  ],
  
  // Alert thresholds
  alerts: {
    profitTakePercent: 50,      // Alert when gain exceeds 50%
    stopLossPercent: -20,       // Alert when loss exceeds 20%
    maxPositionPercent: 25,     // Alert when position > 25% of portfolio
    minPositionPercent: 3,      // Alert when position < 3% of portfolio
    highVolumeMultiple: 2.0,    // Alert when volume > 2x average
    rsiOverbought: 70,          // RSI overbought threshold
    rsiOversold: 30             // RSI oversold threshold
  }
};

// ============================================================================
// DIRECT YAHOO FINANCE API
// ============================================================================

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) return 50; // Default neutral
  
  const changes = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] && closes[i-1]) {
      changes.push(closes[i] - closes[i-1]);
    }
  }
  
  if (changes.length < period) return 50;
  
  // Get last 'period' changes
  const recentChanges = changes.slice(-period);
  
  let gains = 0, losses = 0;
  recentChanges.forEach(change => {
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  });
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

async function getYahooQuote(symbol) {
  try {
    const encodedSymbol = encodeURIComponent(symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?interval=1d&range=1y`;
    
    console.log(`     Fetching ${symbol} from Yahoo Finance...`);
    const data = await fetchJSON(url);
    
    if (!data.chart || !data.chart.result || !data.chart.result[0]) {
      console.log(`     ⚠ No chart data for ${symbol}`);
      return null;
    }
    
    const result = data.chart.result[0];
    const meta = result.meta;
    const quotes = result.indicators?.quote?.[0] || {};
    const timestamps = result.timestamp || [];
    const closes = quotes.close || [];
    
    const currentPrice = meta.regularMarketPrice || (closes.length > 0 ? closes[closes.length - 1] : 0) || 0;
    
    // Calculate daily change from historical data
    let previousClose = 0;
    let change = 0;
    let changePercent = 0;
    
    if (closes.length >= 2) {
      const validCloses = closes.filter(c => c && c > 0);
      if (validCloses.length >= 2) {
        const lastClose = validCloses[validCloses.length - 1];
        const prevClose = validCloses[validCloses.length - 2];
        previousClose = prevClose;
        change = lastClose - prevClose;
        changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
      }
    } else {
      previousClose = meta.previousClose || meta.regularMarketPreviousClose || currentPrice;
      change = currentPrice - previousClose;
      changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
    }
    
    // Calculate historical performance
    let weekReturn = 0, monthReturn = 0, threeMonthReturn = 0, ytdReturn = 0;
    
    if (closes.length > 5) {
      const today = closes[closes.length - 1] || currentPrice;
      
      const weekAgoIdx = Math.max(0, closes.length - 5);
      const monthAgoIdx = Math.max(0, closes.length - 22);
      const threeMonthAgoIdx = Math.max(0, closes.length - 66);
      
      const weekAgoPrice = closes[weekAgoIdx] || today;
      const monthAgoPrice = closes[monthAgoIdx] || today;
      const threeMonthAgoPrice = closes[threeMonthAgoIdx] || today;
      
      const currentYear = new Date().getFullYear();
      let ytdStartPrice = closes[0] || today;
      for (let i = 0; i < timestamps.length; i++) {
        const date = new Date(timestamps[i] * 1000);
        if (date.getFullYear() === currentYear && closes[i]) {
          ytdStartPrice = closes[i];
          break;
        }
      }
      
      weekReturn = weekAgoPrice > 0 ? ((today - weekAgoPrice) / weekAgoPrice) * 100 : 0;
      monthReturn = monthAgoPrice > 0 ? ((today - monthAgoPrice) / monthAgoPrice) * 100 : 0;
      threeMonthReturn = threeMonthAgoPrice > 0 ? ((today - threeMonthAgoPrice) / threeMonthAgoPrice) * 100 : 0;
      ytdReturn = ytdStartPrice > 0 ? ((today - ytdStartPrice) / ytdStartPrice) * 100 : 0;
    }
    
    const highs = quotes.high || [];
    const lows = quotes.low || [];
    const volumes = quotes.volume || [];
    
    const fiftyTwoWeekHigh = highs.length > 0 ? Math.max(...highs.filter(h => h)) : meta.fiftyTwoWeekHigh || 0;
    const fiftyTwoWeekLow = lows.length > 0 ? Math.min(...lows.filter(l => l)) : meta.fiftyTwoWeekLow || 0;
    
    // Calculate moving averages
    let tenWeekMA = 0, thirtyWeekMA = 0, fiftyDayMA = 0, twoHundredDayMA = 0;
    const closesExcludingToday = closes.slice(0, -1);
    
    if (closesExcludingToday.length >= 50) {
      const last50 = closesExcludingToday.slice(-50).filter(c => c);
      fiftyDayMA = last50.length > 0 ? last50.reduce((a, b) => a + b, 0) / last50.length : 0;
      tenWeekMA = fiftyDayMA;
    }
    if (closesExcludingToday.length >= 150) {
      const last150 = closesExcludingToday.slice(-150).filter(c => c);
      thirtyWeekMA = last150.length > 0 ? last150.reduce((a, b) => a + b, 0) / last150.length : 0;
    }
    if (closesExcludingToday.length >= 200) {
      const last200 = closesExcludingToday.slice(-200).filter(c => c);
      twoHundredDayMA = last200.length > 0 ? last200.reduce((a, b) => a + b, 0) / last200.length : 0;
    }
    
    // Calculate RSI
    const rsi = calculateRSI(closes.filter(c => c));
    
    const prevDayIdx = closes.length >= 2 ? closes.length - 2 : 0;
    const prevDayClose = closes[prevDayIdx] || previousClose;
    
    const dayHigh = highs.length > 0 ? highs[highs.length - 1] || 0 : 0;
    const dayLow = lows.length > 0 ? lows[lows.length - 1] || 0 : 0;
    const volume = volumes.length > 0 ? volumes[volumes.length - 1] || 0 : 0;
    
    const last10Volumes = volumes.slice(-10).filter(v => v);
    const avgVolume = last10Volumes.length > 0 ? last10Volumes.reduce((a, b) => a + b, 0) / last10Volumes.length : 0;
    
    console.log(`     ✓ ${symbol}: $${currentPrice.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%) RSI: ${rsi.toFixed(1)}`);
    
    return {
      symbol,
      name: meta.shortName || meta.longName || symbol,
      price: currentPrice,
      change,
      changePercent,
      previousClose,
      prevDayClose,
      open: meta.regularMarketOpen || 0,
      dayHigh: meta.regularMarketDayHigh || dayHigh,
      dayLow: meta.regularMarketDayLow || dayLow,
      volume: meta.regularMarketVolume || volume,
      avgVolume,
      marketCap: meta.marketCap || 0,
      fiftyTwoWeekHigh,
      fiftyTwoWeekLow,
      fiftyDayMA,
      twoHundredDayMA,
      tenWeekMA,
      thirtyWeekMA,
      rsi,
      weekReturn,
      monthReturn,
      threeMonthReturn,
      ytdReturn
    };
  } catch (error) {
    console.error(`     ✗ Error fetching ${symbol}:`, error.message);
    return null;
  }
}

async function getMarketIndices() {
  const results = [];
  
  for (const index of CONFIG.marketIndices) {
    try {
      console.log(`   Fetching ${index.name}...`);
      const data = await getYahooQuote(index.symbol);
      
      if (data && data.price > 0) {
        results.push({
          symbol: index.symbol,
          name: index.name,
          price: data.price,
          change: data.change,
          changePercent: data.changePercent
        });
      } else {
        results.push({
          symbol: index.symbol,
          name: index.name,
          price: 0,
          change: 0,
          changePercent: 0
        });
      }
    } catch (error) {
      console.error(`   ✗ Error fetching ${index.name}:`, error.message);
      results.push({
        symbol: index.symbol,
        name: index.name,
        price: 0,
        change: 0,
        changePercent: 0
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  return results;
}

// ============================================================================
// NEWS FETCHING & INTERPRETATION
// ============================================================================

async function getStockNews(symbol) {
  try {
    const encodedSymbol = encodeURIComponent(symbol);
    // Yahoo Finance quoteSummary endpoint includes news
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodedSymbol}&newsCount=5&quotesCount=0`;
    
    const data = await fetchJSON(url);
    
    if (data && data.news && data.news.length > 0) {
      return data.news.slice(0, 3).map(item => ({
        title: item.title || '',
        publisher: item.publisher || 'Unknown',
        link: item.link || '',
        publishedAt: item.providerPublishTime ? new Date(item.providerPublishTime * 1000) : new Date(),
        thumbnail: item.thumbnail?.resolutions?.[0]?.url || null
      }));
    }
    return [];
  } catch (error) {
    console.log(`     ⚠ No news for ${symbol}`);
    return [];
  }
}

async function getMarketNews() {
  try {
    // Get general market news
    const urls = [
      'https://query1.finance.yahoo.com/v1/finance/search?q=stock%20market&newsCount=5&quotesCount=0',
      'https://query1.finance.yahoo.com/v1/finance/search?q=semiconductor&newsCount=3&quotesCount=0',
      'https://query1.finance.yahoo.com/v1/finance/search?q=federal%20reserve&newsCount=2&quotesCount=0'
    ];
    
    const allNews = [];
    
    for (const url of urls) {
      try {
        const data = await fetchJSON(url);
        if (data && data.news) {
          allNews.push(...data.news);
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (e) {
        // Continue with other sources
      }
    }
    
    // Deduplicate by title and get most recent
    const seen = new Set();
    const uniqueNews = allNews.filter(item => {
      if (seen.has(item.title)) return false;
      seen.add(item.title);
      return true;
    });
    
    return uniqueNews.slice(0, 8).map(item => ({
      title: item.title || '',
      publisher: item.publisher || 'Unknown',
      link: item.link || '',
      publishedAt: item.providerPublishTime ? new Date(item.providerPublishTime * 1000) : new Date()
    }));
  } catch (error) {
    console.log('   ⚠ Could not fetch market news');
    return [];
  }
}

function analyzeNewsSentiment(title) {
  const lowerTitle = title.toLowerCase();
  
  // Bullish keywords
  const bullishWords = [
    'surge', 'soar', 'jump', 'rally', 'gain', 'rise', 'climb', 'boost', 'upgrade',
    'beat', 'exceed', 'record', 'high', 'growth', 'profit', 'bullish', 'optimism',
    'breakthrough', 'innovation', 'partnership', 'deal', 'contract', 'win', 'success',
    'outperform', 'strong', 'momentum', 'buy', 'upside', 'opportunity'
  ];
  
  // Bearish keywords
  const bearishWords = [
    'fall', 'drop', 'plunge', 'sink', 'decline', 'tumble', 'crash', 'loss', 'miss',
    'downgrade', 'cut', 'weak', 'fear', 'concern', 'risk', 'warning', 'bearish',
    'sell', 'selloff', 'recession', 'inflation', 'layoff', 'lawsuit', 'probe',
    'investigation', 'fraud', 'default', 'bankruptcy', 'underperform', 'tariff'
  ];
  
  // Neutral/informational keywords
  const neutralWords = [
    'report', 'announce', 'update', 'plan', 'consider', 'review', 'analyze',
    'earnings', 'results', 'guidance', 'outlook', 'forecast'
  ];
  
  let bullishScore = 0;
  let bearishScore = 0;
  
  bullishWords.forEach(word => {
    if (lowerTitle.includes(word)) bullishScore++;
  });
  
  bearishWords.forEach(word => {
    if (lowerTitle.includes(word)) bearishScore++;
  });
  
  if (bullishScore > bearishScore) return { sentiment: 'bullish', color: '#10B981', icon: '📈' };
  if (bearishScore > bullishScore) return { sentiment: 'bearish', color: '#EF4444', icon: '📉' };
  return { sentiment: 'neutral', color: '#6B7280', icon: '📰' };
}

function interpretNewsForPortfolio(newsItem, portfolioSymbols) {
  const title = newsItem.title.toLowerCase();
  const sentiment = analyzeNewsSentiment(newsItem.title);
  
  // Check which portfolio stocks might be affected
  const affectedStocks = [];
  
  // Direct mentions
  portfolioSymbols.forEach(sym => {
    const symbolLower = sym.toLowerCase();
    const position = CONFIG.portfolio.find(p => p.symbol === sym);
    const nameLower = position ? position.name.toLowerCase() : '';
    
    if (title.includes(symbolLower) || title.includes(nameLower)) {
      affectedStocks.push(sym);
    }
  });
  
  // Sector/theme relevance
  const sectorKeywords = {
    'Semiconductors': ['chip', 'semiconductor', 'wafer', 'fab', 'foundry', 'nvidia', 'amd', 'intel', 'tsmc', 'asml', 'silicon', 'gpu', 'ai chip'],
    'Technology': ['tech', 'amazon', 'cloud', 'aws', 'e-commerce', 'retail', 'ai', 'artificial intelligence'],
    'Solar/Renewables': ['solar', 'renewable', 'clean energy', 'green', 'panel', 'photovoltaic', 'jinko'],
    'Fintech': ['fintech', 'trading', 'brokerage', 'robinhood', 'retail investor', 'meme stock', 'crypto'],
    'Space/Satellite': ['space', 'satellite', 'earth observation', 'geospatial', 'planet labs', 'imagery']
  };
  
  Object.entries(sectorKeywords).forEach(([sector, keywords]) => {
    keywords.forEach(keyword => {
      if (title.includes(keyword)) {
        CONFIG.portfolio.forEach(pos => {
          if (pos.sector === sector && !affectedStocks.includes(pos.symbol)) {
            affectedStocks.push(pos.symbol);
          }
        });
      }
    });
  });
  
  // Generate interpretation
  let interpretation = '';
  
  if (affectedStocks.length > 0) {
    const stockList = affectedStocks.join(', ');
    if (sentiment.sentiment === 'bullish') {
      interpretation = `Potentially positive for ${stockList}. Monitor for momentum.`;
    } else if (sentiment.sentiment === 'bearish') {
      interpretation = `May impact ${stockList} negatively. Watch price action.`;
    } else {
      interpretation = `Relevant to ${stockList}. Stay informed on developments.`;
    }
  } else {
    // General market interpretation
    if (title.includes('fed') || title.includes('rate') || title.includes('inflation')) {
      interpretation = 'Macro impact: Rate-sensitive growth stocks may react.';
    } else if (title.includes('china') || title.includes('tariff') || title.includes('trade')) {
      interpretation = 'Trade exposure: Semis and solar names could be affected.';
    } else if (title.includes('market') || title.includes('s&p') || title.includes('nasdaq')) {
      interpretation = 'Broad market move may affect portfolio beta.';
    } else {
      interpretation = 'General market context.';
    }
  }
  
  return {
    ...newsItem,
    sentiment,
    affectedStocks,
    interpretation
  };
}

async function fetchAllNews(portfolioSymbols) {
  console.log('📰 Fetching news...');
  
  const allNews = {
    marketNews: [],
    stockNews: {}
  };
  
  // Get market news
  console.log('   • Fetching market news...');
  allNews.marketNews = await getMarketNews();
  console.log(`     ✓ Found ${allNews.marketNews.length} market articles`);
  
  // Get news for top holdings (limit to save time)
  const topSymbols = portfolioSymbols.slice(0, 5);
  for (const symbol of topSymbols) {
    console.log(`   • Fetching news for ${symbol}...`);
    const news = await getStockNews(symbol);
    if (news.length > 0) {
      allNews.stockNews[symbol] = news;
      console.log(`     ✓ Found ${news.length} articles`);
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Interpret all news
  const interpretedMarketNews = allNews.marketNews.map(item => 
    interpretNewsForPortfolio(item, portfolioSymbols)
  );
  
  const interpretedStockNews = {};
  Object.entries(allNews.stockNews).forEach(([symbol, news]) => {
    interpretedStockNews[symbol] = news.map(item => ({
      ...item,
      sentiment: analyzeNewsSentiment(item.title)
    }));
  });
  
  return {
    marketNews: interpretedMarketNews,
    stockNews: interpretedStockNews
  };
}

// ============================================================================
// PORTFOLIO ANALYSIS
// ============================================================================

function analyzePortfolio(stocksData) {
  const analysis = {
    totalValue: 0,
    totalCost: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0,
    dayChange: 0,
    positions: [],
    sectorAllocation: {},
    alerts: [],
    recommendations: []
  };
  
  // Calculate position values
  stocksData.forEach(stock => {
    if (!stock) return;
    
    const position = CONFIG.portfolio.find(p => p.symbol === stock.symbol);
    if (!position) return;
    
    const currentValue = stock.price * position.shares;
    const costValue = position.costBasis * position.shares;
    const gainLoss = currentValue - costValue;
    const gainLossPercent = costValue > 0 ? (gainLoss / costValue) * 100 : 0;
    const dayChangeValue = stock.change * position.shares;
    
    analysis.totalValue += currentValue;
    analysis.totalCost += costValue;
    analysis.dayChange += dayChangeValue;
    
    // Sector allocation
    if (!analysis.sectorAllocation[position.sector]) {
      analysis.sectorAllocation[position.sector] = 0;
    }
    analysis.sectorAllocation[position.sector] += currentValue;
    
    analysis.positions.push({
      ...stock,
      shares: position.shares,
      costBasis: position.costBasis,
      sector: position.sector,
      currentValue,
      costValue,
      gainLoss,
      gainLossPercent,
      dayChangeValue
    });
  });
  
  analysis.totalGainLoss = analysis.totalValue - analysis.totalCost;
  analysis.totalGainLossPercent = analysis.totalCost > 0 ? (analysis.totalGainLoss / analysis.totalCost) * 100 : 0;
  
  // Sort positions by current value (largest first)
  analysis.positions.sort((a, b) => b.currentValue - a.currentValue);
  
  // Generate alerts and recommendations
  analysis.positions.forEach(pos => {
    const positionPercent = (pos.currentValue / analysis.totalValue) * 100;
    
    // Profit-taking alerts
    if (pos.gainLossPercent >= CONFIG.alerts.profitTakePercent) {
      analysis.alerts.push({
        type: 'profit',
        symbol: pos.symbol,
        message: `🎯 ${pos.symbol} up ${pos.gainLossPercent.toFixed(1)}% - Consider taking profits`,
        color: '#10B981'
      });
      analysis.recommendations.push({
        symbol: pos.symbol,
        action: 'CONSIDER SELLING',
        reason: `Up ${pos.gainLossPercent.toFixed(1)}% from cost basis. Lock in gains.`,
        urgency: 'medium'
      });
    }
    
    // Stop-loss alerts
    if (pos.gainLossPercent <= CONFIG.alerts.stopLossPercent) {
      analysis.alerts.push({
        type: 'loss',
        symbol: pos.symbol,
        message: `⚠️ ${pos.symbol} down ${Math.abs(pos.gainLossPercent).toFixed(1)}% - Review position`,
        color: '#EF4444'
      });
      analysis.recommendations.push({
        symbol: pos.symbol,
        action: 'REVIEW',
        reason: `Down ${Math.abs(pos.gainLossPercent).toFixed(1)}%. Evaluate thesis or cut losses.`,
        urgency: 'high'
      });
    }
    
    // Position sizing alerts
    if (positionPercent > CONFIG.alerts.maxPositionPercent) {
      analysis.alerts.push({
        type: 'size',
        symbol: pos.symbol,
        message: `📊 ${pos.symbol} is ${positionPercent.toFixed(1)}% of portfolio - Consider trimming`,
        color: '#F59E0B'
      });
    }
    
    // Technical alerts
    if (pos.rsi >= CONFIG.alerts.rsiOverbought) {
      analysis.alerts.push({
        type: 'technical',
        symbol: pos.symbol,
        message: `📈 ${pos.symbol} RSI ${pos.rsi.toFixed(0)} - Overbought territory`,
        color: '#8B5CF6'
      });
      analysis.recommendations.push({
        symbol: pos.symbol,
        action: 'CAUTION',
        reason: `RSI at ${pos.rsi.toFixed(0)} indicates overbought. May see pullback.`,
        urgency: 'low'
      });
    }
    
    if (pos.rsi <= CONFIG.alerts.rsiOversold) {
      analysis.alerts.push({
        type: 'technical',
        symbol: pos.symbol,
        message: `📉 ${pos.symbol} RSI ${pos.rsi.toFixed(0)} - Oversold territory`,
        color: '#3B82F6'
      });
      analysis.recommendations.push({
        symbol: pos.symbol,
        action: 'OPPORTUNITY',
        reason: `RSI at ${pos.rsi.toFixed(0)} indicates oversold. Consider adding if thesis intact.`,
        urgency: 'medium'
      });
    }
    
    // Volume spike alert
    if (pos.avgVolume > 0 && pos.volume / pos.avgVolume >= CONFIG.alerts.highVolumeMultiple) {
      analysis.alerts.push({
        type: 'volume',
        symbol: pos.symbol,
        message: `🔥 ${pos.symbol} volume ${(pos.volume / pos.avgVolume).toFixed(1)}x average`,
        color: '#EC4899'
      });
    }
    
    // Moving average signals
    if (pos.price > pos.fiftyDayMA && pos.fiftyDayMA > pos.twoHundredDayMA && pos.fiftyDayMA > 0) {
      // Golden cross territory
      analysis.recommendations.push({
        symbol: pos.symbol,
        action: 'BULLISH',
        reason: 'Price above 50 DMA, 50 DMA above 200 DMA. Trend is up.',
        urgency: 'info'
      });
    } else if (pos.price < pos.fiftyDayMA && pos.fiftyDayMA < pos.twoHundredDayMA && pos.twoHundredDayMA > 0) {
      // Death cross territory
      analysis.recommendations.push({
        symbol: pos.symbol,
        action: 'BEARISH',
        reason: 'Price below 50 DMA, 50 DMA below 200 DMA. Trend is down.',
        urgency: 'medium'
      });
    }
  });
  
  // Sector concentration warnings
  Object.entries(analysis.sectorAllocation).forEach(([sector, value]) => {
    const sectorPercent = (value / analysis.totalValue) * 100;
    if (sectorPercent > 50) {
      analysis.alerts.push({
        type: 'diversification',
        symbol: sector,
        message: `⚖️ ${sector} is ${sectorPercent.toFixed(0)}% of portfolio - Heavy concentration`,
        color: '#F59E0B'
      });
    }
  });
  
  return analysis;
}

// ============================================================================
// EMAIL FORMATTING
// ============================================================================

function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  return num.toLocaleString('en-US', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
}

function formatCurrency(num) {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  const prefix = num >= 0 ? '+$' : '-$';
  return prefix + Math.abs(num).toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

function formatLargeNumber(num) {
  if (num === null || num === undefined || isNaN(num) || num === 0) return 'N/A';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

function formatVolume(num) {
  if (num === null || num === undefined || isNaN(num) || num === 0) return 'N/A';
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString();
}

function getChangeColor(change) {
  if (change > 0) return '#10B981';
  if (change < 0) return '#EF4444';
  return '#6B7280';
}

function getChangeArrow(change) {
  if (change > 0) return '▲';
  if (change < 0) return '▼';
  return '—';
}

function getRSIColor(rsi) {
  if (rsi >= 70) return '#EF4444';
  if (rsi <= 30) return '#10B981';
  return '#6B7280';
}

function getActionColor(action) {
  switch (action) {
    case 'CONSIDER SELLING': return '#F59E0B';
    case 'REVIEW': return '#EF4444';
    case 'CAUTION': return '#F59E0B';
    case 'OPPORTUNITY': return '#10B981';
    case 'BULLISH': return '#10B981';
    case 'BEARISH': return '#EF4444';
    default: return '#6B7280';
  }
}

function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

function generateEmailHTML(analysis, indices, news = { marketNews: [], stockNews: {} }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const sp500 = indices.find(i => i.symbol === '^GSPC');
  const vix = indices.find(i => i.symbol === '^VIX');
  const smh = indices.find(i => i.symbol === 'SMH');
  
  let marketSentiment = 'Neutral';
  let sentimentColor = '#6B7280';
  
  if (sp500 && sp500.changePercent > 0.5) {
    marketSentiment = 'Bullish';
    sentimentColor = '#10B981';
  } else if (sp500 && sp500.changePercent < -0.5) {
    marketSentiment = 'Bearish';
    sentimentColor = '#EF4444';
  }
  
  if (vix && vix.price > 25) {
    marketSentiment = 'High Volatility';
    sentimentColor = '#F59E0B';
  }

  // Calculate sector allocation percentages
  const sectorData = Object.entries(analysis.sectorAllocation)
    .map(([sector, value]) => ({
      sector,
      value,
      percent: (value / analysis.totalValue) * 100
    }))
    .sort((a, b) => b.percent - a.percent);
  
  // Generate news HTML sections
  const hasMarketNews = news.marketNews && news.marketNews.length > 0;
  const hasStockNews = news.stockNews && Object.keys(news.stockNews).length > 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Personal Portfolio Briefing</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F3F4F6; line-height: 1.6;">
  
  <div style="max-width: 750px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">📊 Personal Portfolio Briefing</h1>
      <p style="margin: 0; font-size: 18px; opacity: 0.9;">Daily Market & Position Analysis</p>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.8;">${dateStr}</p>
    </div>
    
    <!-- Portfolio Summary -->
    <div style="background: linear-gradient(135deg, #1F2937 0%, #374151 100%); color: white; padding: 25px;">
      <h2 style="margin: 0 0 20px 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8;">💰 Portfolio Summary</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; width: 33%;">
            <div style="font-size: 12px; opacity: 0.7;">Total Value</div>
            <div style="font-size: 28px; font-weight: 700;">$${formatNumber(analysis.totalValue, 0)}</div>
          </td>
          <td style="padding: 10px 0; width: 33%; text-align: center;">
            <div style="font-size: 12px; opacity: 0.7;">Total P/L</div>
            <div style="font-size: 24px; font-weight: 700; color: ${getChangeColor(analysis.totalGainLoss)};">
              ${formatCurrency(analysis.totalGainLoss)}
              <span style="font-size: 14px;">(${analysis.totalGainLossPercent >= 0 ? '+' : ''}${formatNumber(analysis.totalGainLossPercent)}%)</span>
            </div>
          </td>
          <td style="padding: 10px 0; width: 33%; text-align: right;">
            <div style="font-size: 12px; opacity: 0.7;">Today's Change</div>
            <div style="font-size: 24px; font-weight: 700; color: ${getChangeColor(analysis.dayChange)};">
              ${formatCurrency(analysis.dayChange)}
            </div>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Alerts Section -->
    ${analysis.alerts.length > 0 ? `
    <div style="background: #FEF3C7; padding: 20px; border-left: 4px solid #F59E0B;">
      <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #92400E; text-transform: uppercase;">🚨 Alerts & Signals (${analysis.alerts.length})</h3>
      ${analysis.alerts.map(alert => `
        <div style="margin-bottom: 8px; padding: 8px 12px; background: white; border-radius: 6px; border-left: 3px solid ${alert.color};">
          <span style="font-size: 13px; color: #374151;">${alert.message}</span>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <!-- Recommendations Section -->
    ${analysis.recommendations.length > 0 ? `
    <div style="background: white; padding: 20px; border-bottom: 1px solid #E5E7EB;">
      <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #374151; text-transform: uppercase;">💡 Recommendations</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #F9FAFB;">
          <th style="padding: 8px; text-align: left; font-size: 11px; color: #6B7280;">Symbol</th>
          <th style="padding: 8px; text-align: left; font-size: 11px; color: #6B7280;">Action</th>
          <th style="padding: 8px; text-align: left; font-size: 11px; color: #6B7280;">Reason</th>
        </tr>
        ${analysis.recommendations.slice(0, 8).map(rec => `
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 10px 8px; font-weight: 600; color: #1F2937;">${rec.symbol}</td>
            <td style="padding: 10px 8px;">
              <span style="background: ${getActionColor(rec.action)}20; color: ${getActionColor(rec.action)}; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${rec.action}</span>
            </td>
            <td style="padding: 10px 8px; font-size: 12px; color: #6B7280;">${rec.reason}</td>
          </tr>
        `).join('')}
      </table>
    </div>
    ` : ''}
    
    <!-- Market Overview -->
    <div style="background: white; padding: 25px; border-bottom: 1px solid #E5E7EB;">
      <h2 style="margin: 0 0 15px 0; font-size: 16px; color: #374151; border-bottom: 2px solid #4F46E5; padding-bottom: 8px;">
        📈 Market Overview
        <span style="float: right; font-size: 14px; font-weight: normal; color: ${sentimentColor};">${marketSentiment}</span>
      </h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #F9FAFB;">
          <th style="padding: 10px; text-align: left; font-size: 12px; color: #6B7280;">Index</th>
          <th style="padding: 10px; text-align: right; font-size: 12px; color: #6B7280;">Price</th>
          <th style="padding: 10px; text-align: right; font-size: 12px; color: #6B7280;">Change</th>
        </tr>
        ${indices.map(index => `
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 12px 10px; font-weight: 500; color: #374151;">${index.name}</td>
            <td style="padding: 12px 10px; text-align: right; font-weight: 600; color: #111827;">${index.price > 0 ? formatNumber(index.price, index.symbol === '^VIX' ? 2 : 0) : '—'}</td>
            <td style="padding: 12px 10px; text-align: right; font-weight: 600; color: ${getChangeColor(index.changePercent)};">
              ${index.price > 0 ? `${getChangeArrow(index.changePercent)} ${formatNumber(Math.abs(index.changePercent))}%` : '—'}
            </td>
          </tr>
        `).join('')}
      </table>
    </div>
    
    <!-- Daily News & Analysis -->
    ${hasMarketNews ? `
    <div style="background: white; padding: 25px; border-bottom: 1px solid #E5E7EB;">
      <h2 style="margin: 0 0 20px 0; font-size: 16px; color: #374151; border-bottom: 2px solid #4F46E5; padding-bottom: 8px;">
        📰 Daily News & Analysis
      </h2>
      
      ${news.marketNews.slice(0, 6).map(item => `
        <div style="margin-bottom: 16px; padding: 15px; background: #F9FAFB; border-radius: 8px; border-left: 4px solid ${item.sentiment.color};">
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <div style="flex: 1;">
              <div style="font-size: 14px; font-weight: 600; color: #1F2937; margin-bottom: 6px; line-height: 1.4;">
                ${item.sentiment.icon} ${item.title}
              </div>
              <div style="font-size: 12px; color: #6B7280; margin-bottom: 8px;">
                ${item.publisher} • ${formatTimeAgo(item.publishedAt)}
                ${item.affectedStocks.length > 0 ? `<span style="margin-left: 8px; background: ${item.sentiment.color}15; color: ${item.sentiment.color}; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500;">Affects: ${item.affectedStocks.join(', ')}</span>` : ''}
              </div>
              <div style="font-size: 13px; color: #4B5563; background: white; padding: 10px 12px; border-radius: 6px; border: 1px solid #E5E7EB;">
                <strong style="color: ${item.sentiment.color};">💡 Interpretation:</strong> ${item.interpretation}
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <!-- Stock-Specific News -->
    ${hasStockNews ? `
    <div style="background: white; padding: 25px; border-bottom: 1px solid #E5E7EB;">
      <h2 style="margin: 0 0 20px 0; font-size: 16px; color: #374151; border-bottom: 2px solid #4F46E5; padding-bottom: 8px;">
        🎯 Your Holdings in the News
      </h2>
      
      ${Object.entries(news.stockNews).map(([symbol, articles]) => `
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #4F46E5; font-weight: 600;">
            ${symbol} News
          </h3>
          ${articles.slice(0, 2).map(article => `
            <div style="margin-bottom: 10px; padding: 12px; background: #F9FAFB; border-radius: 6px; border-left: 3px solid ${article.sentiment.color};">
              <div style="font-size: 13px; color: #1F2937; font-weight: 500; margin-bottom: 4px;">
                ${article.sentiment.icon} ${article.title}
              </div>
              <div style="font-size: 11px; color: #6B7280;">
                ${article.publisher} • ${formatTimeAgo(article.publishedAt)}
                <span style="margin-left: 8px; color: ${article.sentiment.color}; font-weight: 500; text-transform: uppercase; font-size: 10px;">${article.sentiment.sentiment}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <!-- Sector Allocation -->
    <div style="background: white; padding: 25px; border-bottom: 1px solid #E5E7EB;">
      <h2 style="margin: 0 0 15px 0; font-size: 16px; color: #374151; border-bottom: 2px solid #4F46E5; padding-bottom: 8px;">⚖️ Sector Allocation</h2>
      
      ${sectorData.map(s => `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 13px; color: #374151; font-weight: 500;">${s.sector}</span>
            <span style="font-size: 13px; color: #6B7280;">${formatNumber(s.percent, 1)}% ($${formatNumber(s.value, 0)})</span>
          </div>
          <div style="background: #E5E7EB; border-radius: 4px; height: 8px; overflow: hidden;">
            <div style="background: ${s.percent > 40 ? '#F59E0B' : '#4F46E5'}; height: 100%; width: ${Math.min(s.percent, 100)}%;"></div>
          </div>
        </div>
      `).join('')}
    </div>
    
    <!-- Position Details -->
    <div style="background: white; padding: 25px;">
      <h2 style="margin: 0 0 20px 0; font-size: 16px; color: #374151; border-bottom: 2px solid #4F46E5; padding-bottom: 8px;">📋 Position Details</h2>
      
      ${analysis.positions.map(pos => {
        const positionPercent = (pos.currentValue / analysis.totalValue) * 100;
        const distFromHigh = pos.fiftyTwoWeekHigh > 0 ? ((pos.price - pos.fiftyTwoWeekHigh) / pos.fiftyTwoWeekHigh * 100) : 0;
        
        return `
        <div style="border: 1px solid #E5E7EB; border-radius: 10px; margin-bottom: 15px; overflow: hidden;">
          
          <!-- Position Header -->
          <div style="background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); padding: 15px 20px; border-bottom: 1px solid #E5E7EB;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="vertical-align: top;">
                  <h3 style="margin: 0; font-size: 20px; color: #1F2937;">
                    ${pos.symbol}
                    <span style="font-size: 12px; font-weight: normal; color: #6B7280; margin-left: 8px;">${pos.sector}</span>
                  </h3>
                  <p style="margin: 3px 0 0 0; color: #6B7280; font-size: 13px;">${pos.name} • ${pos.shares} shares @ $${formatNumber(pos.costBasis)}</p>
                </td>
                <td style="text-align: right; vertical-align: top;">
                  <div style="font-size: 24px; font-weight: 700; color: #111827;">$${formatNumber(pos.price)}</div>
                  <div style="font-size: 14px; font-weight: 600; color: ${getChangeColor(pos.changePercent)};">
                    ${getChangeArrow(pos.changePercent)} ${formatNumber(Math.abs(pos.changePercent))}% today
                  </div>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- P/L Row -->
          <div style="padding: 15px 20px; background: ${pos.gainLossPercent >= 0 ? '#ECFDF5' : '#FEF2F2'};">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 25%;">
                  <div style="font-size: 11px; color: #6B7280;">Position Value</div>
                  <div style="font-size: 16px; font-weight: 600; color: #374151;">$${formatNumber(pos.currentValue, 0)}</div>
                </td>
                <td style="width: 25%;">
                  <div style="font-size: 11px; color: #6B7280;">Cost Basis</div>
                  <div style="font-size: 16px; font-weight: 600; color: #374151;">$${formatNumber(pos.costValue, 0)}</div>
                </td>
                <td style="width: 25%;">
                  <div style="font-size: 11px; color: #6B7280;">Total P/L</div>
                  <div style="font-size: 16px; font-weight: 700; color: ${getChangeColor(pos.gainLoss)};">
                    ${formatCurrency(pos.gainLoss)}
                  </div>
                </td>
                <td style="width: 25%; text-align: right;">
                  <div style="font-size: 11px; color: #6B7280;">Return</div>
                  <div style="font-size: 16px; font-weight: 700; color: ${getChangeColor(pos.gainLossPercent)};">
                    ${pos.gainLossPercent >= 0 ? '+' : ''}${formatNumber(pos.gainLossPercent)}%
                  </div>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- Technical Indicators -->
          <div style="padding: 15px 20px; background: white; border-top: 1px solid #E5E7EB;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 20%; padding: 5px 0;">
                  <div style="font-size: 10px; color: #6B7280; text-transform: uppercase;">RSI (14)</div>
                  <div style="font-size: 14px; font-weight: 600; color: ${getRSIColor(pos.rsi)};">${formatNumber(pos.rsi, 0)}</div>
                </td>
                <td style="width: 20%; padding: 5px 0;">
                  <div style="font-size: 10px; color: #6B7280; text-transform: uppercase;">50 DMA</div>
                  <div style="font-size: 14px; font-weight: 500; color: ${pos.price > pos.fiftyDayMA ? '#10B981' : '#EF4444'};">$${formatNumber(pos.fiftyDayMA)}</div>
                </td>
                <td style="width: 20%; padding: 5px 0;">
                  <div style="font-size: 10px; color: #6B7280; text-transform: uppercase;">200 DMA</div>
                  <div style="font-size: 14px; font-weight: 500; color: ${pos.price > pos.twoHundredDayMA ? '#10B981' : '#EF4444'};">$${formatNumber(pos.twoHundredDayMA)}</div>
                </td>
                <td style="width: 20%; padding: 5px 0;">
                  <div style="font-size: 10px; color: #6B7280; text-transform: uppercase;">From 52W High</div>
                  <div style="font-size: 14px; font-weight: 500; color: ${distFromHigh >= -10 ? '#10B981' : '#EF4444'};">${formatNumber(distFromHigh)}%</div>
                </td>
                <td style="width: 20%; padding: 5px 0; text-align: right;">
                  <div style="font-size: 10px; color: #6B7280; text-transform: uppercase;">% of Portfolio</div>
                  <div style="font-size: 14px; font-weight: 600; color: ${positionPercent > 20 ? '#F59E0B' : '#374151'};">${formatNumber(positionPercent, 1)}%</div>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- Performance Row -->
          <div style="padding: 12px 20px; background: #F9FAFB; border-top: 1px solid #E5E7EB;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 25%; text-align: center;">
                  <div style="font-size: 10px; color: #6B7280;">1 Week</div>
                  <div style="font-size: 13px; font-weight: 600; color: ${getChangeColor(pos.weekReturn)};">${formatNumber(pos.weekReturn)}%</div>
                </td>
                <td style="width: 25%; text-align: center;">
                  <div style="font-size: 10px; color: #6B7280;">1 Month</div>
                  <div style="font-size: 13px; font-weight: 600; color: ${getChangeColor(pos.monthReturn)};">${formatNumber(pos.monthReturn)}%</div>
                </td>
                <td style="width: 25%; text-align: center;">
                  <div style="font-size: 10px; color: #6B7280;">3 Month</div>
                  <div style="font-size: 13px; font-weight: 600; color: ${getChangeColor(pos.threeMonthReturn)};">${formatNumber(pos.threeMonthReturn)}%</div>
                </td>
                <td style="width: 25%; text-align: center;">
                  <div style="font-size: 10px; color: #6B7280;">YTD</div>
                  <div style="font-size: 13px; font-weight: 600; color: ${getChangeColor(pos.ytdReturn)};">${formatNumber(pos.ytdReturn)}%</div>
                </td>
              </tr>
            </table>
          </div>
          
        </div>
        `;
      }).join('')}
    </div>
    
    <!-- Footer -->
    <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 25px; border-radius: 0 0 12px 12px; text-align: center;">
      <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">
        📈 Data: Yahoo Finance • Updated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
      </p>
      <p style="margin: 0; font-size: 12px; opacity: 0.7;">
        This email is for informational purposes only. Not financial advice.
        <br>Past performance does not guarantee future results. Always do your own research.
      </p>
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
        <p style="margin: 0; font-size: 11px; opacity: 0.6;">
          Personal Portfolio Briefing • Automated Daily Analysis
        </p>
      </div>
    </div>
    
  </div>
</body>
</html>
  `;
}

function generatePlainText(analysis, indices, news = { marketNews: [], stockNews: {} }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  let text = `PERSONAL PORTFOLIO BRIEFING\n${dateStr}\n\n`;
  
  text += `PORTFOLIO SUMMARY\n`;
  text += `Total Value: $${formatNumber(analysis.totalValue, 0)}\n`;
  text += `Total P/L: ${formatCurrency(analysis.totalGainLoss)} (${formatNumber(analysis.totalGainLossPercent)}%)\n`;
  text += `Today's Change: ${formatCurrency(analysis.dayChange)}\n\n`;
  
  if (analysis.alerts.length > 0) {
    text += `ALERTS\n`;
    analysis.alerts.forEach(alert => {
      text += `• ${alert.message}\n`;
    });
    text += `\n`;
  }
  
  text += `MARKET OVERVIEW\n`;
  indices.forEach(index => {
    const arrow = index.changePercent > 0 ? '+' : '';
    text += `${index.name}: ${index.price > 0 ? formatNumber(index.price, 0) : 'N/A'} (${arrow}${formatNumber(index.changePercent)}%)\n`;
  });

  // Add news section
  if (news.marketNews && news.marketNews.length > 0) {
    text += `\nDAILY NEWS & ANALYSIS\n`;
    news.marketNews.slice(0, 5).forEach(item => {
      text += `\n• ${item.title}\n`;
      text += `  Source: ${item.publisher}\n`;
      text += `  Interpretation: ${item.interpretation}\n`;
    });
  }

  text += `\nPOSITIONS\n`;
  analysis.positions.forEach(pos => {
    text += `\n${pos.symbol} - ${pos.shares} shares\n`;
    text += `Price: $${formatNumber(pos.price)} | Value: $${formatNumber(pos.currentValue, 0)}\n`;
    text += `P/L: ${formatCurrency(pos.gainLoss)} (${formatNumber(pos.gainLossPercent)}%)\n`;
  });

  return text;
}

// ============================================================================
// EMAIL SENDING
// ============================================================================

async function sendEmail(htmlContent, plainTextContent, analysis) {
  const emailUser = process.env.PERSONAL_EMAIL_USER;
  const emailPassword = process.env.PERSONAL_EMAIL_APP_PASSWORD;

  if (!emailUser || !emailPassword) {
    throw new Error('Email credentials not configured. Set PERSONAL_EMAIL_USER and PERSONAL_EMAIL_APP_PASSWORD.');
  }

  console.log('📧 Configuring email transport...');
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword.replace(/\s/g, ''),
    },
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  const dayChange = analysis.dayChange >= 0 ? `+$${formatNumber(analysis.dayChange, 0)}` : `-$${formatNumber(Math.abs(analysis.dayChange), 0)}`;
  const alertCount = analysis.alerts.length > 0 ? ` | ${analysis.alerts.length} Alerts` : '';

  const mailOptions = {
    from: `"Portfolio Briefing" <${emailUser}>`,
    to: CONFIG.recipient,
    subject: `📊 Portfolio: $${formatNumber(analysis.totalValue, 0)} (${dayChange}) - ${dateStr}${alertCount}`,
    text: plainTextContent,
    html: htmlContent,
  };

  console.log(`📤 Sending email to ${CONFIG.recipient}...`);
  
  const result = await transporter.sendMail(mailOptions);
  console.log('✅ Email sent successfully!');
  console.log(`   Message ID: ${result.messageId}`);
  
  return result;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 Personal Portfolio - Daily Market Email');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`📬 Recipient: ${CONFIG.recipient}`);
  console.log(`📈 Positions: ${CONFIG.portfolio.length} stocks`);
  console.log('───────────────────────────────────────────────────────────\n');

  try {
    // Fetch market indices
    console.log('📈 Fetching market indices...');
    const indices = await getMarketIndices();
    const validIndices = indices.filter(i => i.price > 0);
    console.log(`   ✓ Loaded ${validIndices.length}/${indices.length} indices\n`);

    // Fetch stock data for portfolio
    console.log('📊 Fetching portfolio data...');
    const stocksData = [];
    for (const position of CONFIG.portfolio) {
      console.log(`   • Fetching ${position.symbol}...`);
      const data = await getYahooQuote(position.symbol);
      if (data && data.price > 0) {
        stocksData.push(data);
      } else {
        console.log(`     ✗ No data for ${position.symbol}`);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log(`   ✓ Loaded ${stocksData.length}/${CONFIG.portfolio.length} positions\n`);

    // Analyze portfolio
    console.log('🔍 Analyzing portfolio...');
    const analysis = analyzePortfolio(stocksData);
    console.log(`   ✓ Total Value: $${formatNumber(analysis.totalValue, 0)}`);
    console.log(`   ✓ Total P/L: ${formatCurrency(analysis.totalGainLoss)} (${formatNumber(analysis.totalGainLossPercent)}%)`);
    console.log(`   ✓ Alerts: ${analysis.alerts.length}`);
    console.log(`   ✓ Recommendations: ${analysis.recommendations.length}\n`);

    // Fetch news
    const portfolioSymbols = CONFIG.portfolio.map(p => p.symbol);
    const news = await fetchAllNews(portfolioSymbols);
    console.log(`   ✓ Market news: ${news.marketNews.length} articles`);
    console.log(`   ✓ Stock news: ${Object.keys(news.stockNews).length} stocks with news\n`);

    console.log('📝 Generating email content...');
    const htmlContent = generateEmailHTML(analysis, indices, news);
    const plainTextContent = generatePlainText(analysis, indices, news);
    console.log('   ✓ Email content generated\n');

    await sendEmail(htmlContent, plainTextContent, analysis);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ Personal portfolio email completed!');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
