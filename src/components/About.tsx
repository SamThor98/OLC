import React from 'react';

const About: React.FC = () => {
  return (
    <section id="about" className="bg-ap-light py-12 sm:py-16 md:py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <img 
              src={`${import.meta.env.BASE_URL}images.jpeg`}
              alt="Bison facing the storm" 
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-gold-500/60 shadow-ap-lg ring-4 ring-gold-500/20 mx-auto mb-3 sm:mb-4"
            />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-gold-400">About Old Logan Capital</h2>
            <p className="text-base sm:text-lg md:text-xl text-ap-100 font-medium px-2">Perseverance Through Every Market Cycle</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="ap-card rounded-lg shadow-ap-lg p-6 sm:p-8 hover:shadow-ap-glow transition-all duration-300 transform hover:scale-[1.02] relative z-10">
              <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-ap-gradient border border-gold-500/40 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl sm:text-2xl">🎯</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gold-400">Our Mission</h3>
              </div>
              <p className="text-sm sm:text-base md:text-lg text-ap-100 leading-relaxed">
                Old Logan Capital is dedicated to providing comprehensive investment research 
                focused on public equities. Like the bison that perseveres through harsh winters 
                by turning and facing the storm, we stand resilient in market volatility, 
                combining rigorous analysis, market insights, and cutting-edge technology to 
                deliver actionable investment intelligence that stands the test of time.
              </p>
            </div>
            <div className="ap-card rounded-lg shadow-ap-lg p-6 sm:p-8 hover:shadow-ap-glow transition-all duration-300 transform hover:scale-[1.02] relative z-10">
              <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-ap-gradient border border-gold-500/40 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl sm:text-2xl">⚡</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gold-400">Our Expertise</h3>
              </div>
              <p className="text-sm sm:text-base md:text-lg text-ap-100 leading-relaxed">
                Specializing in public equities research, we leverage real-time market data 
                and advanced analytics including CANSLIM grading and Weinstein stage analysis 
                to identify opportunities and provide informed perspectives on market trends 
                and individual securities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
