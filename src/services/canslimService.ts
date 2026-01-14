import { Bar } from './alpacaService';
import { EarningsData, CompanyOverview } from './alphaVantageService';
import { FinnhubFundamentals, FinnhubBasicFinancials, FinnhubEarnings } from './finnhubService';

export interface CANSLIMScore {
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  scores: {
    c: { score: number; maxScore: number; description: string }; // Current quarterly earnings
    a: { score: number; maxScore: number; description: string }; // Annual earnings growth
    n: { score: number; maxScore: number; description: string }; // New products/management/highs
    s: { score: number; maxScore: number; description: string }; // Supply and demand
    l: { score: number; maxScore: number; description: string }; // Leader or laggard
    i: { score: number; maxScore: number; description: string }; // Institutional sponsorship
    m: { score: number; maxScore: number; description: string }; // Market direction
  };
  totalScore: number;
  maxTotalScore: number;
}

/**
 * CANSLIM Analysis Service
 * Uses real earnings and financial data from Finnhub or Alpha Vantage
 */
export class CANSLIMService {
  /**
   * Calculate CANSLIM score based on available market data
   * Supports real earnings data from Finnhub (preferred) or Alpha Vantage
   */
  static calculateScore(
    currentPrice: number,
    historicalBars: Bar[],
    volume: number,
    fundamentals?: {
      earnings?: EarningsData;
      overview?: CompanyOverview;
    },
    finnhub?: FinnhubFundamentals
  ): CANSLIMScore {
    // Work with any available data - minimum 1 bar
    if (!historicalBars || historicalBars.length === 0) {
      return this.getDefaultScore('No historical data available');
    }

    // Filter out invalid bars - be more lenient with validation
    const validBars = historicalBars.filter(bar => {
      if (!bar) return false;
      // Allow bars even if timestamp is missing, just need valid price data
      if (isNaN(bar.c) || bar.c <= 0) return false;
      // Be lenient with OHLC - use close if others are missing
      if (isNaN(bar.o)) bar.o = bar.c;
      if (isNaN(bar.h)) bar.h = bar.c;
      if (isNaN(bar.l)) bar.l = bar.c;
      if (isNaN(bar.v) || bar.v < 0) bar.v = 0;
      return true;
    });
    
    if (validBars.length === 0) {
      return this.getDefaultScore('No valid price data available');
    }
    
    // Sort bars by date if timestamps are available, otherwise maintain order
    const sortedBars = validBars.every(b => b.t)
      ? [...validBars].sort((a, b) => {
          if (a.t && b.t) {
            const timeA = new Date(a.t).getTime();
            const timeB = new Date(b.t).getTime();
            if (!isNaN(timeA) && !isNaN(timeB)) {
              return timeA - timeB;
            }
          }
          return 0;
        })
      : [...validBars]; // If no timestamps, use as-is (assume already sorted)

    const scores = {
      // C: Current quarterly earnings per share (EPS) - should be up 25%+
      // Priority: Finnhub > Alpha Vantage > N/A
      c: finnhub?.financials?.metric
        ? this.scoreCurrentQuarterlyEarningsWithFinnhub(finnhub.financials, finnhub.earnings)
        : fundamentals?.earnings
          ? this.scoreCurrentQuarterlyEarningsWithData(fundamentals.earnings)
          : { score: 0, maxScore: 15, description: 'N/A - No earnings data (configure Finnhub API)' },
      
      // A: Annual earnings growth - should be up 25%+ over last 3 years
      // Priority: Finnhub > Alpha Vantage > N/A
      a: finnhub?.financials?.metric
        ? this.scoreAnnualEarningsGrowthWithFinnhub(finnhub.financials)
        : fundamentals?.earnings
          ? this.scoreAnnualEarningsGrowthWithData(fundamentals.earnings)
          : { score: 0, maxScore: 15, description: 'N/A - No earnings data (configure Finnhub API)' },
      
      // N: New products, new management, new highs
      // Use 52-week high from Finnhub if available, otherwise calculate from bars
      n: finnhub?.financials?.metric
        ? this.scoreNewHighsWithFinnhub(currentPrice, finnhub.financials)
        : this.scoreNewHighs(currentPrice, sortedBars),
      
      // S: Supply and demand - small number of shares outstanding
      // Priority: Finnhub > Alpha Vantage > N/A
      s: finnhub?.profile?.shareOutstanding
        ? this.scoreSupplyAndDemandWithFinnhub(volume, sortedBars, finnhub.profile.shareOutstanding)
        : fundamentals?.overview?.SharesOutstanding
          ? this.scoreSupplyAndDemandWithData(volume, sortedBars, fundamentals.overview.SharesOutstanding)
          : { score: 0, maxScore: 10, description: 'N/A - No shares data (configure Finnhub API)' },
      
      // L: Leader or laggard - should be a market leader
      // Use relative strength from Finnhub if available
      l: finnhub?.financials?.metric
        ? this.scoreLeaderOrLaggardWithFinnhub(finnhub.financials)
        : this.scoreLeaderOrLaggard(sortedBars),
      
      // I: Institutional sponsorship - should have institutional backing
      // Note: Finnhub free tier doesn't have institutional ownership, mark as N/A without data
      i: { score: 0, maxScore: 10, description: 'N/A - Institutional data requires premium API' },
      
      // M: Market direction - overall market should be in uptrend
      // Use S&P 500 relative performance from Finnhub if available
      m: finnhub?.financials?.metric
        ? this.scoreMarketDirectionWithFinnhub(finnhub.financials)
        : this.scoreMarketDirection(sortedBars),
    };

    const totalScore = Object.values(scores).reduce((sum, s) => sum + s.score, 0);
    const maxTotalScore = Object.values(scores).reduce((sum, s) => sum + s.maxScore, 0);
    const percentage = (totalScore / maxTotalScore) * 100;

    let overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (percentage >= 85) overallGrade = 'A';
    else if (percentage >= 70) overallGrade = 'B';
    else if (percentage >= 55) overallGrade = 'C';
    else if (percentage >= 40) overallGrade = 'D';
    else overallGrade = 'F';

    return {
      overallGrade,
      scores,
      totalScore,
      maxTotalScore,
    };
  }

  // ========================================
  // FINNHUB SCORING METHODS (Real Data)
  // ========================================

  /**
   * Score quarterly earnings using Finnhub financial metrics
   */
  private static scoreCurrentQuarterlyEarningsWithFinnhub(
    financials: FinnhubBasicFinancials,
    earnings: FinnhubEarnings | null
  ): { score: number; maxScore: number; description: string } {
    const metric = financials.metric;
    
    // Use quarterly EPS growth YoY from Finnhub
    const epsGrowthQtr = metric.epsGrowthQuarterlyYoy;
    
    if (epsGrowthQtr === undefined || epsGrowthQtr === null || isNaN(epsGrowthQtr)) {
      // Try to calculate from earnings data if available
      if (earnings?.earnings && earnings.earnings.length >= 2) {
        const current = earnings.earnings[0];
        const previous = earnings.earnings[1];
        if (current.actual && previous.actual && previous.actual !== 0) {
          const growth = ((current.actual - previous.actual) / Math.abs(previous.actual)) * 100;
          return this.gradeEarningsGrowth(growth, 'Quarterly EPS', 15);
        }
      }
      return { score: 0, maxScore: 15, description: 'N/A - Quarterly EPS data unavailable' };
    }

    return this.gradeEarningsGrowth(epsGrowthQtr, 'Quarterly EPS YoY', 15);
  }

  /**
   * Score annual earnings growth using Finnhub financial metrics
   */
  private static scoreAnnualEarningsGrowthWithFinnhub(
    financials: FinnhubBasicFinancials
  ): { score: number; maxScore: number; description: string } {
    const metric = financials.metric;
    
    // Use 3-year or 5-year EPS growth from Finnhub
    const epsGrowth3Y = metric.epsGrowth3Y;
    const epsGrowth5Y = metric.epsGrowth5Y;
    const epsGrowthTTM = metric.epsGrowthTTMYoy;
    
    // Prefer 3Y growth, then 5Y, then TTM
    let growth: number | undefined;
    let period = '';
    
    if (epsGrowth3Y !== undefined && !isNaN(epsGrowth3Y)) {
      growth = epsGrowth3Y;
      period = '3-Year EPS CAGR';
    } else if (epsGrowth5Y !== undefined && !isNaN(epsGrowth5Y)) {
      growth = epsGrowth5Y;
      period = '5-Year EPS CAGR';
    } else if (epsGrowthTTM !== undefined && !isNaN(epsGrowthTTM)) {
      growth = epsGrowthTTM;
      period = 'TTM EPS YoY';
    }
    
    if (growth === undefined) {
      return { score: 0, maxScore: 15, description: 'N/A - Annual EPS growth data unavailable' };
    }

    return this.gradeEarningsGrowth(growth, period, 15);
  }

  /**
   * Score new highs using Finnhub 52-week data
   */
  private static scoreNewHighsWithFinnhub(
    currentPrice: number,
    financials: FinnhubBasicFinancials
  ): { score: number; maxScore: number; description: string } {
    const metric = financials.metric;
    const high52Week = metric['52WeekHigh'];
    
    if (!high52Week || high52Week === 0) {
      return { score: 0, maxScore: 15, description: 'N/A - 52-week high data unavailable' };
    }

    const percentFromHigh = ((currentPrice - high52Week) / high52Week) * 100;

    if (percentFromHigh >= -2) {
      return { score: 15, maxScore: 15, description: `At/near 52-week high (${percentFromHigh.toFixed(1)}% from high)` };
    }
    if (percentFromHigh >= -5) {
      return { score: 12, maxScore: 15, description: `Close to 52-week high (${percentFromHigh.toFixed(1)}% from high)` };
    }
    if (percentFromHigh >= -15) {
      return { score: 8, maxScore: 15, description: `Moderate distance from high (${percentFromHigh.toFixed(1)}% from high)` };
    }
    if (percentFromHigh >= -25) {
      return { score: 5, maxScore: 15, description: `Below 52-week high (${percentFromHigh.toFixed(1)}% from high)` };
    }
    return { score: 2, maxScore: 15, description: `Well below 52-week high (${percentFromHigh.toFixed(1)}% from high)` };
  }

  /**
   * Score supply/demand using Finnhub shares outstanding
   */
  private static scoreSupplyAndDemandWithFinnhub(
    volume: number,
    bars: Bar[],
    shareOutstanding: number
  ): { score: number; maxScore: number; description: string } {
    // Convert to millions
    const sharesInMillions = shareOutstanding;
    
    if (!sharesInMillions || sharesInMillions <= 0) {
      return { score: 0, maxScore: 10, description: 'N/A - Shares outstanding data unavailable' };
    }

    // CANSLIM prefers smaller float
    let score = 0;
    let description = '';

    if (sharesInMillions < 25) {
      score = 10;
      description = `Excellent: ${sharesInMillions.toFixed(1)}M shares (micro-cap float)`;
    } else if (sharesInMillions < 100) {
      score = 8;
      description = `Good: ${sharesInMillions.toFixed(1)}M shares (small float)`;
    } else if (sharesInMillions < 500) {
      score = 6;
      description = `Moderate: ${sharesInMillions.toFixed(1)}M shares`;
    } else if (sharesInMillions < 2000) {
      score = 4;
      description = `Large: ${(sharesInMillions / 1000).toFixed(2)}B shares`;
    } else {
      score = 2;
      description = `Very large: ${(sharesInMillions / 1000).toFixed(2)}B shares (mega-cap)`;
    }

    return { score, maxScore: 10, description };
  }

  /**
   * Score leader/laggard using Finnhub relative strength vs S&P 500
   */
  private static scoreLeaderOrLaggardWithFinnhub(
    financials: FinnhubBasicFinancials
  ): { score: number; maxScore: number; description: string } {
    const metric = financials.metric;
    
    // Use relative performance vs S&P 500 (52 week)
    const relStrength52W = metric.priceRelativeToSP50052Week;
    const returnDaily52W = metric['52WeekPriceReturnDaily'];
    
    if (relStrength52W !== undefined && !isNaN(relStrength52W)) {
      // relStrength52W is the % difference vs S&P 500
      if (relStrength52W >= 30) {
        return { score: 10, maxScore: 10, description: `Market leader: +${relStrength52W.toFixed(1)}% vs S&P 500 (52W)` };
      }
      if (relStrength52W >= 15) {
        return { score: 8, maxScore: 10, description: `Strong performer: +${relStrength52W.toFixed(1)}% vs S&P 500 (52W)` };
      }
      if (relStrength52W >= 0) {
        return { score: 6, maxScore: 10, description: `Outperforming: +${relStrength52W.toFixed(1)}% vs S&P 500 (52W)` };
      }
      if (relStrength52W >= -15) {
        return { score: 4, maxScore: 10, description: `Underperforming: ${relStrength52W.toFixed(1)}% vs S&P 500 (52W)` };
      }
      return { score: 2, maxScore: 10, description: `Laggard: ${relStrength52W.toFixed(1)}% vs S&P 500 (52W)` };
    }
    
    // Fall back to absolute 52-week return
    if (returnDaily52W !== undefined && !isNaN(returnDaily52W)) {
      if (returnDaily52W >= 50) {
        return { score: 10, maxScore: 10, description: `Strong: +${returnDaily52W.toFixed(1)}% (52W return)` };
      }
      if (returnDaily52W >= 25) {
        return { score: 8, maxScore: 10, description: `Good: +${returnDaily52W.toFixed(1)}% (52W return)` };
      }
      if (returnDaily52W >= 0) {
        return { score: 6, maxScore: 10, description: `Positive: +${returnDaily52W.toFixed(1)}% (52W return)` };
      }
      if (returnDaily52W >= -20) {
        return { score: 4, maxScore: 10, description: `Weak: ${returnDaily52W.toFixed(1)}% (52W return)` };
      }
      return { score: 2, maxScore: 10, description: `Poor: ${returnDaily52W.toFixed(1)}% (52W return)` };
    }

    return { score: 0, maxScore: 10, description: 'N/A - Relative strength data unavailable' };
  }

  /**
   * Score market direction using Finnhub S&P 500 performance data
   */
  private static scoreMarketDirectionWithFinnhub(
    financials: FinnhubBasicFinancials
  ): { score: number; maxScore: number; description: string } {
    const metric = financials.metric;
    
    // Use price relative to S&P 500 over different periods to gauge market
    const rel4W = metric.priceRelativeToSP5004Week;
    const rel13W = metric.priceRelativeToSP50013Week;
    const stockReturn = metric['52WeekPriceReturnDaily'];
    
    // If stock is outperforming S&P recently, market is likely favorable for this stock
    if (rel4W !== undefined && rel13W !== undefined) {
      const avgRel = (rel4W + rel13W) / 2;
      
      if (avgRel >= 10 && stockReturn !== undefined && stockReturn > 0) {
        return { score: 10, maxScore: 10, description: `Favorable: Stock +${avgRel.toFixed(1)}% vs market (avg 4W/13W)` };
      }
      if (avgRel >= 0) {
        return { score: 8, maxScore: 10, description: `Positive: Stock +${avgRel.toFixed(1)}% vs market (avg 4W/13W)` };
      }
      if (avgRel >= -10) {
        return { score: 5, maxScore: 10, description: `Neutral: Stock ${avgRel.toFixed(1)}% vs market (avg 4W/13W)` };
      }
      return { score: 3, maxScore: 10, description: `Unfavorable: Stock ${avgRel.toFixed(1)}% vs market (avg 4W/13W)` };
    }

    // Fall back to absolute return
    if (stockReturn !== undefined && !isNaN(stockReturn)) {
      if (stockReturn > 20) return { score: 10, maxScore: 10, description: `Strong momentum: +${stockReturn.toFixed(1)}% (52W)` };
      if (stockReturn > 0) return { score: 7, maxScore: 10, description: `Positive trend: +${stockReturn.toFixed(1)}% (52W)` };
      if (stockReturn > -10) return { score: 4, maxScore: 10, description: `Weak trend: ${stockReturn.toFixed(1)}% (52W)` };
      return { score: 2, maxScore: 10, description: `Downtrend: ${stockReturn.toFixed(1)}% (52W)` };
    }

    return { score: 0, maxScore: 10, description: 'N/A - Market direction data unavailable' };
  }

  /**
   * Helper to grade earnings growth consistently
   */
  private static gradeEarningsGrowth(
    growth: number,
    label: string,
    maxScore: number
  ): { score: number; maxScore: number; description: string } {
    // CANSLIM target: 25%+ growth
    if (growth >= 40) {
      return { score: maxScore, maxScore, description: `Excellent ${label}: +${growth.toFixed(1)}%` };
    }
    if (growth >= 25) {
      return { score: Math.round(maxScore * 0.9), maxScore, description: `Strong ${label}: +${growth.toFixed(1)}%` };
    }
    if (growth >= 15) {
      return { score: Math.round(maxScore * 0.7), maxScore, description: `Good ${label}: +${growth.toFixed(1)}%` };
    }
    if (growth >= 5) {
      return { score: Math.round(maxScore * 0.5), maxScore, description: `Moderate ${label}: +${growth.toFixed(1)}%` };
    }
    if (growth >= 0) {
      return { score: Math.round(maxScore * 0.3), maxScore, description: `Weak ${label}: +${growth.toFixed(1)}%` };
    }
    return { score: Math.round(maxScore * 0.1), maxScore, description: `Negative ${label}: ${growth.toFixed(1)}%` };
  }

  // ========================================
  // ALPHA VANTAGE SCORING METHODS (Fallback)
  // ========================================

  /**
   * Score quarterly earnings using REAL earnings data from Alpha Vantage
   */
  private static scoreCurrentQuarterlyEarningsWithData(earnings: EarningsData): { score: number; maxScore: number; description: string } {
    if (!earnings.quarterlyEarnings || earnings.quarterlyEarnings.length < 2) {
      return { score: 0, maxScore: 15, description: 'Insufficient quarterly earnings data' };
    }

    // Get the two most recent quarters
    const quarters = earnings.quarterlyEarnings.slice(0, 2);
    const currentQuarter = quarters[0];
    const previousQuarter = quarters[1];

    const currentEPS = parseFloat(currentQuarter.reportedEPS);
    const previousEPS = parseFloat(previousQuarter.reportedEPS);

    if (isNaN(currentEPS) || isNaN(previousEPS) || previousEPS === 0) {
      return { score: 0, maxScore: 15, description: 'Invalid earnings data' };
    }

    const growthPercent = ((currentEPS - previousEPS) / Math.abs(previousEPS)) * 100;

    // CANSLIM target: 25%+ growth
    if (growthPercent >= 25) {
      return { 
        score: 15, 
        maxScore: 15, 
        description: `Strong quarterly EPS growth: ${growthPercent.toFixed(1)}% (${currentQuarter.fiscalDateEnding})` 
      };
    }
    if (growthPercent >= 15) {
      return { 
        score: 12, 
        maxScore: 15, 
        description: `Good quarterly EPS growth: ${growthPercent.toFixed(1)}% (${currentQuarter.fiscalDateEnding})` 
      };
    }
    if (growthPercent >= 5) {
      return { 
        score: 8, 
        maxScore: 15, 
        description: `Moderate quarterly EPS growth: ${growthPercent.toFixed(1)}% (${currentQuarter.fiscalDateEnding})` 
      };
    }
    if (growthPercent >= 0) {
      return { 
        score: 5, 
        maxScore: 15, 
        description: `Weak quarterly EPS growth: ${growthPercent.toFixed(1)}% (${currentQuarter.fiscalDateEnding})` 
      };
    }
    return { 
      score: 2, 
      maxScore: 15, 
      description: `Negative quarterly EPS growth: ${growthPercent.toFixed(1)}% (${currentQuarter.fiscalDateEnding})` 
    };
  }

  private static scoreCurrentQuarterlyEarnings(bars: Bar[]): { score: number; maxScore: number; description: string } {
    // Use last 3 months (approx 60 trading days) price performance as proxy
    // Fall back to available data if less than 60 bars
    const recentBars = bars.slice(-Math.min(60, bars.length));
    if (recentBars.length < 1) {
      return { score: 0, maxScore: 15, description: 'Insufficient data for quarterly analysis' };
    }
    
    // If only one bar, use its price change as a proxy
    if (recentBars.length === 1) {
      const bar = recentBars[0];
      const priceChange = bar.c > bar.o ? ((bar.c - bar.o) / bar.o) * 100 : 0;
      return { 
        score: priceChange > 0 ? 5 : 2, 
        maxScore: 15, 
        description: `Single day data: ${priceChange > 0 ? 'positive' : 'negative'} price movement` 
      };
    }

    const startPrice = recentBars[0].c;
    const endPrice = recentBars[recentBars.length - 1].c;
    if (!startPrice || startPrice === 0) {
      return { score: 0, maxScore: 15, description: 'Invalid price data' };
    }
    const changePercent = ((endPrice - startPrice) / startPrice) * 100;
    
    // Adjust label based on available data
    const period = recentBars.length >= 60 ? 'quarterly' : recentBars.length >= 20 ? `${Math.floor(recentBars.length/5)}-week` : `${recentBars.length}-day`;

    // Target: 25%+ growth
    if (changePercent >= 25) return { score: 15, maxScore: 15, description: `Strong ${period} momentum: +${changePercent.toFixed(1)}%` };
    if (changePercent >= 15) return { score: 12, maxScore: 15, description: `Good ${period} momentum: +${changePercent.toFixed(1)}%` };
    if (changePercent >= 5) return { score: 8, maxScore: 15, description: `Moderate ${period} momentum: +${changePercent.toFixed(1)}%` };
    if (changePercent >= 0) return { score: 5, maxScore: 15, description: `Weak ${period} momentum: +${changePercent.toFixed(1)}%` };
    return { score: 2, maxScore: 15, description: `Negative ${period} momentum: ${changePercent.toFixed(1)}%` };
  }

  /**
   * Score annual earnings using REAL earnings data from Alpha Vantage
   */
  private static scoreAnnualEarningsGrowthWithData(earnings: EarningsData): { score: number; maxScore: number; description: string } {
    if (!earnings.annualEarnings || earnings.annualEarnings.length < 2) {
      return { score: 0, maxScore: 15, description: 'Insufficient annual earnings data (need at least 2 years)' };
    }

    // Get the two most recent years
    const years = earnings.annualEarnings.slice(0, 2);
    const currentYear = years[0];
    const previousYear = years[1];

    const currentEPS = parseFloat(currentYear.reportedEPS);
    const previousEPS = parseFloat(previousYear.reportedEPS);

    if (isNaN(currentEPS) || isNaN(previousEPS) || previousEPS === 0) {
      return { score: 0, maxScore: 15, description: 'Invalid annual earnings data' };
    }

    const growthPercent = ((currentEPS - previousEPS) / Math.abs(previousEPS)) * 100;

    // CANSLIM target: 25%+ annual growth
    if (growthPercent >= 25) {
      return { 
        score: 15, 
        maxScore: 15, 
        description: `Strong annual EPS growth: ${growthPercent.toFixed(1)}% (${currentYear.fiscalDateEnding})` 
      };
    }
    if (growthPercent >= 15) {
      return { 
        score: 12, 
        maxScore: 15, 
        description: `Good annual EPS growth: ${growthPercent.toFixed(1)}% (${currentYear.fiscalDateEnding})` 
      };
    }
    if (growthPercent >= 5) {
      return { 
        score: 8, 
        maxScore: 15, 
        description: `Moderate annual EPS growth: ${growthPercent.toFixed(1)}% (${currentYear.fiscalDateEnding})` 
      };
    }
    if (growthPercent >= 0) {
      return { 
        score: 5, 
        maxScore: 15, 
        description: `Weak annual EPS growth: ${growthPercent.toFixed(1)}% (${currentYear.fiscalDateEnding})` 
      };
    }
    return { 
      score: 2, 
      maxScore: 15, 
      description: `Negative annual EPS growth: ${growthPercent.toFixed(1)}% (${currentYear.fiscalDateEnding})` 
    };
  }

  private static scoreAnnualEarningsGrowth(bars: Bar[]): { score: number; maxScore: number; description: string } {
    // Use last year (approx 252 trading days) price performance
    // Fall back to available data if less than 252 bars
    const annualBars = bars.slice(-Math.min(252, bars.length));
    if (annualBars.length < 2) {
      // If we have at least 2 bars, use them for comparison
      if (annualBars.length === 1) {
        return { score: 5, maxScore: 15, description: 'Insufficient data for annual analysis (single day)' };
      }
      return { score: 0, maxScore: 15, description: 'Insufficient data for annual analysis' };
    }

    const startPrice = annualBars[0].c;
    const endPrice = annualBars[annualBars.length - 1].c;
    const changePercent = ((endPrice - startPrice) / startPrice) * 100;
    
    // Adjust label based on available data
    const period = annualBars.length >= 200 ? 'annual' : `${annualBars.length}-day`;

    // Target: 25%+ annual growth (scaled for shorter periods)
    if (changePercent >= 25) return { score: 15, maxScore: 15, description: `Strong ${period} growth: +${changePercent.toFixed(1)}%` };
    if (changePercent >= 15) return { score: 12, maxScore: 15, description: `Good ${period} growth: +${changePercent.toFixed(1)}%` };
    if (changePercent >= 5) return { score: 8, maxScore: 15, description: `Moderate ${period} growth: +${changePercent.toFixed(1)}%` };
    if (changePercent >= 0) return { score: 5, maxScore: 15, description: `Weak ${period} growth: +${changePercent.toFixed(1)}%` };
    return { score: 2, maxScore: 15, description: `Negative ${period} growth: ${changePercent.toFixed(1)}%` };
  }

  private static scoreNewHighs(currentPrice: number, bars: Bar[]): { score: number; maxScore: number; description: string } {
    if (bars.length < 1) {
      return { score: 0, maxScore: 15, description: 'Insufficient data' };
    }

    const validBars = bars.filter(b => b && !isNaN(b.h) && b.h > 0);
    if (validBars.length < 1) {
      return { score: 0, maxScore: 15, description: 'Invalid high price data' };
    }
    
    // If only one bar, use its high as comparison
    if (validBars.length === 1) {
      const bar = validBars[0];
      const percentFromHigh = ((currentPrice - bar.h) / bar.h) * 100;
      if (percentFromHigh >= -5) {
        return { score: 12, maxScore: 15, description: 'Trading near high (limited data)' };
      }
      return { score: 6, maxScore: 15, description: `Currently ${Math.abs(percentFromHigh).toFixed(1)}% below high` };
    }

    const recentHighs = validBars.slice(-Math.min(60, validBars.length)).map(b => b.h);
    const allTimeHigh = Math.max(...validBars.map(b => b.h));
    const recentHigh = Math.max(...recentHighs);

    // Check if near or at new highs
    const percentFromHigh = ((currentPrice - allTimeHigh) / allTimeHigh) * 100;
    const isNearHigh = percentFromHigh >= -5; // Within 5% of all-time high

    if (isNearHigh && currentPrice >= recentHigh * 0.95) {
      return { score: 15, maxScore: 15, description: 'Trading near new highs' };
    }
    if (isNearHigh) {
      return { score: 12, maxScore: 15, description: 'Approaching new highs' };
    }
    if (percentFromHigh >= -15) {
      return { score: 8, maxScore: 15, description: 'Moderate distance from highs' };
    }
    return { score: 4, maxScore: 15, description: 'Well below highs' };
  }

  /**
   * Score supply and demand using REAL shares outstanding data
   */
  private static scoreSupplyAndDemandWithData(
    volume: number, 
    bars: Bar[], 
    sharesOutstanding: string
  ): { score: number; maxScore: number; description: string } {
    const shares = parseFloat(sharesOutstanding);
    
    if (isNaN(shares) || shares <= 0) {
      // Fall back to volume-based scoring
      return this.scoreSupplyAndDemand(volume, bars);
    }

    // Convert to millions for easier reading
    const sharesInMillions = shares / 1000000;
    
    // CANSLIM prefers smaller float (less supply = better)
    // Generally: < 50M shares = excellent, 50-200M = good, 200-500M = moderate, > 500M = poor
    let score = 0;
    let description = '';

    if (sharesInMillions < 50) {
      score = 10;
      description = `Excellent: ${sharesInMillions.toFixed(1)}M shares outstanding (low float)`;
    } else if (sharesInMillions < 200) {
      score = 8;
      description = `Good: ${sharesInMillions.toFixed(1)}M shares outstanding`;
    } else if (sharesInMillions < 500) {
      score = 6;
      description = `Moderate: ${sharesInMillions.toFixed(1)}M shares outstanding`;
    } else {
      score = 3;
      description = `High float: ${sharesInMillions.toFixed(1)}M shares outstanding`;
    }

    // Factor in volume activity
    if (bars.length >= 2) {
      const recentBars = bars.slice(-Math.min(20, bars.length));
      const avgVolume = recentBars.reduce((sum, b) => sum + b.v, 0) / recentBars.length;
      const volumeRatio = volume / avgVolume;
      
      if (volumeRatio >= 1.5) {
        score = Math.min(10, score + 1); // Boost score for high volume
        description += `, strong volume activity`;
      }
    }

    return { score, maxScore: 10, description };
  }

  private static scoreSupplyAndDemand(volume: number, bars: Bar[]): { score: number; maxScore: number; description: string } {
    if (bars.length < 1) {
      return { score: 0, maxScore: 10, description: 'Insufficient data' };
    }

    const recentBars = bars.slice(-Math.min(20, bars.length)).filter(b => b && !isNaN(b.v) && b.v >= 0);
    if (recentBars.length === 0) {
      // If no volume data, give a neutral score
      return { score: 5, maxScore: 10, description: 'No volume data available' };
    }

    const avgVolume = recentBars.reduce((sum, b) => sum + b.v, 0) / recentBars.length;
    if (avgVolume === 0) {
      return { score: 0, maxScore: 10, description: 'Zero average volume' };
    }
    const volumeRatio = volume / avgVolume;

    // Higher volume on up days indicates strong demand
    const upDays = recentBars.filter(b => b.c > b.o);
    const avgUpVolume = upDays.length > 0 
      ? upDays.reduce((sum, b) => sum + b.v, 0) / upDays.length 
      : 0;

    if (volumeRatio >= 1.5 && avgUpVolume > avgVolume * 1.2) {
      return { score: 10, maxScore: 10, description: 'Strong demand, high volume on advances' };
    }
    if (volumeRatio >= 1.2) {
      return { score: 8, maxScore: 10, description: 'Good volume activity' };
    }
    if (volumeRatio >= 0.8) {
      return { score: 6, maxScore: 10, description: 'Average volume' };
    }
    return { score: 3, maxScore: 10, description: 'Low volume, weak demand' };
  }

  private static scoreLeaderOrLaggard(bars: Bar[]): { score: number; maxScore: number; description: string } {
    if (bars.length < 2) {
      if (bars.length === 1) {
        return { score: 5, maxScore: 10, description: 'Insufficient data for relative performance (single day)' };
      }
      return { score: 0, maxScore: 10, description: 'Insufficient data' };
    }

    // Compare recent performance vs earlier period
    // Adjust window sizes based on available data
    const halfLength = Math.max(1, Math.floor(bars.length / 2));
    const recentBars = bars.slice(-halfLength);
    const earlierBars = bars.slice(-bars.length, -halfLength);
    
    if (recentBars.length < 2 || !recentBars[0].c || recentBars[0].c === 0) {
      return { score: 0, maxScore: 10, description: 'Invalid recent price data' };
    }

    const recentReturn = ((recentBars[recentBars.length - 1].c - recentBars[0].c) / recentBars[0].c) * 100;
    const earlierReturn = earlierBars.length >= 2 && earlierBars[0].c > 0
      ? ((earlierBars[earlierBars.length - 1].c - earlierBars[0].c) / earlierBars[0].c) * 100
      : 0;

    // Leaders outperform consistently
    if (recentReturn > 10 && recentReturn > earlierReturn) {
      return { score: 10, maxScore: 10, description: 'Market leader - strong outperformance' };
    }
    if (recentReturn > 5) {
      return { score: 8, maxScore: 10, description: 'Good relative performance' };
    }
    if (recentReturn > 0) {
      return { score: 6, maxScore: 10, description: 'Moderate performance' };
    }
    return { score: 3, maxScore: 10, description: 'Laggard - underperforming' };
  }

  private static scoreInstitutionalSponsorship(volume: number, bars: Bar[]): { score: number; maxScore: number; description: string } {
    if (bars.length < 1) {
      return { score: 0, maxScore: 10, description: 'Insufficient data' };
    }

    // Look for consistent high volume (institutional buying)
    const recentBars = bars.slice(-Math.min(20, bars.length)).filter(b => b && !isNaN(b.v) && b.v >= 0);
    if (recentBars.length === 0) {
      return { score: 0, maxScore: 10, description: 'No valid volume data' };
    }

    const avgVolume = recentBars.reduce((sum, b) => sum + b.v, 0) / recentBars.length;
    if (avgVolume === 0) {
      return { score: 0, maxScore: 10, description: 'Zero average volume' };
    }

    const highVolumeDays = recentBars.filter(b => b.v > avgVolume * 1.5).length;
    
    // Scale thresholds based on available data
    const scaleFactor = recentBars.length / 20;

    if (highVolumeDays >= Math.ceil(8 * scaleFactor) && volume > avgVolume) {
      return { score: 10, maxScore: 10, description: 'Strong institutional interest' };
    }
    if (highVolumeDays >= Math.ceil(5 * scaleFactor)) {
      return { score: 8, maxScore: 10, description: 'Moderate institutional activity' };
    }
    if (highVolumeDays >= Math.ceil(3 * scaleFactor)) {
      return { score: 6, maxScore: 10, description: 'Some institutional interest' };
    }
    return { score: 3, maxScore: 10, description: 'Limited institutional sponsorship' };
  }

  private static scoreMarketDirection(bars: Bar[]): { score: number; maxScore: number; description: string } {
    if (bars.length < 2) {
      if (bars.length === 1) {
        const bar = bars[0];
        const isUp = bar.c > bar.o;
        return { 
          score: isUp ? 6 : 4, 
          maxScore: 10, 
          description: `Single day: ${isUp ? 'up' : 'down'} day (limited data)` 
        };
      }
      return { score: 0, maxScore: 10, description: 'Insufficient data' };
    }

    // Check recent trend
    const recentBars = bars.slice(-Math.min(20, bars.length)).filter(b => b && !isNaN(b.c) && b.c > 0);
    if (recentBars.length < 2) {
      return { score: 0, maxScore: 10, description: 'Invalid price data' };
    }

    const startPrice = recentBars[0].c;
    const endPrice = recentBars[recentBars.length - 1].c;
    if (!startPrice || startPrice === 0) {
      return { score: 0, maxScore: 10, description: 'Invalid start price' };
    }
    const trend = ((endPrice - startPrice) / startPrice) * 100;

    // Count up days vs down days
    const upDays = recentBars.filter(b => b && b.c > b.o).length;
    const downDays = recentBars.filter(b => b && b.c < b.o).length;

    if (trend > 5 && upDays > downDays * 1.5) {
      return { score: 10, maxScore: 10, description: 'Strong uptrend' };
    }
    if (trend > 2 && upDays > downDays) {
      return { score: 8, maxScore: 10, description: 'Moderate uptrend' };
    }
    if (trend > 0) {
      return { score: 6, maxScore: 10, description: 'Slight uptrend' };
    }
    if (trend > -5) {
      return { score: 4, maxScore: 10, description: 'Sideways/weak trend' };
    }
    return { score: 2, maxScore: 10, description: 'Downtrend' };
  }

  private static getDefaultScore(reason: string): CANSLIMScore {
    const defaultScore = { score: 0, maxScore: 15, description: reason };
    return {
      overallGrade: 'F',
      scores: {
        c: defaultScore,
        a: defaultScore,
        n: defaultScore,
        s: { score: 0, maxScore: 10, description: reason },
        l: { score: 0, maxScore: 10, description: reason },
        i: { score: 0, maxScore: 10, description: reason },
        m: { score: 0, maxScore: 10, description: reason },
      },
      totalScore: 0,
      maxTotalScore: 85,
    };
  }
}
