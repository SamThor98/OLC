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
   * Calculate moving average (30-week ideal = 150 trading days, but adapts to available data)
   */
  static calculate30WeekMA(bars: Bar[]): number {
    if (!bars || bars.length < 10) {
      return 0;
    }

    // Use available data up to 150 trading days (approximately 30 weeks)
    // For shorter periods, this becomes a shorter-term MA
    const relevantBars = bars.slice(-Math.min(150, bars.length));
    const sum = relevantBars.reduce((acc, bar) => acc + bar.c, 0);
    return sum / relevantBars.length;
  }

  /**
   * Calculate volatility (standard deviation of returns)
   */
  static calculateVolatility(bars: Bar[]): number {
    if (!bars || bars.length < 5) {
      return 0;
    }

    const recentBars = bars.slice(-Math.min(20, bars.length));
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
   * Works with available data - more bars provide better accuracy (150+ ideal)
   */
  static analyzeStage(
    currentPrice: number,
    historicalBars: Bar[]
  ): WeinsteinAnalysis {
    // Work with any available data - minimum 1 bar
    if (!historicalBars || historicalBars.length === 0) {
      return {
        stage: 1,
        stageName: 'Insufficient Data',
        description: 'No historical data available for stage analysis',
        thirtyWeekMA: 0,
        currentPrice,
        priceVsMA: 0,
        trendStrength: 'Weak',
        volatility: 'Low',
      };
    }

    // Sort bars by date (oldest first), filter out invalid bars
    // Be more lenient - allow bars even without timestamp if we have price data
    const validBars = historicalBars.filter(bar => 
      bar && !isNaN(bar.c) && bar.c > 0
    );
    
    if (validBars.length === 0) {
      return {
        stage: 1,
        stageName: 'Insufficient Data',
        description: 'No valid price data available for stage analysis',
        thirtyWeekMA: 0,
        currentPrice,
        priceVsMA: 0,
        trendStrength: 'Weak',
        volatility: 'Low',
      };
    }
    
    // If we have very few bars (less than 5), provide a basic analysis
    if (validBars.length < 5) {
      const avgPrice = validBars.reduce((sum, bar) => sum + bar.c, 0) / validBars.length;
      const priceVsMA = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
      const isAbove = priceVsMA > 0;
      
      return {
        stage: isAbove ? 2 : 4,
        stageName: isAbove ? 'Stage 2: Advancing (Limited Data)' : 'Stage 4: Declining (Limited Data)',
        description: `Limited data analysis (${validBars.length} day(s) available). Price is ${isAbove ? 'above' : 'below'} average by ${Math.abs(priceVsMA).toFixed(1)}%. More data needed for accurate stage determination.`,
        thirtyWeekMA: avgPrice,
        currentPrice,
        priceVsMA,
        trendStrength: Math.abs(priceVsMA) > 5 ? 'Moderate' : 'Weak',
        volatility: 'Low',
      };
    }
    
    // Sort bars by date if timestamps are available, otherwise maintain order
    const sortedBars = validBars.every(b => b.t) 
      ? [...validBars].sort((a, b) => {
          const timeA = new Date(a.t!).getTime();
          const timeB = new Date(b.t!).getTime();
          return isNaN(timeA) || isNaN(timeB) ? 0 : timeA - timeB;
        })
      : [...validBars]; // If no timestamps, use as-is (assume already sorted)

    const thirtyWeekMA = this.calculate30WeekMA(sortedBars);
    const priceVsMA = thirtyWeekMA > 0 ? ((currentPrice - thirtyWeekMA) / thirtyWeekMA) * 100 : 0;
    const volatility = this.calculateVolatility(sortedBars);

    // Analyze recent trend (use available data up to 30 bars)
    const trendBars = sortedBars.slice(-Math.min(30, sortedBars.length));
    const trend = this.analyzeTrend(trendBars);
    const trendStrength = this.getTrendStrength(trendBars, trend);

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
      trendBars
    );

    // Indicate limited data in stage name if we have less than 150 bars
    const dataQuality = sortedBars.length >= 150 ? '' : ' (Estimated)';

    return {
      stage,
      stageName: this.getStageName(stage) + dataQuality,
      description: this.getStageDescription(stage, priceVsMA, trendStrength, sortedBars.length),
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
    if (!startPrice || startPrice === 0) return 0;
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
    trendStrength: 'Strong' | 'Moderate' | 'Weak',
    barsAvailable: number = 150
  ): string {
    const maLabel = barsAvailable >= 150 ? '30-week MA' : `${barsAvailable}-day MA`;
    const dataNote = barsAvailable < 150 ? ` (Based on ${barsAvailable} days of data)` : '';
    
    switch (stage) {
      case 1:
        return `Base building phase. Price is consolidating with ${trendStrength.toLowerCase()} trend. Look for accumulation patterns before potential breakout.${dataNote}`;
      case 2:
        return `Uptrend phase. Price is ${priceVsMA.toFixed(1)}% above ${maLabel} with ${trendStrength.toLowerCase()} momentum. This is typically the best time to buy.${dataNote}`;
      case 3:
        return `Distribution phase. High volatility and topping pattern detected. Price may be near highs but showing weakening momentum. Consider taking profits.${dataNote}`;
      case 4:
        return `Downtrend phase. Price is ${Math.abs(priceVsMA).toFixed(1)}% below ${maLabel} with ${trendStrength.toLowerCase()} downward momentum. Avoid buying, consider shorting or waiting.${dataNote}`;
      default:
        return 'Unable to determine stage.';
    }
  }
}
