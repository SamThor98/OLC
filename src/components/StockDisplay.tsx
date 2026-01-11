import React, { useMemo, useEffect } from 'react';
import { MarketData } from '../services/alpacaService';
import { CANSLIMService } from '../services/canslimService';
import { WeinsteinService } from '../services/weinsteinService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StockDisplayProps {
  data: MarketData;
}

const StockDisplay: React.FC<StockDisplayProps> = ({ data }) => {
  const { quote, dailyBar, historicalBars } = data;

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/d5affe11-ec13-48a4-9f3d-82e22bf74af7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StockDisplay.tsx:15',message:'StockDisplay received data',data:{hasDailyBar:!!dailyBar,hasHistoricalBars:!!historicalBars,historicalBarsLength:historicalBars?.length||0,sampleBar:historicalBars?.[0],dailyBarData:dailyBar},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H4'})}).catch(()=>{});
  }, [dailyBar, historicalBars]);
  // #endregion

  // Calculate CANSLIM score - reduced requirement to 10 bars for testing
  const canslimScore = useMemo(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d5affe11-ec13-48a4-9f3d-82e22bf74af7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StockDisplay.tsx:25',message:'CANSLIM calculation start',data:{hasDailyBar:!!dailyBar,hasHistoricalBars:!!historicalBars,barsCount:historicalBars?.length||0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3-H4'})}).catch(()=>{});
    // #endregion
    if (!dailyBar) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d5affe11-ec13-48a4-9f3d-82e22bf74af7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StockDisplay.tsx:30',message:'CANSLIM: No dailyBar',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      return null;
    }
    if (!historicalBars || historicalBars.length < 10) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d5affe11-ec13-48a4-9f3d-82e22bf74af7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StockDisplay.tsx:35',message:'CANSLIM: Insufficient data',data:{barsCount:historicalBars?.length||0,required:10},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      return null;
    }
    try {
      const result = CANSLIMService.calculateScore(dailyBar.c, historicalBars, dailyBar.v);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d5affe11-ec13-48a4-9f3d-82e22bf74af7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StockDisplay.tsx:42',message:'CANSLIM: Success',data:{grade:result.overallGrade,totalScore:result.totalScore},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      return result;
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d5affe11-ec13-48a4-9f3d-82e22bf74af7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StockDisplay.tsx:48',message:'CANSLIM: Error',data:{error:error?.message||String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      return null;
    }
  }, [dailyBar, historicalBars]);

  // Calculate Weinstein stage - reduced requirement to 30 bars for testing
  const weinsteinAnalysis = useMemo(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d5affe11-ec13-48a4-9f3d-82e22bf74af7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StockDisplay.tsx:55',message:'Weinstein calculation start',data:{hasDailyBar:!!dailyBar,barsCount:historicalBars?.length||0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3-H4'})}).catch(()=>{});
    // #endregion
    if (!dailyBar) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d5affe11-ec13-48a4-9f3d-82e22bf74af7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StockDisplay.tsx:60',message:'Weinstein: No dailyBar',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      return null;
    }
    if (!historicalBars || historicalBars.length < 30) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d5affe11-ec13-48a4-9f3d-82e22bf74af7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StockDisplay.tsx:65',message:'Weinstein: Insufficient data',data:{barsCount:historicalBars?.length||0,required:30},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      return null;
    }
    try {
      const result = WeinsteinService.analyzeStage(dailyBar.c, historicalBars);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d5affe11-ec13-48a4-9f3d-82e22bf74af7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StockDisplay.tsx:72',message:'Weinstein: Success',data:{stage:result.stage,stageName:result.stageName},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      return result;
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d5affe11-ec13-48a4-9f3d-82e22bf74af7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StockDisplay.tsx:78',message:'Weinstein: Error',data:{error:error?.message||String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      return null;
    }
  }, [dailyBar, historicalBars]);

  const priceChange = dailyBar ? dailyBar.c - dailyBar.o : 0;
  const priceChangePercent = dailyBar && dailyBar.o > 0 
    ? ((priceChange / dailyBar.o) * 100).toFixed(2) 
    : '0.00';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-emerald-700 bg-emerald-50 border-emerald-300 shadow-emerald-100';
      case 'B': return 'text-bison-700 bg-bison-100 border-bison-400 shadow-bison-100';
      case 'C': return 'text-amber-700 bg-amber-50 border-amber-300 shadow-amber-100';
      case 'D': return 'text-orange-700 bg-orange-50 border-orange-300 shadow-orange-100';
      case 'F': return 'text-red-700 bg-red-50 border-red-300 shadow-red-100';
      default: return 'text-bison-600 bg-bison-50 border-bison-300';
    }
  };

  const getGradeTextColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-emerald-700';
      case 'B': return 'text-bison-700';
      case 'C': return 'text-amber-700';
      case 'D': return 'text-orange-700';
      case 'F': return 'text-red-700';
      default: return 'text-bison-600';
    }
  };

  const getStageColor = (stage: number) => {
    switch (stage) {
      case 1: return 'text-bison-700 bg-bison-100 border-bison-400 shadow-bison-100';
      case 2: return 'text-emerald-700 bg-emerald-50 border-emerald-300 shadow-emerald-100';
      case 3: return 'text-amber-700 bg-amber-50 border-amber-300 shadow-amber-100';
      case 4: return 'text-red-700 bg-red-50 border-red-300 shadow-red-100';
      default: return 'text-bison-600 bg-bison-50 border-bison-300';
    }
  };

  const getStageTextColor = (stage: number) => {
    switch (stage) {
      case 1: return 'text-bison-700';
      case 2: return 'text-emerald-700';
      case 3: return 'text-amber-700';
      case 4: return 'text-red-700';
      default: return 'text-bison-600';
    }
  };

  // Prepare chart data (simplified - in production, you'd fetch historical data)
  const chartData = dailyBar ? [
    { name: 'Open', value: dailyBar.o },
    { name: 'High', value: dailyBar.h },
    { name: 'Low', value: dailyBar.l },
    { name: 'Close', value: dailyBar.c },
  ] : [];

  return (
    <div className="bg-white rounded-2xl shadow-bison-lg p-8 mt-8 border-2 border-bison-200 hover:shadow-bison-glow transition-all duration-300">
      <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-bison-200">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-bison-gradient rounded-xl flex items-center justify-center shadow-bison">
            <span className="text-white font-bold text-2xl">{data.symbol.charAt(0)}</span>
          </div>
          <div>
            <h3 className="text-4xl font-bold text-bison-800">{data.symbol}</h3>
            <p className="text-sm text-bison-600 font-medium">Market Analysis</p>
          </div>
        </div>
        {dailyBar && (
          <div className="text-right">
            <div className={`text-3xl font-bold ${priceChange >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {formatCurrency(dailyBar.c)}
            </div>
            <div className={`text-sm font-semibold ${priceChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChangePercent}% ({priceChange >= 0 ? '+' : ''}{formatCurrency(priceChange)})
            </div>
          </div>
        )}
      </div>

      {/* CANSLIM and Weinstein Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* CANSLIM Grade Card */}
        <div className={`rounded-2xl border-2 p-6 shadow-bison hover:shadow-bison-lg transition-all duration-300 transform hover:scale-[1.02] ${canslimScore ? getGradeColor(canslimScore.overallGrade) : 'bg-bison-50 border-bison-300'}`}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-bison-200">
            <div>
              <h4 className="text-2xl font-bold text-bison-800">CANSLIM Grade</h4>
              <p className="text-xs text-bison-600 mt-1">Comprehensive Analysis</p>
            </div>
            {canslimScore && (
              <div className={`text-6xl font-bold ${getGradeTextColor(canslimScore.overallGrade)} drop-shadow-lg`}>
                {canslimScore.overallGrade}
              </div>
            )}
          </div>
          {canslimScore ? (
            <div className="space-y-3">
              <div className="bg-white/60 rounded-lg p-3 text-sm border border-bison-200">
                <span className="font-bold text-bison-800">Overall Score: </span>
                <span className="font-semibold text-bison-700">
                  {canslimScore.totalScore} / {canslimScore.maxTotalScore} 
                </span>
                <span className="text-bison-600">
                  ({((canslimScore.totalScore / canslimScore.maxTotalScore) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="bg-white/40 rounded-lg p-3 border border-bison-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-bison-800">C - Current Quarterly</span>
                    <span className="font-semibold text-bison-700">{canslimScore.scores.c.score}/{canslimScore.scores.c.maxScore}</span>
                  </div>
                  <div className="text-xs text-bison-600">{canslimScore.scores.c.description}</div>
                </div>
                
                <div className="bg-white/40 rounded-lg p-3 border border-bison-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-bison-800">A - Annual Growth</span>
                    <span className="font-semibold text-bison-700">{canslimScore.scores.a.score}/{canslimScore.scores.a.maxScore}</span>
                  </div>
                  <div className="text-xs text-bison-600">{canslimScore.scores.a.description}</div>
                </div>
                
                <div className="bg-white/40 rounded-lg p-3 border border-bison-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-bison-800">N - New Highs</span>
                    <span className="font-semibold text-bison-700">{canslimScore.scores.n.score}/{canslimScore.scores.n.maxScore}</span>
                  </div>
                  <div className="text-xs text-bison-600">{canslimScore.scores.n.description}</div>
                </div>
                
                <div className="bg-white/40 rounded-lg p-3 border border-bison-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-bison-800">S - Supply/Demand</span>
                    <span className="font-semibold text-bison-700">{canslimScore.scores.s.score}/{canslimScore.scores.s.maxScore}</span>
                  </div>
                  <div className="text-xs text-bison-600">{canslimScore.scores.s.description}</div>
                </div>
                
                <div className="bg-white/40 rounded-lg p-3 border border-bison-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-bison-800">L - Leader/Laggard</span>
                    <span className="font-semibold text-bison-700">{canslimScore.scores.l.score}/{canslimScore.scores.l.maxScore}</span>
                  </div>
                  <div className="text-xs text-bison-600">{canslimScore.scores.l.description}</div>
                </div>
                
                <div className="bg-white/40 rounded-lg p-3 border border-bison-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-bison-800">I - Institutional</span>
                    <span className="font-semibold text-bison-700">{canslimScore.scores.i.score}/{canslimScore.scores.i.maxScore}</span>
                  </div>
                  <div className="text-xs text-bison-600">{canslimScore.scores.i.description}</div>
                </div>
                
                <div className="bg-white/40 rounded-lg p-3 border border-bison-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-bison-800">M - Market Direction</span>
                    <span className="font-semibold text-bison-700">{canslimScore.scores.m.score}/{canslimScore.scores.m.maxScore}</span>
                  </div>
                  <div className="text-xs text-bison-600">{canslimScore.scores.m.description}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/40 rounded-lg p-4 border border-bison-200">
              <p className="text-sm text-bison-600 font-medium mb-2">Insufficient data for CANSLIM analysis</p>
              <p className="text-xs text-bison-500">
                {!dailyBar ? 'Missing daily price data. ' : ''}
                {!historicalBars ? 'Missing historical data. ' : historicalBars.length < 10 ? `Only ${historicalBars.length} days available (need at least 10). ` : ''}
                Please try again or check your API connection.
              </p>
            </div>
          )}
        </div>

        {/* Weinstein Stage Card */}
        <div className={`rounded-2xl border-2 p-6 shadow-bison hover:shadow-bison-lg transition-all duration-300 transform hover:scale-[1.02] ${weinsteinAnalysis ? getStageColor(weinsteinAnalysis.stage) : 'bg-bison-50 border-bison-300'}`}>
          <div className="mb-6 pb-4 border-b-2 border-bison-200">
            <h4 className="text-2xl font-bold text-bison-800 mb-2">Weinstein Stage Analysis</h4>
            <p className="text-xs text-bison-600">Market Cycle Position</p>
            {weinsteinAnalysis && (
              <div className={`text-3xl font-bold mt-3 ${getStageTextColor(weinsteinAnalysis.stage)} drop-shadow-lg`}>
                {weinsteinAnalysis.stageName}
              </div>
            )}
          </div>
          {weinsteinAnalysis ? (
            <div className="space-y-4">
              <p className="text-sm text-bison-700 bg-white/60 rounded-lg p-3 border border-bison-200 leading-relaxed">
                {weinsteinAnalysis.description}
              </p>
              <div className="space-y-3 text-sm">
                <div className="bg-white/40 rounded-lg p-3 border border-bison-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-bison-800">Current Price</span>
                    <span className="font-semibold text-bison-700">{formatCurrency(weinsteinAnalysis.currentPrice)}</span>
                  </div>
                </div>
                <div className="bg-white/40 rounded-lg p-3 border border-bison-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-bison-800">30-Week MA</span>
                    <span className="font-semibold text-bison-700">{formatCurrency(weinsteinAnalysis.thirtyWeekMA)}</span>
                  </div>
                </div>
                <div className="bg-white/40 rounded-lg p-3 border border-bison-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-bison-800">Price vs MA</span>
                    <span className={`font-semibold ${weinsteinAnalysis.priceVsMA >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {weinsteinAnalysis.priceVsMA >= 0 ? '+' : ''}{weinsteinAnalysis.priceVsMA.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="bg-white/40 rounded-lg p-3 border border-bison-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-bison-800">Trend Strength</span>
                    <span className="font-semibold text-bison-700">{weinsteinAnalysis.trendStrength}</span>
                  </div>
                </div>
                <div className="bg-white/40 rounded-lg p-3 border border-bison-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-bison-800">Volatility</span>
                    <span className="font-semibold text-bison-700">{weinsteinAnalysis.volatility}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/40 rounded-lg p-4 border border-bison-200">
              <p className="text-sm text-bison-600 font-medium mb-2">Insufficient data for Weinstein analysis</p>
              <p className="text-xs text-bison-500">
                {!dailyBar ? 'Missing daily price data. ' : ''}
                {!historicalBars ? 'Missing historical data. ' : historicalBars.length < 30 ? `Only ${historicalBars.length} days available (need at least 30 for basic analysis, 150+ for full analysis). ` : ''}
                Weinstein Stage Analysis requires 30+ weeks of historical data.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-bison-50 rounded-xl p-6 border-2 border-bison-200 shadow-bison">
          <h4 className="text-xl font-bold text-bison-800 mb-4 pb-2 border-b-2 border-bison-200">Quote Information</h4>
          <div className="space-y-3">
            {quote.last_price && (
              <div className="flex justify-between py-3 border-b border-bison-200">
                <span className="text-bison-700 font-medium">Last Price</span>
                <span className="font-bold text-bison-800">{formatCurrency(quote.last_price)}</span>
              </div>
            )}
            {quote.bid_price && (
              <div className="flex justify-between py-3 border-b border-bison-200">
                <span className="text-bison-700 font-medium">Bid Price</span>
                <span className="font-bold text-bison-800">{formatCurrency(quote.bid_price)}</span>
              </div>
            )}
            {quote.ask_price && (
              <div className="flex justify-between py-3 border-b border-bison-200">
                <span className="text-bison-700 font-medium">Ask Price</span>
                <span className="font-bold text-bison-800">{formatCurrency(quote.ask_price)}</span>
              </div>
            )}
            {quote.bid_size && (
              <div className="flex justify-between py-3 border-b border-bison-200">
                <span className="text-bison-700 font-medium">Bid Size</span>
                <span className="font-bold text-bison-800">{formatNumber(quote.bid_size)}</span>
              </div>
            )}
            {quote.ask_size && (
              <div className="flex justify-between py-3 border-b border-bison-200">
                <span className="text-bison-700 font-medium">Ask Size</span>
                <span className="font-bold text-bison-800">{formatNumber(quote.ask_size)}</span>
              </div>
            )}
          </div>
        </div>

        {dailyBar && (
          <div className="bg-bison-50 rounded-xl p-6 border-2 border-bison-200 shadow-bison">
            <h4 className="text-xl font-bold text-bison-800 mb-4 pb-2 border-b-2 border-bison-200">Daily Statistics</h4>
            <div className="space-y-3">
              <div className="flex justify-between py-3 border-b border-bison-200">
                <span className="text-bison-700 font-medium">Open</span>
                <span className="font-bold text-bison-800">{formatCurrency(dailyBar.o)}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-bison-200">
                <span className="text-bison-700 font-medium">High</span>
                <span className="font-bold text-emerald-700">{formatCurrency(dailyBar.h)}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-bison-200">
                <span className="text-bison-700 font-medium">Low</span>
                <span className="font-bold text-red-700">{formatCurrency(dailyBar.l)}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-bison-200">
                <span className="text-bison-700 font-medium">Close</span>
                <span className="font-bold text-bison-800">{formatCurrency(dailyBar.c)}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-bison-700 font-medium">Volume</span>
                <span className="font-bold text-bison-800">{formatNumber(dailyBar.v)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {dailyBar && chartData.length > 0 && (
        <div className="mt-8 bg-bison-50 rounded-xl p-6 border-2 border-bison-200 shadow-bison">
          <h4 className="text-xl font-bold text-bison-800 mb-6 pb-2 border-b-2 border-bison-200">Price Overview</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4c2a3" />
              <XAxis dataKey="name" stroke="#6d5440" />
              <YAxis stroke="#6d5440" />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: '#faf8f5', 
                  border: '2px solid #9d7a5a',
                  borderRadius: '8px',
                  color: '#4a382c'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#9d7a5a" 
                strokeWidth={3}
                dot={{ fill: '#6d5440', r: 5 }}
                activeDot={{ r: 7, fill: '#9d7a5a' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {quote.updated_at && (
        <p className="text-sm text-bison-600 mt-6 text-center italic">
          Last updated: {new Date(quote.updated_at).toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default StockDisplay;
