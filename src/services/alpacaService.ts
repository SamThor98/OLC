import axios, { AxiosInstance } from 'axios';

export interface StockQuote {
  symbol: string;
  ask_price: number;
  ask_size: number;
  bid_price: number;
  bid_size: number;
  last_price: number;
  last_size: number;
  updated_at: string;
}

export interface Bar {
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
  t: string; // timestamp
}

export interface MarketData {
  symbol: string;
  quote: StockQuote;
  dailyBar?: Bar;
  historicalBars?: Bar[]; // For CANSLIM and Weinstein analysis
}

export interface AlpacaConfig {
  apiKey: string;
  secretKey: string;
  baseUrl?: string;
  usePaperTrading?: boolean;
}

class AlpacaService {
  private client: AxiosInstance;
  private config: AlpacaConfig;

  constructor(config: AlpacaConfig) {
    this.config = config;
    // Market data API uses separate base URL
    const baseURL = config.baseUrl || 'https://data.alpaca.markets/v2';
    
    this.client = axios.create({
      baseURL,
      headers: {
        'APCA-API-KEY-ID': config.apiKey,
        'APCA-API-SECRET-KEY': config.secretKey,
      },
    });
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    try {
      // Use snapshot endpoint which provides latest quote and trade data
      const response = await this.client.get(`/stocks/${symbol}/snapshot`);
      const snapshot = response.data;
      
      console.log(`Alpaca API getQuote response for ${symbol}:`, {
        status: response.status,
        hasData: !!snapshot,
        hasQuote: !!snapshot.latestQuote,
        hasTrade: !!snapshot.latestTrade,
        symbol: snapshot.symbol,
      });
      
      // Extract quote from snapshot
      if (snapshot.latestQuote) {
        const quote = {
          symbol: snapshot.symbol || symbol,
          ask_price: snapshot.latestQuote.ap || 0,
          ask_size: snapshot.latestQuote.as || 0,
          bid_price: snapshot.latestQuote.bp || 0,
          bid_size: snapshot.latestQuote.bs || 0,
          last_price: snapshot.latestTrade?.p || snapshot.latestQuote.bp || 0,
          last_size: snapshot.latestTrade?.s || 0,
          updated_at: snapshot.latestQuote.t || new Date().toISOString(),
        };
        console.log(`Quote extracted for ${symbol}:`, quote);
        return quote;
      }
      
      // Fallback: return empty quote if no data
      console.warn(`No quote data in snapshot for ${symbol}. Snapshot:`, snapshot);
      return {
        symbol,
        ask_price: 0,
        ask_size: 0,
        bid_price: 0,
        bid_size: 0,
        last_price: 0,
        last_size: 0,
        updated_at: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error(`Error fetching quote for ${symbol}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      throw error;
    }
  }

  async getBars(symbol: string, timeframe: string = '1Day', limit: number = 30): Promise<Bar[]> {
    try {
      const response = await this.client.get('/stocks/bars', {
        params: {
          symbols: symbol,
          timeframe,
          limit,
        },
      });
      
      // Log the response for debugging
      console.log(`Alpaca API getBars response for ${symbol}:`, {
        status: response.status,
        hasData: !!response.data,
        hasBars: !!response.data?.bars,
        symbolKey: symbol,
        barsCount: response.data?.bars?.[symbol]?.length || 0,
        sampleBar: response.data?.bars?.[symbol]?.[0],
      });
      
      // Alpaca returns bars as an object with symbol as key
      const bars = response.data.bars?.[symbol] || [];
      
      if (bars.length === 0) {
        console.warn(`No bars returned for ${symbol}. Response data:`, response.data);
      }
      
      const mappedBars = bars.map((bar: any) => ({
        o: bar.o || 0,
        h: bar.h || 0,
        l: bar.l || 0,
        c: bar.c || 0,
        v: bar.v || 0,
        t: bar.t || '',
      }));
      
      // Filter out invalid bars (all zeros or missing close price)
      const validBars = mappedBars.filter(bar => bar.c > 0);
      
      if (validBars.length < mappedBars.length) {
        console.warn(`Filtered out ${mappedBars.length - validBars.length} invalid bars for ${symbol}`);
      }
      
      return validBars;
    } catch (error: any) {
      // Better error logging
      console.error(`Error fetching bars for ${symbol}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      
      // Return empty array instead of throwing to allow partial data
      return [];
    }
  }

  async getMarketData(symbol: string): Promise<MarketData> {
    try {
      // Try to fetch more historical data first, then fall back to less if needed
      // Start with 245 days (35 weeks), but if that fails, try smaller amounts
      let historicalBars: Bar[] | null = null;
      const limitsToTry = [245, 100, 50, 30];
      
      for (const limit of limitsToTry) {
        try {
          historicalBars = await this.getBars(symbol, '1Day', limit);
          if (historicalBars.length > 0) {
            console.log(`Successfully fetched ${historicalBars.length} historical bars with limit ${limit}`);
            break;
          }
        } catch (err) {
          console.warn(`Failed to fetch ${limit} bars, trying smaller amount...`);
          continue;
        }
      }

      // Fetch current quote and today's bar
      const [quote, dailyBars] = await Promise.all([
        this.getQuote(symbol).catch((err) => {
          console.warn(`Quote fetch failed for ${symbol}:`, err);
          return null;
        }),
        this.getBars(symbol, '1Day', 1).catch((err) => {
          console.warn(`Daily bars fetch failed for ${symbol}:`, err);
          return null;
        }),
      ]);

      // Combine daily bar with historical bars if we have both
      let allHistoricalBars = historicalBars || [];
      if (dailyBars && dailyBars.length > 0) {
        if (historicalBars && historicalBars.length > 0) {
          // Check if daily bar is already in historical bars
          const dailyBarDate = dailyBars[0].t;
          const hasDailyBar = historicalBars.some(bar => bar.t === dailyBarDate);
          if (!hasDailyBar) {
            allHistoricalBars = [dailyBars[0], ...historicalBars];
          }
        } else {
          // If we only have daily bar, use it as historical data
          allHistoricalBars = dailyBars;
        }
      }

      // Determine dailyBar (use the most recent bar if available)
      const finalDailyBar = dailyBars?.[0] || (allHistoricalBars.length > 0 ? allHistoricalBars[allHistoricalBars.length - 1] : undefined);

      console.log(`Market data summary for ${symbol}:`, {
        hasQuote: !!quote,
        quoteData: quote ? {
          last_price: quote.last_price,
          bid_price: quote.bid_price,
          ask_price: quote.ask_price,
        } : null,
        hasDailyBar: !!finalDailyBar,
        dailyBarData: finalDailyBar ? {
          o: finalDailyBar.o,
          h: finalDailyBar.h,
          l: finalDailyBar.l,
          c: finalDailyBar.c,
          v: finalDailyBar.v,
          t: finalDailyBar.t,
        } : null,
        historicalBarsCount: allHistoricalBars.length,
        dailyBarsCount: dailyBars?.length || 0,
        validBarsCount: allHistoricalBars.filter(b => b.c > 0).length,
        sampleBar: allHistoricalBars[0] ? {
          o: allHistoricalBars[0].o,
          h: allHistoricalBars[0].h,
          l: allHistoricalBars[0].l,
          c: allHistoricalBars[0].c,
          v: allHistoricalBars[0].v,
          t: allHistoricalBars[0].t,
        } : null,
      });

      return {
        symbol,
        quote: quote || {} as StockQuote,
        dailyBar: finalDailyBar,
        historicalBars: allHistoricalBars.length > 0 ? allHistoricalBars : undefined,
      };
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);
      throw error;
    }
  }

  async searchSymbols(query: string): Promise<string[]> {
    try {
      // Note: Alpaca doesn't have a direct symbol search endpoint
      // This is a placeholder - you might want to use a different API for symbol search
      // Or maintain a list of common symbols
      const response = await this.client.get('/assets', {
        params: {
          status: 'active',
          asset_class: 'us_equity',
        },
      });
      
      const assets = response.data.assets || [];
      const queryUpper = query.toUpperCase();
      return assets
        .filter((asset: any) => asset.symbol.includes(queryUpper))
        .map((asset: any) => asset.symbol)
        .slice(0, 10);
    } catch (error) {
      console.error('Error searching symbols:', error);
      return [];
    }
  }

  async getAccount(): Promise<any> {
    try {
      // Account endpoint uses trading API, not market data API
      const tradingBaseURL = this.config.usePaperTrading 
        ? 'https://paper-api.alpaca.markets/v2' 
        : 'https://api.alpaca.markets/v2';
      
      const tradingClient = axios.create({
        baseURL: tradingBaseURL,
        headers: {
          'APCA-API-KEY-ID': this.config.apiKey,
          'APCA-API-SECRET-KEY': this.config.secretKey,
        },
      });
      
      const response = await tradingClient.get('/account');
      return response.data;
    } catch (error) {
      console.error('Error fetching account:', error);
      throw error;
    }
  }
}

// Create a singleton instance
// In production, these should come from environment variables
const getAlpacaService = (): AlpacaService | null => {
  const apiKey = import.meta.env.VITE_ALPACA_API_KEY;
  const secretKey = import.meta.env.VITE_ALPACA_SECRET_KEY;
  const usePaperTrading = import.meta.env.VITE_ALPACA_USE_PAPER !== 'false';

  console.log('Alpaca Service Initialization:', {
    hasApiKey: !!apiKey,
    hasSecretKey: !!secretKey,
    apiKeyLength: apiKey?.length || 0,
    secretKeyLength: secretKey?.length || 0,
    usePaperTrading,
    envKeys: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_ALPACA')),
  });

  if (!apiKey || !secretKey) {
    console.error('Alpaca API credentials not found in environment variables', {
      apiKeyPresent: !!apiKey,
      secretKeyPresent: !!secretKey,
      allEnvKeys: Object.keys(import.meta.env),
    });
    return null;
  }

  if (apiKey.length < 10 || secretKey.length < 10) {
    console.error('Alpaca API credentials appear to be invalid (too short)', {
      apiKeyLength: apiKey.length,
      secretKeyLength: secretKey.length,
    });
    return null;
  }

  console.log('Alpaca Service created successfully');
  return new AlpacaService({
    apiKey,
    secretKey,
    usePaperTrading,
  });
};

export const alpacaService = getAlpacaService();
