import axios, { AxiosInstance } from 'axios';

export interface EarningsData {
  symbol: string;
  quarterlyEarnings: QuarterlyEarning[];
  annualEarnings: AnnualEarning[];
}

export interface QuarterlyEarning {
  fiscalDateEnding: string;
  reportedDate: string;
  reportedEPS: string;
  estimatedEPS: string;
  surprise: string;
  surprisePercentage: string;
}

export interface AnnualEarning {
  fiscalDateEnding: string;
  reportedEPS: string;
}

export interface CompanyOverview {
  Symbol: string;
  Name: string;
  Description: string;
  CIK: string;
  Exchange: string;
  Currency: string;
  Country: string;
  Sector: string;
  Industry: string;
  Address: string;
  FullTimeEmployees: string;
  FiscalYearEnd: string;
  LatestQuarter: string;
  MarketCapitalization: string;
  EBITDA: string;
  PERatio: string;
  PEGRatio: string;
  BookValue: string;
  DividendPerShare: string;
  DividendYield: string;
  EPS: string;
  RevenuePerShareTTM: string;
  ProfitMargin: string;
  OperatingMarginTTM: string;
  ReturnOnAssetsTTM: string;
  ReturnOnEquityTTM: string;
  RevenueTTM: string;
  GrossProfitTTM: string;
  DilutedEPSTTM: string;
  QuarterlyEarningsGrowthYOY: string;
  QuarterlyRevenueGrowthYOY: string;
  AnalystTargetPrice: string;
  TrailingPE: string;
  ForwardPE: string;
  PriceToSalesRatioTTM: string;
  PriceToBookRatio: string;
  EVToRevenue: string;
  EVToEBITDA: string;
  Beta: string;
  '52WeekHigh': string;
  '52WeekLow': string;
  '50DayMovingAverage': string;
  '200DayMovingAverage': string;
  SharesOutstanding: string;
  DividendDate: string;
  ExDividendDate: string;
}

export interface IncomeStatement {
  symbol: string;
  annualReports: AnnualReport[];
  quarterlyReports: QuarterlyReport[];
}

export interface AnnualReport {
  fiscalDateEnding: string;
  reportedCurrency: string;
  totalRevenue: string;
  totalOperatingExpense: string;
  costOfRevenue: string;
  grossProfit: string;
  ebit: string;
  netIncome: string;
  researchAndDevelopment: string;
  operatingIncome: string;
}

export interface QuarterlyReport {
  fiscalDateEnding: string;
  reportedCurrency: string;
  totalRevenue: string;
  totalOperatingExpense: string;
  costOfRevenue: string;
  grossProfit: string;
  ebit: string;
  netIncome: string;
  researchAndDevelopment: string;
  operatingIncome: string;
}

class AlphaVantageService {
  private client: AxiosInstance;
  private apiKey: string;
  private baseURL = 'https://www.alphavantage.co/query';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    });
  }

  /**
   * Rate limiting helper - Alpha Vantage free tier: 5 calls/minute, 25 calls/day
   */
  private async rateLimit(): Promise<void> {
    // Add 12 second delay between calls to respect free tier (5 calls/minute)
    await new Promise(resolve => setTimeout(resolve, 12000));
  }

  /**
   * Get earnings data (quarterly and annual)
   * Critical for CANSLIM "C" (Current Quarterly) and "A" (Annual Growth)
   */
  async getEarnings(symbol: string): Promise<EarningsData | null> {
    try {
      await this.rateLimit();
      
      const response = await this.client.get('', {
        params: {
          function: 'EARNINGS',
          symbol: symbol.toUpperCase(),
          apikey: this.apiKey,
        },
      });

      if (response.data.Note) {
        console.warn('Alpha Vantage API call frequency limit reached. Please wait.');
        return null;
      }

      if (response.data.Information) {
        console.warn('Alpha Vantage API:', response.data.Information);
        return null;
      }

      if (!response.data.quarterlyEarnings && !response.data.annualEarnings) {
        console.warn(`No earnings data found for ${symbol}`);
        return null;
      }

      return {
        symbol: symbol.toUpperCase(),
        quarterlyEarnings: response.data.quarterlyEarnings || [],
        annualEarnings: response.data.annualEarnings || [],
      };
    } catch (error: any) {
      console.error(`Error fetching earnings for ${symbol}:`, {
        message: error.message,
        response: error.response?.data,
      });
      return null;
    }
  }

  /**
   * Get company overview with key fundamentals
   * Critical for CANSLIM "S" (Shares Outstanding) and fundamental metrics
   */
  async getOverview(symbol: string): Promise<CompanyOverview | null> {
    try {
      await this.rateLimit();
      
      const response = await this.client.get('', {
        params: {
          function: 'OVERVIEW',
          symbol: symbol.toUpperCase(),
          apikey: this.apiKey,
        },
      });

      if (response.data.Note) {
        console.warn('Alpha Vantage API call frequency limit reached. Please wait.');
        return null;
      }

      if (response.data.Information) {
        console.warn('Alpha Vantage API:', response.data.Information);
        return null;
      }

      if (!response.data.Symbol) {
        console.warn(`No overview data found for ${symbol}`);
        return null;
      }

      return response.data as CompanyOverview;
    } catch (error: any) {
      console.error(`Error fetching overview for ${symbol}:`, {
        message: error.message,
        response: error.response?.data,
      });
      return null;
    }
  }

  /**
   * Get income statement (quarterly and annual)
   * Useful for revenue growth validation
   */
  async getIncomeStatement(symbol: string): Promise<IncomeStatement | null> {
    try {
      await this.rateLimit();
      
      const response = await this.client.get('', {
        params: {
          function: 'INCOME_STATEMENT',
          symbol: symbol.toUpperCase(),
          apikey: this.apiKey,
        },
      });

      if (response.data.Note) {
        console.warn('Alpha Vantage API call frequency limit reached. Please wait.');
        return null;
      }

      if (response.data.Information) {
        console.warn('Alpha Vantage API:', response.data.Information);
        return null;
      }

      if (!response.data.symbol) {
        console.warn(`No income statement data found for ${symbol}`);
        return null;
      }

      return {
        symbol: symbol.toUpperCase(),
        annualReports: response.data.annualReports || [],
        quarterlyReports: response.data.quarterlyReports || [],
      };
    } catch (error: any) {
      console.error(`Error fetching income statement for ${symbol}:`, {
        message: error.message,
        response: error.response?.data,
      });
      return null;
    }
  }

  /**
   * Get comprehensive fundamental data (earnings + overview + income statement)
   * Optimized to minimize API calls
   */
  async getFundamentals(symbol: string): Promise<{
    earnings: EarningsData | null;
    overview: CompanyOverview | null;
    incomeStatement: IncomeStatement | null;
  }> {
    // Fetch all three in parallel (but with rate limiting built into each call)
    // Note: This will take ~36 seconds due to rate limiting (3 calls × 12 seconds)
    const [earnings, overview, incomeStatement] = await Promise.all([
      this.getEarnings(symbol),
      this.getOverview(symbol),
      this.getIncomeStatement(symbol),
    ]);

    return {
      earnings,
      overview,
      incomeStatement,
    };
  }
}

// Create singleton instance
const getAlphaVantageService = (): AlphaVantageService | null => {
  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    console.warn('Alpha Vantage API key not found in environment variables');
    return null;
  }

  if (apiKey.length < 10) {
    console.warn('Alpha Vantage API key appears to be invalid (too short)');
    return null;
  }

  console.log('Alpha Vantage Service initialized successfully');
  return new AlphaVantageService(apiKey);
};

export const alphaVantageService = getAlphaVantageService();
