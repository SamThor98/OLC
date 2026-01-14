import axios, { AxiosInstance } from 'axios';

export interface FinnhubCompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  finnhubIndustry: string;
  ipo: string;
  logo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
}

export interface FinnhubBasicFinancials {
  symbol: string;
  metric: {
    '10DayAverageTradingVolume': number;
    '52WeekHigh': number;
    '52WeekLow': number;
    '52WeekPriceReturnDaily': number;
    beta: number;
    bookValuePerShareAnnual: number;
    bookValuePerShareQuarterly: number;
    currentRatioAnnual: number;
    currentRatioQuarterly: number;
    dividendYieldIndicatedAnnual: number;
    epsAnnual: number;
    epsBasicExclExtraItemsAnnual: number;
    epsBasicExclExtraItemsTTM: number;
    epsExclExtraItemsAnnual: number;
    epsExclExtraItemsTTM: number;
    epsGrowth3Y: number;
    epsGrowth5Y: number;
    epsGrowthQuarterlyYoy: number;
    epsGrowthTTMYoy: number;
    epsTTM: number;
    marketCapitalization: number;
    netIncomeEmployeeAnnual: number;
    netProfitMarginAnnual: number;
    netProfitMarginTTM: number;
    peAnnual: number;
    peBasicExclExtraTTM: number;
    peExclExtraAnnual: number;
    peExclExtraTTM: number;
    peTTM: number;
    pfcfShareAnnual: number;
    pfcfShareTTM: number;
    priceRelativeToSP50013Week: number;
    priceRelativeToSP50026Week: number;
    priceRelativeToSP5004Week: number;
    priceRelativeToSP50052Week: number;
    priceRelativeToSP500Ytd: number;
    psTTM: number;
    revenueGrowth3Y: number;
    revenueGrowth5Y: number;
    revenueGrowthQuarterlyYoy: number;
    revenueGrowthTTMYoy: number;
    revenuePerShareAnnual: number;
    revenuePerShareTTM: number;
    roaRfy: number;
    roaTTM: number;
    roeRfy: number;
    roeTTM: number;
    roiAnnual: number;
    roiTTM: number;
    totalDebtTotalEquityAnnual: number;
    totalDebtTotalEquityQuarterly: number;
  };
}

export interface FinnhubEarnings {
  symbol: string;
  earnings: Array<{
    actual: number;
    estimate: number;
    period: string;
    surprise: number;
    surprisePercent: number;
    symbol: string;
  }>;
}

export interface FinnhubFundamentals {
  profile: FinnhubCompanyProfile | null;
  financials: FinnhubBasicFinancials | null;
  earnings: FinnhubEarnings | null;
}

class FinnhubService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://finnhub.io/api/v1',
      timeout: 10000,
    });
  }

  /**
   * Get company profile (name, industry, market cap, shares outstanding)
   */
  async getCompanyProfile(symbol: string): Promise<FinnhubCompanyProfile | null> {
    try {
      const response = await this.client.get('/stock/profile2', {
        params: {
          symbol: symbol.toUpperCase(),
          token: this.apiKey,
        },
      });

      if (!response.data || !response.data.name) {
        return null;
      }

      return response.data as FinnhubCompanyProfile;
    } catch {
      return null;
    }
  }

  /**
   * Get basic financials (EPS, growth rates, margins, ratios)
   * This is the key data for CANSLIM analysis
   */
  async getBasicFinancials(symbol: string): Promise<FinnhubBasicFinancials | null> {
    try {
      const response = await this.client.get('/stock/metric', {
        params: {
          symbol: symbol.toUpperCase(),
          metric: 'all',
          token: this.apiKey,
        },
      });

      if (!response.data || !response.data.metric) {
        return null;
      }

      return {
        symbol: symbol.toUpperCase(),
        metric: response.data.metric,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get earnings history (actual vs estimate, surprise %)
   */
  async getEarnings(symbol: string): Promise<FinnhubEarnings | null> {
    try {
      const response = await this.client.get('/stock/earnings', {
        params: {
          symbol: symbol.toUpperCase(),
          token: this.apiKey,
        },
      });

      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        return null;
      }

      return {
        symbol: symbol.toUpperCase(),
        earnings: response.data,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get all fundamental data in one call
   */
  async getFundamentals(symbol: string): Promise<FinnhubFundamentals> {
    const [profile, financials, earnings] = await Promise.all([
      this.getCompanyProfile(symbol),
      this.getBasicFinancials(symbol),
      this.getEarnings(symbol),
    ]);

    return { profile, financials, earnings };
  }
}

// Create singleton instance
const getFinnhubService = (): FinnhubService | null => {
  const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;

  if (!apiKey || apiKey.length < 10) {
    return null;
  }

  return new FinnhubService(apiKey);
};

export const finnhubService = getFinnhubService();
