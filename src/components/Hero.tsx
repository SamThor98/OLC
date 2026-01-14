import React from 'react';

const Hero: React.FC = () => {
  return (
    <section id="home" className="relative bg-ap-gradient text-white py-12 sm:py-16 md:py-24 overflow-hidden tapisserie">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='%23fff'/%3E%3Cpath d='M0 0l100 100M100 0L0 100' stroke='%23000' stroke-width='0.5' opacity='0.1'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-4 sm:mb-6 inline-block">
            <img 
              src={`${import.meta.env.BASE_URL}images.jpeg`}
              alt="Bison facing the storm" 
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-gold-500/60 shadow-ap-lg ring-4 ring-gold-500/20"
            />
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
            Perseverance in
            <span className="block text-gold-400 mt-1 sm:mt-2" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>Market Analysis</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-10 text-white leading-relaxed max-w-2xl mx-auto px-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            Old Logan Capital is dedicated to providing comprehensive investment research 
            focused on public equities. Like the bison that perseveres through harsh winters 
            by turning and facing the storm, we stand resilient in market volatility, 
            delivering unwavering determination and turning challenges into opportunities.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 px-4">
            <a
              href="#research"
              className="bg-gold-500 text-ap-900 px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-gold-400 hover:shadow-ap-glow transform hover:scale-105 transition-all duration-300 border border-gold-400 w-full sm:w-auto"
            >
              Explore Research
            </a>
            <a
              href="#markets"
              className="bg-ap-800 text-gold-400 px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-ap-700 hover:shadow-ap-glow transform hover:scale-105 transition-all duration-300 border border-gold-500/50 w-full sm:w-auto"
            >
              View Markets
            </a>
          </div>
          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 md:space-x-8 text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gold-400" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}>CANSLIM</div>
              <div className="text-xs sm:text-sm">Grading System</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-white/40"></div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-amber-200" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}>Weinstein</div>
              <div className="text-xs sm:text-sm">Stage Analysis</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
