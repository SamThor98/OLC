import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import StockSearch from './components/StockSearch';
import StockDisplay from './components/StockDisplay';
import About from './components/About';
import { MarketData } from './services/alpacaService';

function App() {
  const [selectedStock, setSelectedStock] = useState<MarketData | null>(null);

  const handleStockSelect = (data: MarketData) => {
    setSelectedStock(data);
  };

  return (
    <div className="min-h-screen bg-bison-light">
      <Header />
      <Hero />
      
      <section id="research" className="py-20 bg-bison-light">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-bold mb-4 text-bison-800">Market Research</h2>
              <p className="text-xl text-bison-700">Comprehensive analysis with CANSLIM & Weinstein methodologies</p>
            </div>
            <StockSearch onStockSelect={handleStockSelect} />
            {selectedStock && <StockDisplay data={selectedStock} />}
          </div>
        </div>
      </section>

      <section id="markets" className="py-20 bg-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-20 w-32 h-32 border-4 border-bison-600 rounded-full"></div>
          <div className="absolute bottom-10 right-20 w-24 h-24 border-4 border-amber-500 rounded-full"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-6 text-bison-800">Real-Time Market Data</h2>
            <p className="text-xl text-bison-700 mb-12 max-w-3xl mx-auto leading-relaxed">
              Access real-time stock quotes and market data powered by Alpaca API integration. 
              Search for any publicly traded equity to view current pricing, volume, and comprehensive 
              market statistics with our advanced analysis tools.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="bg-bison-50 rounded-2xl p-8 border-2 border-bison-200 shadow-bison hover:shadow-bison-lg transition-all duration-300 transform hover:scale-105">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-2xl font-bold mb-3 text-bison-800">Real-Time Quotes</h3>
                <p className="text-bison-700 leading-relaxed">Live bid/ask prices and market data with instant updates</p>
              </div>
              <div className="bg-bison-50 rounded-2xl p-8 border-2 border-bison-200 shadow-bison hover:shadow-bison-lg transition-all duration-300 transform hover:scale-105">
                <div className="text-5xl mb-4">📈</div>
                <h3 className="text-2xl font-bold mb-3 text-bison-800">Market Analysis</h3>
                <p className="text-bison-700 leading-relaxed">Comprehensive market statistics, trends, and pattern recognition</p>
              </div>
              <div className="bg-bison-50 rounded-2xl p-8 border-2 border-bison-200 shadow-bison hover:shadow-bison-lg transition-all duration-300 transform hover:scale-105">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold mb-3 text-bison-800">Research Tools</h3>
                <p className="text-bison-700 leading-relaxed">Advanced CANSLIM and Weinstein analysis for equity research</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <About />

      <footer className="bg-bison-gradient text-white py-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-5 left-10 w-20 h-20 border-2 border-amber-300 rounded-full"></div>
          <div className="absolute bottom-5 right-10 w-16 h-16 border-2 border-amber-400 rounded-full"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <span className="text-4xl mb-2 block">🐂</span>
              <h3 className="text-3xl font-bold mb-2">Old Logan Capital</h3>
              <p className="text-bison-200 font-medium">Perseverance Through Analysis</p>
            </div>
            <p className="text-bison-300 mb-4">Investment Research Group</p>
            <p className="text-sm text-bison-400">
              © {new Date().getFullYear()} Old Logan Capital. All rights reserved.
            </p>
            <p className="text-xs text-bison-500 mt-4">
              Market data provided by Alpaca Markets API
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
