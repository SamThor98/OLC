import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white/95 backdrop-blur-md shadow-bison sticky top-0 z-50 border-b-2 border-bison-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-bison-gradient rounded-xl flex items-center justify-center shadow-bison-glow transform hover:scale-105 transition-transform">
                <span className="text-white font-bold text-xl">🐂</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-bison-800">Old Logan Capital</h1>
              <p className="text-sm text-bison-600 font-medium">Perseverance Through Analysis</p>
            </div>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#home" className="text-bison-700 hover:text-bison-900 font-medium transition-colors relative group">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#research" className="text-bison-700 hover:text-bison-900 font-medium transition-colors relative group">
              Research
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#markets" className="text-bison-700 hover:text-bison-900 font-medium transition-colors relative group">
              Markets
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#about" className="text-bison-700 hover:text-bison-900 font-medium transition-colors relative group">
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
