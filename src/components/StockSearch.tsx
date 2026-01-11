import React, { useState, FormEvent } from 'react';
import { alpacaService, MarketData } from '../services/alpacaService';

interface StockSearchProps {
  onStockSelect: (data: MarketData) => void;
}

const StockSearch: React.FC<StockSearchProps> = ({ onStockSelect }) => {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!symbol.trim() || !alpacaService) {
      setError('Please enter a stock symbol and ensure Alpaca API is configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await alpacaService.getMarketData(symbol.toUpperCase());
      console.log('Stock data received:', {
        symbol: data.symbol,
        hasQuote: !!data.quote,
        quoteKeys: data.quote ? Object.keys(data.quote) : [],
        hasDailyBar: !!data.dailyBar,
        historicalBarsCount: data.historicalBars?.length || 0,
      });
      
      if (data.quote && Object.keys(data.quote).length > 0) {
        onStockSelect(data);
      } else if (data.historicalBars && data.historicalBars.length > 0) {
        // Even if quote is empty, if we have bars, show the data
        onStockSelect(data);
      } else {
        setError(`No data found for ${symbol.toUpperCase()}. Check browser console for details.`);
      }
    } catch (err: any) {
      console.error('Stock search error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error fetching stock data';
      const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : '';
      setError(`${errorMessage}. ${errorDetails ? `Details: ${errorDetails}` : 'Please check your API credentials in .env file and browser console.'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!alpacaService) {
    return (
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 shadow-bison">
        <p className="text-amber-800 font-medium">
          ⚠️ Alpaca API not configured. Please set VITE_ALPACA_API_KEY and VITE_ALPACA_SECRET_KEY in your .env file.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-bison-lg p-8 border-2 border-bison-200 hover:shadow-bison-glow transition-all duration-300">
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b-2 border-bison-200">
        <span className="text-3xl">🔍</span>
        <div>
          <h3 className="text-3xl font-bold text-bison-800">Search Stock</h3>
          <p className="text-sm text-bison-600 mt-1">Enter a stock symbol to begin analysis</p>
        </div>
      </div>
      <div className="flex gap-4">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Enter symbol (e.g., AAPL, MSFT, TSLA)"
          className="flex-1 px-6 py-4 border-2 border-bison-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-500 text-bison-800 font-medium text-lg disabled:bg-bison-50 disabled:cursor-not-allowed transition-all"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !symbol.trim()}
          className="bg-bison-gradient text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-bison-lg disabled:bg-bison-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:transform-none border-2 border-bison-700"
        >
          {loading ? (
            <span className="flex items-center space-x-2">
              <span>Loading...</span>
              <span className="animate-spin">🐂</span>
            </span>
          ) : (
            'Search'
          )}
        </button>
      </div>
      {error && (
        <div className="mt-6 bg-red-50 border-2 border-red-300 rounded-xl p-4 shadow-bison">
          <p className="text-red-800 text-sm font-medium">{error}</p>
        </div>
      )}
    </form>
  );
};

export default StockSearch;
