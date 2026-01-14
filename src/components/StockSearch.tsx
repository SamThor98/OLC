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
      
      if (data.quote && Object.keys(data.quote).length > 0) {
        onStockSelect(data);
      } else if (data.historicalBars && data.historicalBars.length > 0) {
        onStockSelect(data);
      } else {
        setError(`No data found for ${symbol.toUpperCase()}. Please verify the symbol is correct.`);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error fetching stock data';
      setError(`${errorMessage}. Please check your API credentials in .env file.`);
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
    <form onSubmit={handleSubmit} className="ap-card rounded-lg shadow-ap-lg p-4 sm:p-6 md:p-8 hover:shadow-ap-glow transition-all duration-300 relative z-10">
      <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-bison-200">
        <span className="text-2xl sm:text-3xl">🔍</span>
        <div>
          <h3 className="text-2xl sm:text-3xl font-bold text-gold-400">Search Stock</h3>
          <p className="text-xs sm:text-sm text-ap-200 mt-1">Enter a stock symbol to begin analysis</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Enter symbol (e.g., AAPL, MSFT, TSLA)"
          className="flex-1 px-4 sm:px-6 py-3 sm:py-4 border border-gold-500/30 bg-ap-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-ap-100 font-medium text-base sm:text-lg disabled:bg-ap-900 disabled:cursor-not-allowed transition-all"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !symbol.trim()}
          className="bg-gold-500 text-ap-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:shadow-ap-glow disabled:bg-ap-700 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:transform-none border border-gold-400 w-full sm:w-auto"
        >
          {loading ? (
            <span className="flex items-center justify-center space-x-2">
              <span>Loading...</span>
              <span className="animate-spin">⏳</span>
            </span>
          ) : (
            'Search'
          )}
        </button>
      </div>
      {error && (
        <div className="mt-4 sm:mt-6 bg-red-50 border-2 border-red-300 rounded-xl p-3 sm:p-4 shadow-bison">
          <p className="text-red-800 text-xs sm:text-sm font-medium">{error}</p>
        </div>
      )}
    </form>
  );
};

export default StockSearch;
