/**
 * Daily Market Email for Old Logan Capital
 * 
 * Sends a beautifully formatted daily market briefing covering:
 * - Nebius Group (NBIS)
 * - MindMed (MNMD)
 * - Planet Labs (PL)
 * 
 * Uses direct Yahoo Finance API calls for reliable data
 */

const nodemailer = require('nodemailer');
const https = require('https');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  recipient: 'OldLoganCapital@gmail.com',
  sender: process.env.EMAIL_USER || 'OldLoganCapital@gmail.com',
  stocks: [
    { symbol: 'NBIS', name: 'Nebius Group', sector: 'Technology/AI Infrastructure' },
    { symbol: 'MNMD', name: 'MindMed', sector: 'Healthcare/Psychedelics' },
    { symbol: 'PL', name: 'Planet Labs', sector: 'Technology/Space Data' }
  ],
  marketIndices: [
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^DJI', name: 'Dow Jones' },
    { symbol: '^IXIC', name: 'NASDAQ' },
    { symbol: '^VIX', name: 'VIX (Fear Index)' }
  ]
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

async function getYahooQuote(symbol) {
  try {
    // Use Yahoo Finance v8 API
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
    
    // Get current price info
    const currentPrice = meta.regularMarketPrice || 0;
    
    // IMPORTANT: Use previousClose (yesterday's close), NOT chartPreviousClose (start of chart range)
    const previousClose = meta.previousClose || meta.regularMarketPreviousClose || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
    
    console.log(`     Price: $${currentPrice}, Prev Close: $${previousClose}, Change: ${changePercent.toFixed(2)}%`);
    
    // Calculate historical performance
    let weekReturn = 0, monthReturn = 0, threeMonthReturn = 0, ytdReturn = 0;
    const closes = quotes.close || [];
    
    if (closes.length > 5) {
      const today = closes[closes.length - 1] || currentPrice;
      
      // Get prices at different periods
      const weekAgoIdx = Math.max(0, closes.length - 5);
      const monthAgoIdx = Math.max(0, closes.length - 22);
      const threeMonthAgoIdx = Math.max(0, closes.length - 66);
      
      const weekAgoPrice = closes[weekAgoIdx] || today;
      const monthAgoPrice = closes[monthAgoIdx] || today;
      const threeMonthAgoPrice = closes[threeMonthAgoIdx] || today;
      
      // YTD - find first trading day of current year
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
    
    // Get high/low from historical data
    const highs = quotes.high || [];
    const lows = quotes.low || [];
    const volumes = quotes.volume || [];
    
    const fiftyTwoWeekHigh = highs.length > 0 ? Math.max(...highs.filter(h => h)) : meta.fiftyTwoWeekHigh || 0;
    const fiftyTwoWeekLow = lows.length > 0 ? Math.min(...lows.filter(l => l)) : meta.fiftyTwoWeekLow || 0;
    
    // Calculate moving averages
    let fiftyDayAvg = 0, twoHundredDayAvg = 0;
    if (closes.length >= 50) {
      const last50 = closes.slice(-50).filter(c => c);
      fiftyDayAvg = last50.reduce((a, b) => a + b, 0) / last50.length;
    }
    if (closes.length >= 200) {
      const last200 = closes.slice(-200).filter(c => c);
      twoHundredDayAvg = last200.reduce((a, b) => a + b, 0) / last200.length;
    }
    
    // Get today's data
    const dayHigh = highs.length > 0 ? highs[highs.length - 1] || 0 : 0;
    const dayLow = lows.length > 0 ? lows[lows.length - 1] || 0 : 0;
    const volume = volumes.length > 0 ? volumes[volumes.length - 1] || 0 : 0;
    
    // Calculate average volume (last 10 days)
    const last10Volumes = volumes.slice(-10).filter(v => v);
    const avgVolume = last10Volumes.length > 0 ? last10Volumes.reduce((a, b) => a + b, 0) / last10Volumes.length : 0;
    
    console.log(`     ✓ ${symbol}: $${currentPrice.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
    
    return {
      symbol,
      name: meta.shortName || meta.longName || symbol,
      price: currentPrice,
      change,
      changePercent,
      previousClose,
      open: meta.regularMarketOpen || 0,
      dayHigh: meta.regularMarketDayHigh || dayHigh,
      dayLow: meta.regularMarketDayLow || dayLow,
      volume: meta.regularMarketVolume || volume,
      avgVolume,
      marketCap: meta.marketCap || 0,
      fiftyTwoWeekHigh,
      fiftyTwoWeekLow,
      fiftyDayAvg,
      twoHundredDayAvg,
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
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  return results;
}

async function getStockData(symbol) {
  const data = await getYahooQuote(symbol);
  return data;
}

// ============================================================================
// CATALYST DATA
// ============================================================================

function getUpcomingCatalysts() {
  return {
    'NBIS': [
      { event: 'Q4 2025 Earnings Release', date: 'February 2026 (Est.)', importance: 'high' },
      { event: 'AI Infrastructure Expansion Updates', date: 'Ongoing', importance: 'medium' },
      { event: 'Data Center Capacity Announcements', date: 'Q1 2026', importance: 'high' },
      { event: 'Strategic Partnership Updates', date: 'TBA', importance: 'medium' }
    ],
    'MNMD': [
      { event: 'MM120 Phase 2b Trial Results (GAD)', date: 'H1 2026 (Est.)', importance: 'high' },
      { event: 'MM402 Phase 1 Trial Updates', date: 'Q1 2026', importance: 'medium' },
      { event: 'FDA Breakthrough Therapy Designation', date: 'Potential 2026', importance: 'high' },
      { event: 'Q4 2025 Earnings Release', date: 'March 2026 (Est.)', importance: 'medium' }
    ],
    'PL': [
      { event: 'Q4 FY2025 Earnings Release', date: 'January 2026 (Est.)', importance: 'high' },
      { event: 'Government Contract Renewals', date: 'Ongoing', importance: 'medium' },
      { event: 'Pelican Satellite Constellation Update', date: 'Q1-Q2 2026', importance: 'high' },
      { event: 'New Enterprise Customer Announcements', date: 'TBA', importance: 'medium' }
    ]
  };
}

function getCompanyNotes() {
  return {
    'NBIS': {
      description: 'Nebius Group is a leading AI infrastructure company providing cloud computing and AI services. Spun off from Yandex, it focuses on GPU cloud, AI development tools, and data labeling services.',
      keyPoints: [
        'Major AI infrastructure play with NVIDIA partnership',
        'Rapidly expanding GPU cloud capacity',
        'Strong positioning in European AI market',
        'Benefiting from enterprise AI adoption wave'
      ],
      watchFor: 'GPU capacity utilization rates, new customer wins, and AI partnership announcements'
    },
    'MNMD': {
      description: 'MindMed is a clinical-stage biopharmaceutical company developing psychedelic-inspired therapies for brain health disorders including anxiety, ADHD, and depression.',
      keyPoints: [
        'Lead candidate MM120 (LSD) in Phase 2b for anxiety',
        'Diversified pipeline across multiple indications',
        'Growing acceptance of psychedelic medicine',
        'Potential breakthrough therapy designation'
      ],
      watchFor: 'Clinical trial readouts, FDA interactions, and cash runway updates'
    },
    'PL': {
      description: 'Planet Labs operates the largest constellation of Earth-imaging satellites, providing daily global imagery and geospatial data to government, agricultural, and commercial customers.',
      keyPoints: [
        'Largest satellite imaging fleet in the world',
        'Growing recurring revenue from government contracts',
        'Expanding commercial and agricultural applications',
        'Next-gen Pelican satellites enhance capabilities'
      ],
      watchFor: 'Contract wins, ARR growth, and path to profitability'
    }
  };
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

function getSignalStrength(price, fiftyTwoWeekHigh, fiftyTwoWeekLow, fiftyDayAvg, twoHundredDayAvg) {
  let signals = [];
  
  if (!price || price === 0) return signals;
  
  const range = fiftyTwoWeekHigh - fiftyTwoWeekLow;
  const position = range > 0 ? (price - fiftyTwoWeekLow) / range : 0.5;
  
  if (position >= 0.9) signals.push({ text: 'Near 52W High', color: '#10B981' });
  else if (position <= 0.1) signals.push({ text: 'Near 52W Low', color: '#EF4444' });
  
  if (fiftyDayAvg > 0) {
    if (price > fiftyDayAvg) {
      signals.push({ text: 'Above 50 DMA', color: '#10B981' });
    } else {
      signals.push({ text: 'Below 50 DMA', color: '#EF4444' });
    }
  }
  
  if (twoHundredDayAvg > 0) {
    if (price > twoHundredDayAvg) {
      signals.push({ text: 'Above 200 DMA', color: '#10B981' });
    } else {
      signals.push({ text: 'Below 200 DMA', color: '#EF4444' });
    }
  }
  
  if (fiftyDayAvg > 0 && twoHundredDayAvg > 0) {
    if (fiftyDayAvg > twoHundredDayAvg) {
      signals.push({ text: 'Golden Cross', color: '#F59E0B' });
    } else {
      signals.push({ text: 'Death Cross', color: '#8B5CF6' });
    }
  }
  
  return signals;
}

function generateEmailHTML(stocksData, indices, catalysts, notes) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const sp500 = indices.find(i => i.symbol === '^GSPC');
  const vix = indices.find(i => i.symbol === '^VIX');
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

  const hasMarketData = indices.some(i => i.price > 0);
  const hasStockData = stocksData.some(s => s !== null && s.price > 0);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OLC Daily Market Briefing</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F3F4F6; line-height: 1.6;">
  
  <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1E3A5F 0%, #2D5A87 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">🦬 Old Logan Capital</h1>
      <p style="margin: 0; font-size: 18px; opacity: 0.9;">Daily Market Briefing</p>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.8;">${dateStr}</p>
    </div>
    
    <!-- Market Overview -->
    <div style="background: white; padding: 25px; border-bottom: 1px solid #E5E7EB;">
      <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #374151; border-bottom: 2px solid #1E3A5F; padding-bottom: 8px;">
        📊 Market Overview
        <span style="float: right; font-size: 14px; font-weight: normal; color: ${sentimentColor};">${marketSentiment}</span>
      </h2>
      
      ${!hasMarketData ? `
      <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
        <p style="margin: 0; color: #92400E; font-size: 14px;">⚠️ Market data temporarily unavailable. Markets may be closed.</p>
      </div>
      ` : ''}
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #F9FAFB;">
          <th style="padding: 10px; text-align: left; font-size: 13px; color: #6B7280; font-weight: 600;">Index</th>
          <th style="padding: 10px; text-align: right; font-size: 13px; color: #6B7280; font-weight: 600;">Price</th>
          <th style="padding: 10px; text-align: right; font-size: 13px; color: #6B7280; font-weight: 600;">Change</th>
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
    
    <!-- Stock Coverage -->
    <div style="background: white; padding: 25px;">
      <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #374151; border-bottom: 2px solid #1E3A5F; padding-bottom: 8px;">
        🎯 Portfolio Watchlist
      </h2>
      
      ${!hasStockData ? `
      <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
        <p style="margin: 0; color: #92400E; font-size: 14px;">⚠️ Stock data temporarily unavailable.</p>
      </div>
      ` : ''}
      
      ${stocksData.filter(s => s !== null).map(stock => {
        const stockConfig = CONFIG.stocks.find(s => s.symbol === stock.symbol);
        const stockCatalysts = catalysts[stock.symbol] || [];
        const stockNotes = notes[stock.symbol] || {};
        const signals = getSignalStrength(stock.price, stock.fiftyTwoWeekHigh, stock.fiftyTwoWeekLow, stock.fiftyDayAvg, stock.twoHundredDayAvg);
        
        const distFromHigh = stock.fiftyTwoWeekHigh > 0 
          ? ((stock.price - stock.fiftyTwoWeekHigh) / stock.fiftyTwoWeekHigh * 100)
          : 0;
        
        const volumeRatio = stock.avgVolume > 0 ? stock.volume / stock.avgVolume : 1;
        let volumeSignal = '';
        if (volumeRatio > 1.5) volumeSignal = '🔥 High Volume';
        else if (volumeRatio < 0.5) volumeSignal = '😴 Low Volume';
        
        return `
        <div style="border: 1px solid #E5E7EB; border-radius: 10px; margin-bottom: 20px; overflow: hidden;">
          
          <!-- Stock Header -->
          <div style="background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); padding: 20px; border-bottom: 1px solid #E5E7EB;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="vertical-align: top;">
                  <h3 style="margin: 0; font-size: 22px; color: #1E3A5F;">
                    ${stock.symbol}
                    <span style="font-size: 14px; font-weight: normal; color: #6B7280; margin-left: 8px;">${stockConfig?.sector || ''}</span>
                  </h3>
                  <p style="margin: 5px 0 0 0; color: #6B7280; font-size: 14px;">${stock.name}</p>
                </td>
                <td style="text-align: right; vertical-align: top;">
                  <div style="font-size: 28px; font-weight: 700; color: #111827;">$${formatNumber(stock.price)}</div>
                  <div style="font-size: 16px; font-weight: 600; color: ${getChangeColor(stock.changePercent)};">
                    ${getChangeArrow(stock.changePercent)} $${formatNumber(Math.abs(stock.change))} (${formatNumber(Math.abs(stock.changePercent))}%)
                  </div>
                </td>
              </tr>
            </table>
            
            ${signals.length > 0 ? `
            <div style="margin-top: 12px;">
              ${signals.map(s => `<span style="display: inline-block; background: ${s.color}15; color: ${s.color}; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-right: 6px; margin-top: 4px;">${s.text}</span>`).join('')}
              ${volumeSignal ? `<span style="display: inline-block; background: #6366F115; color: #6366F1; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-right: 6px; margin-top: 4px;">${volumeSignal}</span>` : ''}
            </div>
            ` : ''}
          </div>
          
          <!-- Key Metrics Grid -->
          <div style="padding: 15px 20px; background: white;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; width: 25%;">
                  <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">Day Range</div>
                  <div style="font-size: 14px; color: #374151; font-weight: 500;">$${formatNumber(stock.dayLow)} - $${formatNumber(stock.dayHigh)}</div>
                </td>
                <td style="padding: 8px 0; width: 25%;">
                  <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">52W Range</div>
                  <div style="font-size: 14px; color: #374151; font-weight: 500;">$${formatNumber(stock.fiftyTwoWeekLow)} - $${formatNumber(stock.fiftyTwoWeekHigh)}</div>
                </td>
                <td style="padding: 8px 0; width: 25%;">
                  <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">From 52W High</div>
                  <div style="font-size: 14px; color: ${distFromHigh >= 0 ? '#10B981' : '#EF4444'}; font-weight: 500;">${formatNumber(distFromHigh)}%</div>
                </td>
                <td style="padding: 8px 0; width: 25%;">
                  <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">Market Cap</div>
                  <div style="font-size: 14px; color: #374151; font-weight: 500;">${formatLargeNumber(stock.marketCap)}</div>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">Volume</div>
                  <div style="font-size: 14px; color: #374151; font-weight: 500;">${formatVolume(stock.volume)}</div>
                </td>
                <td style="padding: 8px 0;">
                  <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">Avg Volume</div>
                  <div style="font-size: 14px; color: #374151; font-weight: 500;">${formatVolume(stock.avgVolume)}</div>
                </td>
                <td style="padding: 8px 0;">
                  <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">50 DMA</div>
                  <div style="font-size: 14px; color: #374151; font-weight: 500;">$${formatNumber(stock.fiftyDayAvg)}</div>
                </td>
                <td style="padding: 8px 0;">
                  <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">200 DMA</div>
                  <div style="font-size: 14px; color: #374151; font-weight: 500;">$${formatNumber(stock.twoHundredDayAvg)}</div>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- Performance Row -->
          <div style="padding: 15px 20px; background: #F9FAFB; border-top: 1px solid #E5E7EB;">
            <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Performance</div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 0; width: 25%; text-align: center;">
                  <div style="font-size: 11px; color: #6B7280;">1 Week</div>
                  <div style="font-size: 15px; font-weight: 600; color: ${getChangeColor(stock.weekReturn)};">${formatNumber(stock.weekReturn)}%</div>
                </td>
                <td style="padding: 0; width: 25%; text-align: center;">
                  <div style="font-size: 11px; color: #6B7280;">1 Month</div>
                  <div style="font-size: 15px; font-weight: 600; color: ${getChangeColor(stock.monthReturn)};">${formatNumber(stock.monthReturn)}%</div>
                </td>
                <td style="padding: 0; width: 25%; text-align: center;">
                  <div style="font-size: 11px; color: #6B7280;">3 Month</div>
                  <div style="font-size: 15px; font-weight: 600; color: ${getChangeColor(stock.threeMonthReturn)};">${formatNumber(stock.threeMonthReturn)}%</div>
                </td>
                <td style="padding: 0; width: 25%; text-align: center;">
                  <div style="font-size: 11px; color: #6B7280;">YTD</div>
                  <div style="font-size: 15px; font-weight: 600; color: ${getChangeColor(stock.ytdReturn)};">${formatNumber(stock.ytdReturn)}%</div>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- Company Notes -->
          ${stockNotes.description ? `
          <div style="padding: 15px 20px; background: white; border-top: 1px solid #E5E7EB;">
            <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">💡 Key Points</div>
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #4B5563; line-height: 1.5;">${stockNotes.description}</p>
            <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #4B5563;">
              ${stockNotes.keyPoints?.map(point => `<li style="margin-bottom: 4px;">${point}</li>`).join('') || ''}
            </ul>
            ${stockNotes.watchFor ? `<p style="margin: 10px 0 0 0; font-size: 12px; color: #6B7280;"><strong>👁️ Watch For:</strong> ${stockNotes.watchFor}</p>` : ''}
          </div>
          ` : ''}
          
          <!-- Catalysts -->
          ${stockCatalysts.length > 0 ? `
          <div style="padding: 15px 20px; background: #FFFBEB; border-top: 1px solid #FDE68A;">
            <div style="font-size: 11px; color: #92400E; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">📅 Upcoming Catalysts</div>
            ${stockCatalysts.map(cat => `
              <div style="margin-bottom: 6px;">
                <span style="font-size: 13px; color: #78350F;">
                  ${cat.importance === 'high' ? '🔴' : '🟡'} ${cat.event}
                </span>
                <span style="font-size: 12px; color: #92400E; font-weight: 500; float: right;">${cat.date}</span>
              </div>
            `).join('')}
          </div>
          ` : ''}
          
        </div>
        `;
      }).join('')}
    </div>
    
    <!-- Footer -->
    <div style="background: #1E3A5F; color: white; padding: 25px; border-radius: 0 0 12px 12px; text-align: center;">
      <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">
        📈 Data provided by Yahoo Finance • Updated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
      </p>
      <p style="margin: 0; font-size: 12px; opacity: 0.7;">
        This email is for informational purposes only. Not financial advice.
        <br>Past performance does not guarantee future results.
      </p>
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
        <p style="margin: 0; font-size: 11px; opacity: 0.6;">
          Old Logan Capital • Automated Daily Briefing
        </p>
      </div>
    </div>
    
  </div>
</body>
</html>
  `;
}

function generatePlainText(stocksData, indices) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  let text = `OLD LOGAN CAPITAL - DAILY MARKET BRIEFING\n${dateStr}\n\n`;
  text += `MARKET OVERVIEW\n`;
  
  indices.forEach(index => {
    const arrow = index.changePercent > 0 ? '+' : '';
    text += `${index.name}: ${index.price > 0 ? formatNumber(index.price, 0) : 'N/A'} (${arrow}${formatNumber(index.changePercent)}%)\n`;
  });

  text += `\nPORTFOLIO WATCHLIST\n`;
  
  stocksData.filter(s => s !== null).forEach(stock => {
    const arrow = stock.changePercent > 0 ? '+' : '';
    text += `\n${stock.symbol} - ${stock.name}\n`;
    text += `Price: $${formatNumber(stock.price)} (${arrow}${formatNumber(stock.changePercent)}%)\n`;
    text += `52W Range: $${formatNumber(stock.fiftyTwoWeekLow)} - $${formatNumber(stock.fiftyTwoWeekHigh)}\n`;
  });

  return text;
}

// ============================================================================
// EMAIL SENDING
// ============================================================================

async function sendEmail(htmlContent, plainTextContent) {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_APP_PASSWORD;

  if (!emailUser || !emailPassword) {
    throw new Error('Email credentials not configured.');
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

  const mailOptions = {
    from: `"Old Logan Capital" <${emailUser}>`,
    to: CONFIG.recipient,
    subject: `🦬 OLC Daily Briefing - ${dateStr} | NBIS, MNMD, PL`,
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
  console.log('🦬 Old Logan Capital - Daily Market Email');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`📬 Recipient: ${CONFIG.recipient}`);
  console.log(`📊 Stocks: ${CONFIG.stocks.map(s => s.symbol).join(', ')}`);
  console.log('───────────────────────────────────────────────────────────\n');

  try {
    // Fetch market indices
    console.log('📈 Fetching market indices...');
    const indices = await getMarketIndices();
    const validIndices = indices.filter(i => i.price > 0);
    console.log(`   ✓ Loaded ${validIndices.length}/${indices.length} indices\n`);

    // Fetch stock data
    console.log('📊 Fetching stock data...');
    const stocksData = [];
    for (const stock of CONFIG.stocks) {
      console.log(`   • Fetching ${stock.symbol}...`);
      const data = await getStockData(stock.symbol);
      if (data && data.price > 0) {
        stocksData.push(data);
      } else {
        console.log(`     ✗ No data for ${stock.symbol}`);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log(`   ✓ Loaded ${stocksData.length}/${CONFIG.stocks.length} stocks\n`);

    const catalysts = getUpcomingCatalysts();
    const notes = getCompanyNotes();

    console.log('📝 Generating email content...');
    const htmlContent = generateEmailHTML(stocksData, indices, catalysts, notes);
    const plainTextContent = generatePlainText(stocksData, indices);
    console.log('   ✓ Email content generated\n');

    await sendEmail(htmlContent, plainTextContent);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ Daily market email completed!');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
