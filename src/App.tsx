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
    <div className="min-h-screen bg-ap-light">
      <Header />
      <Hero />
      
      <section id="research" className="py-20 bg-ap-light">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-bold mb-4 text-gold-400">Market Research</h2>
              <p className="text-xl text-ap-100">Comprehensive analysis with CANSLIM & Weinstein methodologies</p>
            </div>
            <StockSearch onStockSelect={handleStockSelect} />
            {selectedStock && <StockDisplay data={selectedStock} />}
          </div>
        </div>
      </section>

      <section id="markets" className="py-20 bg-ap-900 relative overflow-hidden tapisserie">
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-6 text-gold-400">Real-Time Market Data</h2>
            <p className="text-xl text-ap-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Access real-time stock quotes and market data powered by Alpaca API integration. 
              Search for any publicly traded equity to view current pricing, volume, and comprehensive 
              market statistics with our advanced analysis tools.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="ap-card rounded-lg p-8 hover:shadow-ap-glow transition-all duration-300 transform hover:scale-105 relative z-10">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-2xl font-bold mb-3 text-gold-400">Real-Time Quotes</h3>
                <p className="text-ap-100 leading-relaxed">Live bid/ask prices and market data with instant updates</p>
              </div>
              <div className="ap-card rounded-lg p-8 hover:shadow-ap-glow transition-all duration-300 transform hover:scale-105 relative z-10">
                <div className="text-5xl mb-4">📈</div>
                <h3 className="text-2xl font-bold mb-3 text-gold-400">Market Analysis</h3>
                <p className="text-ap-100 leading-relaxed">Comprehensive market statistics, trends, and pattern recognition</p>
              </div>
              <div className="ap-card rounded-lg p-8 hover:shadow-ap-glow transition-all duration-300 transform hover:scale-105 relative z-10">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold mb-3 text-gold-400">Research Tools</h3>
                <p className="text-ap-100 leading-relaxed">Advanced CANSLIM and Weinstein analysis for equity research</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <About />

      <footer className="bg-ap-gradient text-white py-12 relative overflow-hidden tapisserie">
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <img 
                src={`${import.meta.env.BASE_URL}images.jpeg`}
                alt="Bison facing the storm" 
                className="w-20 h-20 rounded-full object-cover border-4 border-gold-500/60 shadow-ap-lg ring-4 ring-gold-500/20 mx-auto mb-4"
              />
              <h3 className="text-3xl font-bold mb-2 text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Old Logan Capital</h3>
              <p className="text-ap-200 font-medium" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Perseverance Through Analysis</p>
            </div>
            <p className="text-ap-300 mb-4">Investment Research Group</p>
            <p className="text-sm text-ap-400">
              © {new Date().getFullYear()} Old Logan Capital. All rights reserved.
            </p>
            <p className="text-xs text-ap-500 mt-4">
              Market data provided by Alpaca Markets API
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
