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
import { FinnhubFundamentals } from './finnhubService';

export interface AssetInfo {
  symbol: string;
  name: string;
  exchange: string;
  asset_class: string;
  tradable: boolean;
}

export interface MarketData {
  symbol: string;
  companyName?: string; // Company name from Alpaca assets or Finnhub
  quote: StockQuote;
  dailyBar?: Bar;
  historicalBars?: Bar[]; // For CANSLIM and Weinstein analysis
  assetInfo?: AssetInfo; // Asset details from Alpaca
  finnhub?: FinnhubFundamentals; // Real earnings and financial data from Finnhub
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
      
      // Extract quote from snapshot
      if (snapshot.latestQuote) {
        return {
          symbol: snapshot.symbol || symbol,
          ask_price: snapshot.latestQuote.ap || 0,
          ask_size: snapshot.latestQuote.as || 0,
          bid_price: snapshot.latestQuote.bp || 0,
          bid_size: snapshot.latestQuote.bs || 0,
          last_price: snapshot.latestTrade?.p || snapshot.latestQuote.bp || 0,
          last_size: snapshot.latestTrade?.s || 0,
          updated_at: snapshot.latestQuote.t || new Date().toISOString(),
        };
      }
      
      // Fallback: return empty quote if no data
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
   * @param timeframe Bar timeframe (1Min, 5Min, 15Min, 1Hour, 1Day, 1Week)
   * @param limit Maximum number of bars (Alpaca max is typically 10000)
   * @param start Optional start date (ISO format)
   * @param end Optional end date (ISO format)
   */
  async getBars(
    symbol: string, 
    timeframe: string = '1Week', 
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
      
      // Alpaca returns bars as an object with symbol as key
      const bars = response.data.bars?.[symbol] || [];
      
      const mappedBars = bars.map((bar: any) => ({
        o: bar.o || 0,
        h: bar.h || 0,
        l: bar.l || 0,
        c: bar.c || 0,
        v: bar.v || 0,
        t: bar.t || '',
      }));
      
      // Filter out invalid bars (all zeros or missing close price)
      return mappedBars.filter((bar: Bar) => bar.c > 0);
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
   * Fetches quote, weekly bar, and extended historical data for analysis
   */
  async getMarketData(symbol: string): Promise<MarketData> {
    try {
      // Calculate date range for better data retrieval
      // Request 1 year of data (~52 weeks) for proper CANSLIM/Weinstein analysis
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      
      // Try to fetch extended historical data using date range
      let historicalBars: Bar[] | null = null;
      
      // Strategy: Try date range first, then fall back to limit-based
      try {
        // Request 1 year of weekly bars (~52 weeks)
        historicalBars = await this.getBars(
          symbol, 
          '1Week', 
          52,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
        
        if (historicalBars.length === 0) {
          // Fall back to limit-based approach
          const limitsToTry = [52, 30, 20, 10];
          for (const limit of limitsToTry) {
            try {
              historicalBars = await this.getBars(symbol, '1Week', limit);
              if (historicalBars.length > 0) break;
            } catch {
              continue;
            }
          }
        }
      } catch {
        // Fall back to limit-based approach
        const limitsToTry = [52, 30, 20, 10];
        for (const limit of limitsToTry) {
          try {
            historicalBars = await this.getBars(symbol, '1Week', limit);
            if (historicalBars.length > 0) break;
          } catch {
            continue;
          }
        }
      }

      // Fetch current quote, latest weekly bar, and asset info (for company name)
      const [quote, weeklyBars, assetInfo] = await Promise.all([
        this.getQuote(symbol).catch(() => null),
        this.getBars(symbol, '1Week', 1).catch(() => null),
        this.getAssetInfo(symbol).catch(() => null),
      ]);

      // Combine weekly bar with historical bars if we have both
      let allHistoricalBars = historicalBars || [];
      if (weeklyBars && weeklyBars.length > 0) {
        if (historicalBars && historicalBars.length > 0) {
          // Check if weekly bar is already in historical bars
          const weeklyBarDate = weeklyBars[0].t;
          const hasWeeklyBar = historicalBars.some(bar => bar.t === weeklyBarDate);
          if (!hasWeeklyBar) {
            allHistoricalBars = [weeklyBars[0], ...historicalBars];
          }
        } else {
          // If we only have weekly bar, use it as historical data
          allHistoricalBars = weeklyBars;
        }
      }

      // Determine dailyBar (use the most recent weekly bar if available)
      const finalDailyBar = weeklyBars?.[0] || (allHistoricalBars.length > 0 ? allHistoricalBars[allHistoricalBars.length - 1] : undefined);

      // Fetch fundamental data from Finnhub (primary) or Alpha Vantage (fallback)
      let finnhubData: FinnhubFundamentals | undefined = undefined;
      let fundamentals: MarketData['fundamentals'] = undefined;

      // Try Finnhub first (preferred - faster, more generous rate limits)
      try {
        const { finnhubService } = await import('./finnhubService');
        if (finnhubService) {
          finnhubData = await finnhubService.getFundamentals(symbol);
        }
      } catch {
        // Finnhub not configured - try Alpha Vantage
      }

      // Fall back to Alpha Vantage if Finnhub didn't provide data
      if (!finnhubData?.profile && !finnhubData?.financials) {
        try {
          const { alphaVantageService } = await import('./alphaVantageService');
          if (alphaVantageService) {
            const fundamentalData = await alphaVantageService.getFundamentals(symbol);
            if (fundamentalData.earnings || fundamentalData.overview || fundamentalData.incomeStatement) {
              fundamentals = {
                earnings: fundamentalData.earnings ?? undefined,
                overview: fundamentalData.overview ?? undefined,
                incomeStatement: fundamentalData.incomeStatement ?? undefined,
              };
            }
          }
        } catch {
          // Alpha Vantage not configured or failed
        }
      }

      // Determine company name (priority: Finnhub > Alpaca > Alpha Vantage)
      const companyName = finnhubData?.profile?.name || assetInfo?.name || fundamentals?.overview?.Name;

      return {
        symbol,
        companyName,
        quote: quote || {} as StockQuote,
        dailyBar: finalDailyBar,
        historicalBars: allHistoricalBars.length > 0 ? allHistoricalBars : undefined,
        assetInfo: assetInfo || undefined,
        finnhub: finnhubData?.profile || finnhubData?.financials || finnhubData?.earnings ? finnhubData : undefined,
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
          this.getBatchBars(batch, '1Week', 30).catch(() => new Map()),
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
  async getBatchBars(symbols: string[], timeframe: string = '1Week', limit: number = 30): Promise<Map<string, Bar[]>> {
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

  /**
   * Get asset information including company name from Alpaca Trading API
   */
  async getAssetInfo(symbol: string): Promise<AssetInfo | null> {
    try {
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
      
      const response = await tradingClient.get(`/assets/${symbol.toUpperCase()}`);
      
      if (response.data && response.data.symbol) {
        return {
          symbol: response.data.symbol,
          name: response.data.name || '',
          exchange: response.data.exchange || '',
          asset_class: response.data.class || '',
          tradable: response.data.tradable || false,
        };
      }
      return null;
    } catch (error: any) {
      // Don't log error for 404 (symbol not found) - this is expected for some symbols
      if (error.response?.status !== 404) {
        console.warn(`Error fetching asset info for ${symbol}:`, error.message);
      }
      return null;
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

  if (!apiKey || !secretKey) {
    console.warn('Alpaca API credentials not configured');
    return null;
  }

  if (apiKey.length < 10 || secretKey.length < 10) {
    console.warn('Alpaca API credentials appear to be invalid');
    return null;
  }

  return new AlpacaService({
    apiKey,
    secretKey,
    usePaperTrading,
  });
};

export const alpacaService = getAlpacaService();
