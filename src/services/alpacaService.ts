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

import { EarningsData, CompanyOverview, IncomeStatement } from './alphaVantageService';

export interface MarketData {
  symbol: string;
  quote: StockQuote;
  dailyBar?: Bar;
  historicalBars?: Bar[]; // For CANSLIM and Weinstein analysis
  fundamentals?: {
    earnings?: EarningsData;
    overview?: CompanyOverview;
    incomeStatement?: IncomeStatement;
  };
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

  /**
   * Get historical bars for a symbol
   * @param symbol Stock symbol
   * @param timeframe Bar timeframe (1Min, 5Min, 15Min, 1Hour, 1Day)
   * @param limit Maximum number of bars (Alpaca max is typically 10000)
   * @param start Optional start date (ISO format)
   * @param end Optional end date (ISO format)
   */
  async getBars(
    symbol: string, 
    timeframe: string = '1Day', 
    limit: number = 30,
    start?: string,
    end?: string
  ): Promise<Bar[]> {
    try {
      const params: any = {
        symbols: symbol,
        timeframe,
        limit: Math.min(limit, 10000), // Respect Alpaca's max limit
      };
      
      // Use date range if provided (more reliable than just limit)
      if (start) params.start = start;
      if (end) params.end = end;
      
      const response = await this.client.get('/stocks/bars', { params });
      
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
      const validBars = mappedBars.filter((bar: Bar) => bar.c > 0);
      
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

  /**
   * Get comprehensive market data for a symbol
   * Fetches quote, daily bar, and extended historical data for analysis
   */
  async getMarketData(symbol: string): Promise<MarketData> {
    try {
      // Calculate date range for better data retrieval
      // Request 1 year of data (252 trading days) for proper CANSLIM/Weinstein analysis
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      
      // Try to fetch extended historical data using date range
      let historicalBars: Bar[] | null = null;
      
      // Strategy: Try date range first, then fall back to limit-based
      try {
        // Request 1 year of daily bars (252 trading days)
        historicalBars = await this.getBars(
          symbol, 
          '1Day', 
          252,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
        
        if (historicalBars.length === 0) {
          // Fall back to limit-based approach
          const limitsToTry = [252, 100, 50, 30];
          for (const limit of limitsToTry) {
            try {
              historicalBars = await this.getBars(symbol, '1Day', limit);
              if (historicalBars.length > 0) {
                console.log(`Fetched ${historicalBars.length} bars using limit ${limit}`);
                break;
              }
            } catch (err) {
              console.warn(`Failed to fetch ${limit} bars, trying smaller amount...`);
              continue;
            }
          }
        } else {
          console.log(`Successfully fetched ${historicalBars.length} historical bars using date range`);
        }
      } catch (err) {
        console.warn('Date range fetch failed, trying limit-based approach...', err);
        // Fall back to limit-based
        const limitsToTry = [252, 100, 50, 30];
        for (const limit of limitsToTry) {
          try {
            historicalBars = await this.getBars(symbol, '1Day', limit);
            if (historicalBars.length > 0) {
              console.log(`Fetched ${historicalBars.length} bars using limit ${limit}`);
              break;
            }
          } catch (err2) {
            console.warn(`Failed to fetch ${limit} bars, trying smaller amount...`);
            continue;
          }
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
        validBarsCount: allHistoricalBars.filter((b: Bar) => b.c > 0).length,
        sampleBar: allHistoricalBars[0] ? {
          o: allHistoricalBars[0].o,
          h: allHistoricalBars[0].h,
          l: allHistoricalBars[0].l,
          c: allHistoricalBars[0].c,
          v: allHistoricalBars[0].v,
          t: allHistoricalBars[0].t,
        } : null,
      });

      // Fetch fundamental data from Alpha Vantage if available
      let fundamentals: MarketData['fundamentals'] = undefined;
      try {
        // Dynamically import to avoid circular dependency
        const { alphaVantageService } = await import('./alphaVantageService');
        if (alphaVantageService) {
          console.log(`Fetching fundamental data for ${symbol} from Alpha Vantage...`);
          const fundamentalData = await alphaVantageService.getFundamentals(symbol);
          if (fundamentalData.earnings || fundamentalData.overview || fundamentalData.incomeStatement) {
            // Convert null to undefined to match the optional property type
            fundamentals = {
              earnings: fundamentalData.earnings ?? undefined,
              overview: fundamentalData.overview ?? undefined,
              incomeStatement: fundamentalData.incomeStatement ?? undefined,
            };
            console.log(`Successfully fetched fundamental data for ${symbol}`);
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch fundamental data for ${symbol}:`, error);
        // Continue without fundamental data - not critical for basic functionality
      }

      return {
        symbol,
        quote: quote || {} as StockQuote,
        dailyBar: finalDailyBar,
        historicalBars: allHistoricalBars.length > 0 ? allHistoricalBars : undefined,
        fundamentals,
      };
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Batch fetch market data for multiple symbols (for scanner functionality)
   * Uses Alpaca's multi-symbol bars endpoint for efficiency
   */
  async getBatchMarketData(symbols: string[]): Promise<Map<string, MarketData>> {
    const results = new Map<string, MarketData>();
    const maxBatchSize = 100; // Alpaca typically allows up to 100 symbols per request
    
    // Process in batches to avoid API limits
    for (let i = 0; i < symbols.length; i += maxBatchSize) {
      const batch = symbols.slice(i, i + maxBatchSize);
      
      try {
        // Fetch quotes and bars in parallel for the batch
        const [quotes, bars] = await Promise.all([
          Promise.allSettled(batch.map(symbol => this.getQuote(symbol))),
          this.getBatchBars(batch, '1Day', 30).catch(() => new Map()),
        ]);
        
        // Process results
        batch.forEach((symbol, index) => {
          const quoteResult = quotes[index];
          const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : null;
          const symbolBars = (bars as Map<string, Bar[]>).get(symbol) || [];
          
          const dailyBar = symbolBars.length > 0 ? symbolBars[symbolBars.length - 1] : undefined;
          const historicalBars = symbolBars.length > 1 ? symbolBars : undefined;
          
          results.set(symbol, {
            symbol,
            quote: quote || {} as StockQuote,
            dailyBar,
            historicalBars,
          });
        });
      } catch (error) {
        console.error(`Error processing batch ${i / maxBatchSize + 1}:`, error);
        // Continue with other batches
      }
    }
    
    return results;
  }
  
  /**
   * Get bars for multiple symbols at once (more efficient than individual calls)
   */
  async getBatchBars(symbols: string[], timeframe: string = '1Day', limit: number = 30): Promise<Map<string, Bar[]>> {
    try {
      const response = await this.client.get('/stocks/bars', {
        params: {
          symbols: symbols.join(','),
          timeframe,
          limit: Math.min(limit, 10000),
        },
      });
      
      const results = new Map<string, Bar[]>();
      const barsData = response.data.bars || {};
      
      symbols.forEach(symbol => {
        const bars = barsData[symbol] || [];
        const mappedBars = bars.map((bar: any) => ({
          o: bar.o || 0,
          h: bar.h || 0,
          l: bar.l || 0,
          c: bar.c || 0,
          v: bar.v || 0,
          t: bar.t || '',
        })).filter((bar: Bar) => bar.c > 0);
        
        results.set(symbol, mappedBars);
      });
      
      return results;
    } catch (error: any) {
      console.error('Error fetching batch bars:', {
        message: error.message,
        response: error.response?.data,
      });
      return new Map();
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
    envKeys: Object.keys(import.meta.env).filter((k: string) => k.startsWith('VITE_ALPACA')),
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
