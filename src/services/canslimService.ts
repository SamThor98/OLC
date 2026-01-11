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
    if (!historicalBars || historicalBars.length < 20) {
      return this.getDefaultScore('Insufficient historical data');
    }

    // Sort bars by date (oldest first)
    const sortedBars = [...historicalBars].sort((a, b) => 
      new Date(a.t).getTime() - new Date(b.t).getTime()
    );

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
    const recentBars = bars.slice(-60);
    if (recentBars.length < 20) {
      return { score: 0, maxScore: 15, description: 'Insufficient data for quarterly analysis' };
    }

    const startPrice = recentBars[0].c;
    const endPrice = recentBars[recentBars.length - 1].c;
    const changePercent = ((endPrice - startPrice) / startPrice) * 100;

    // Target: 25%+ growth
    if (changePercent >= 25) return { score: 15, maxScore: 15, description: `Strong quarterly momentum: +${changePercent.toFixed(1)}%` };
    if (changePercent >= 15) return { score: 12, maxScore: 15, description: `Good quarterly momentum: +${changePercent.toFixed(1)}%` };
    if (changePercent >= 5) return { score: 8, maxScore: 15, description: `Moderate quarterly momentum: +${changePercent.toFixed(1)}%` };
    if (changePercent >= 0) return { score: 5, maxScore: 15, description: `Weak quarterly momentum: +${changePercent.toFixed(1)}%` };
    return { score: 2, maxScore: 15, description: `Negative quarterly momentum: ${changePercent.toFixed(1)}%` };
  }

  private static scoreAnnualEarningsGrowth(bars: Bar[]): { score: number; maxScore: number; description: string } {
    // Use last year (approx 252 trading days) price performance
    const annualBars = bars.slice(-252);
    if (annualBars.length < 50) {
      return { score: 0, maxScore: 15, description: 'Insufficient data for annual analysis' };
    }

    const startPrice = annualBars[0].c;
    const endPrice = annualBars[annualBars.length - 1].c;
    const changePercent = ((endPrice - startPrice) / startPrice) * 100;

    // Target: 25%+ annual growth
    if (changePercent >= 25) return { score: 15, maxScore: 15, description: `Strong annual growth: +${changePercent.toFixed(1)}%` };
    if (changePercent >= 15) return { score: 12, maxScore: 15, description: `Good annual growth: +${changePercent.toFixed(1)}%` };
    if (changePercent >= 5) return { score: 8, maxScore: 15, description: `Moderate annual growth: +${changePercent.toFixed(1)}%` };
    if (changePercent >= 0) return { score: 5, maxScore: 15, description: `Weak annual growth: +${changePercent.toFixed(1)}%` };
    return { score: 2, maxScore: 15, description: `Negative annual growth: ${changePercent.toFixed(1)}%` };
  }

  private static scoreNewHighs(currentPrice: number, bars: Bar[]): { score: number; maxScore: number; description: string } {
    if (bars.length < 20) {
      return { score: 0, maxScore: 15, description: 'Insufficient data' };
    }

    const recentHighs = bars.slice(-60).map(b => b.h);
    const allTimeHigh = Math.max(...bars.map(b => b.h));
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
    if (bars.length < 20) {
      return { score: 0, maxScore: 10, description: 'Insufficient data' };
    }

    const avgVolume = bars.slice(-20).reduce((sum, b) => sum + b.v, 0) / 20;
    const volumeRatio = volume / avgVolume;

    // Higher volume on up days indicates strong demand
    const recentBars = bars.slice(-20);
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
    if (bars.length < 60) {
      return { score: 0, maxScore: 10, description: 'Insufficient data' };
    }

    // Compare recent performance vs earlier period
    const recentBars = bars.slice(-30);
    const earlierBars = bars.slice(-60, -30);
    
    const recentReturn = ((recentBars[recentBars.length - 1].c - recentBars[0].c) / recentBars[0].c) * 100;
    const earlierReturn = earlierBars.length > 0 
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
    if (bars.length < 20) {
      return { score: 0, maxScore: 10, description: 'Insufficient data' };
    }

    // Look for consistent high volume (institutional buying)
    const recentBars = bars.slice(-20);
    const avgVolume = recentBars.reduce((sum, b) => sum + b.v, 0) / 20;
    const highVolumeDays = recentBars.filter(b => b.v > avgVolume * 1.5).length;

    if (highVolumeDays >= 8 && volume > avgVolume) {
      return { score: 10, maxScore: 10, description: 'Strong institutional interest' };
    }
    if (highVolumeDays >= 5) {
      return { score: 8, maxScore: 10, description: 'Moderate institutional activity' };
    }
    if (highVolumeDays >= 3) {
      return { score: 6, maxScore: 10, description: 'Some institutional interest' };
    }
    return { score: 3, maxScore: 10, description: 'Limited institutional sponsorship' };
  }

  private static scoreMarketDirection(bars: Bar[]): { score: number; maxScore: number; description: string } {
    if (bars.length < 20) {
      return { score: 0, maxScore: 10, description: 'Insufficient data' };
    }

    // Check recent trend
    const recentBars = bars.slice(-20);
    const startPrice = recentBars[0].c;
    const endPrice = recentBars[recentBars.length - 1].c;
    const trend = ((endPrice - startPrice) / startPrice) * 100;

    // Count up days vs down days
    const upDays = recentBars.filter(b => b.c > b.o).length;
    const downDays = recentBars.filter(b => b.c < b.o).length;

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
