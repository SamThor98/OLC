import React from 'react';

const Hero: React.FC = () => {
  return (
    <section id="home" className="relative bg-bison-gradient text-white py-24 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-amber-400 rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 border-4 border-amber-300 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 border-4 border-amber-500 rounded-full"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 inline-block">
            <span className="text-6xl">🐂</span>
          </div>
          <h2 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Perseverance in
            <span className="block text-amber-300 mt-2">Market Analysis</span>
          </h2>
          <p className="text-xl md:text-2xl mb-10 text-bison-100 leading-relaxed max-w-2xl mx-auto">
            Like the bison that weathers every storm, Old Logan Capital stands resilient. 
            We deliver comprehensive investment research with unwavering determination, 
            turning market volatility into opportunity.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#research"
              className="bg-white text-bison-800 px-10 py-4 rounded-xl font-bold text-lg hover:bg-amber-50 hover:shadow-bison-lg transform hover:scale-105 transition-all duration-300 border-2 border-amber-300"
            >
              Explore Research
            </a>
            <a
              href="#markets"
              className="bg-amber-500 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-amber-600 hover:shadow-bison-lg transform hover:scale-105 transition-all duration-300 border-2 border-amber-400"
            >
              View Markets
            </a>
          </div>
          <div className="mt-12 flex items-center justify-center space-x-8 text-bison-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-300">CANSLIM</div>
              <div className="text-sm">Grading System</div>
            </div>
            <div className="w-px h-12 bg-bison-400"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-300">Weinstein</div>
              <div className="text-sm">Stage Analysis</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
