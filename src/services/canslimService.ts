import { Bar } from './alpacaService';

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
 * Note: Some criteria require earnings data which isn't available from Alpaca.
 * This implementation uses price/volume data as proxies where possible.
 */
export class CANSLIMService {
  /**
   * Calculate CANSLIM score based on available market data
   */
  static calculateScore(
    currentPrice: number,
    historicalBars: Bar[],
    volume: number
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
      // Note: Without earnings data, we use price momentum as a proxy
      c: this.scoreCurrentQuarterlyEarnings(sortedBars),
      
      // A: Annual earnings growth - should be up 25%+ over last 3 years
      // Note: Without earnings data, we use annual price appreciation
      a: this.scoreAnnualEarningsGrowth(sortedBars),
      
      // N: New products, new management, new highs
      // Check if stock is making new highs
      n: this.scoreNewHighs(currentPrice, sortedBars),
      
      // S: Supply and demand - small number of shares outstanding
      // Use volume patterns as proxy
      s: this.scoreSupplyAndDemand(volume, sortedBars),
      
      // L: Leader or laggard - should be a market leader
      // Compare price performance vs average
      l: this.scoreLeaderOrLaggard(sortedBars),
      
      // I: Institutional sponsorship - should have institutional backing
      // Use volume patterns as proxy for institutional activity
      i: this.scoreInstitutionalSponsorship(volume, sortedBars),
      
      // M: Market direction - overall market should be in uptrend
      // Use recent price trend
      m: this.scoreMarketDirection(sortedBars),
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
