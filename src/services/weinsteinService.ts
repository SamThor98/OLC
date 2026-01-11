import { Bar } from './alpacaService';

export type WeinsteinStage = 1 | 2 | 3 | 4;

export interface WeinsteinAnalysis {
  stage: WeinsteinStage;
  stageName: string;
  description: string;
  thirtyWeekMA: number;
  currentPrice: number;
  priceVsMA: number; // Percentage above/below MA
  trendStrength: 'Strong' | 'Moderate' | 'Weak';
  volatility: 'High' | 'Medium' | 'Low';
}

/**
 * Weinstein Stage Analysis Service
 * Based on Stan Weinstein's Stage Analysis methodology
 * 
 * Stage 1: Accumulation (Base Building) - Price consolidating, low volatility
 * Stage 2: Advancing (Uptrend) - Price above 30-week MA, uptrending
 * Stage 3: Distribution (Topping) - High volatility, topping pattern
 * Stage 4: Declining (Downtrend) - Price below 30-week MA, downtrending
 */
export class WeinsteinService {
  /**
   * Calculate 30-week moving average (approximately 150 trading days)
   */
  static calculate30WeekMA(bars: Bar[]): number {
    if (!bars || bars.length < 30) {
      return 0;
    }

    // Use last 150 trading days (approximately 30 weeks)
    const relevantBars = bars.slice(-150);
    const sum = relevantBars.reduce((acc, bar) => acc + bar.c, 0);
    return sum / relevantBars.length;
  }

  /**
   * Calculate volatility (standard deviation of returns)
   */
  static calculateVolatility(bars: Bar[]): number {
    if (!bars || bars.length < 20) {
      return 0;
    }

    const recentBars = bars.slice(-20);
    const returns = recentBars.map((bar, index) => {
      if (index === 0) return 0;
      return (bar.c - recentBars[index - 1].c) / recentBars[index - 1].c;
    });

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * 100; // Return as percentage
  }

  /**
   * Determine the Weinstein stage
   */
  static analyzeStage(
    currentPrice: number,
    historicalBars: Bar[]
  ): WeinsteinAnalysis {
    if (!historicalBars || historicalBars.length < 150) {
      return {
        stage: 1,
        stageName: 'Insufficient Data',
        description: 'Not enough historical data for stage analysis (need 30+ weeks)',
        thirtyWeekMA: 0,
        currentPrice,
        priceVsMA: 0,
        trendStrength: 'Weak',
        volatility: 'Low',
      };
    }

    // Sort bars by date (oldest first)
    const sortedBars = [...historicalBars].sort((a, b) => 
      new Date(a.t).getTime() - new Date(b.t).getTime()
    );

    const thirtyWeekMA = this.calculate30WeekMA(sortedBars);
    const priceVsMA = ((currentPrice - thirtyWeekMA) / thirtyWeekMA) * 100;
    const volatility = this.calculateVolatility(sortedBars);

    // Analyze recent trend
    const recentBars = sortedBars.slice(-30);
    const trend = this.analyzeTrend(recentBars);
    const trendStrength = this.getTrendStrength(recentBars, trend);

    // Determine volatility level
    const volatilityLevel: 'High' | 'Medium' | 'Low' = 
      volatility > 3 ? 'High' : volatility > 1.5 ? 'Medium' : 'Low';

    // Determine stage based on Weinstein criteria
    const stage = this.determineStage(
      currentPrice,
      thirtyWeekMA,
      priceVsMA,
      trend,
      volatilityLevel,
      recentBars
    );

    return {
      stage,
      stageName: this.getStageName(stage),
      description: this.getStageDescription(stage, priceVsMA, trendStrength),
      thirtyWeekMA,
      currentPrice,
      priceVsMA,
      trendStrength,
      volatility: volatilityLevel,
    };
  }

  private static analyzeTrend(bars: Bar[]): number {
    if (bars.length < 10) return 0;

    const startPrice = bars[0].c;
    const endPrice = bars[bars.length - 1].c;
    return ((endPrice - startPrice) / startPrice) * 100;
  }

  private static getTrendStrength(bars: Bar[], trend: number): 'Strong' | 'Moderate' | 'Weak' {
    if (Math.abs(trend) > 10) return 'Strong';
    if (Math.abs(trend) > 5) return 'Moderate';
    return 'Weak';
  }

  private static determineStage(
    currentPrice: number,
    ma30: number,
    priceVsMA: number,
    trend: number,
    volatility: 'High' | 'Medium' | 'Low',
    recentBars: Bar[]
  ): WeinsteinStage {
    // Stage 2: Advancing - Price above 30-week MA and in uptrend
    if (priceVsMA > 0 && trend > 2) {
      // Check if it's a strong uptrend
      const upDays = recentBars.filter(b => b.c > b.o).length;
      const downDays = recentBars.filter(b => b.c < b.o).length;
      
      if (upDays > downDays * 1.2) {
        return 2; // Advancing
      }
    }

    // Stage 4: Declining - Price below 30-week MA and in downtrend
    if (priceVsMA < 0 && trend < -2) {
      const downDays = recentBars.filter(b => b.c < b.o).length;
      const upDays = recentBars.filter(b => b.c > b.o).length;
      
      if (downDays > upDays * 1.2) {
        return 4; // Declining
      }
    }

    // Stage 3: Distribution - High volatility, topping pattern, near highs but weakening
    if (volatility === 'High' && priceVsMA > -5) {
      // Check for topping pattern (making highs but with weakening momentum)
      const highs = recentBars.map(b => b.h);
      const recentHigh = Math.max(...highs);
      const isNearHigh = currentPrice >= recentHigh * 0.95;
      
      if (isNearHigh && trend < 3 && trend > -3) {
        return 3; // Distribution
      }
    }

    // Stage 1: Accumulation - Everything else (base building, consolidation)
    return 1; // Accumulation
  }

  private static getStageName(stage: WeinsteinStage): string {
    switch (stage) {
      case 1:
        return 'Stage 1: Accumulation';
      case 2:
        return 'Stage 2: Advancing';
      case 3:
        return 'Stage 3: Distribution';
      case 4:
        return 'Stage 4: Declining';
      default:
        return 'Unknown Stage';
    }
  }

  private static getStageDescription(
    stage: WeinsteinStage,
    priceVsMA: number,
    trendStrength: 'Strong' | 'Moderate' | 'Weak'
  ): string {
    switch (stage) {
      case 1:
        return `Base building phase. Price is consolidating with ${trendStrength.toLowerCase()} trend. Look for accumulation patterns before potential breakout.`;
      case 2:
        return `Uptrend phase. Price is ${priceVsMA.toFixed(1)}% above 30-week MA with ${trendStrength.toLowerCase()} momentum. This is typically the best time to buy.`;
      case 3:
        return `Distribution phase. High volatility and topping pattern detected. Price may be near highs but showing weakening momentum. Consider taking profits.`;
      case 4:
        return `Downtrend phase. Price is ${Math.abs(priceVsMA).toFixed(1)}% below 30-week MA with ${trendStrength.toLowerCase()} downward momentum. Avoid buying, consider shorting or waiting.`;
      default:
        return 'Unable to determine stage.';
    }
  }
}
