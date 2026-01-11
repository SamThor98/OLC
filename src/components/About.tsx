import React from 'react';

const About: React.FC = () => {
  return (
    <section id="about" className="bg-bison-light py-20 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-10 w-40 h-40 border-4 border-bison-600 rounded-full"></div>
        <div className="absolute bottom-20 left-10 w-32 h-32 border-4 border-amber-500 rounded-full"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-6xl mb-4 block">🐂</span>
            <h2 className="text-5xl font-bold mb-4 text-bison-800">About Old Logan Capital</h2>
            <p className="text-xl text-bison-700 font-medium">Perseverance Through Every Market Cycle</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-bison-lg p-8 border-2 border-bison-200 hover:shadow-bison-glow transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-bison-gradient rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl">🎯</span>
                </div>
                <h3 className="text-2xl font-bold text-bison-800">Our Mission</h3>
              </div>
              <p className="text-bison-700 leading-relaxed text-lg">
                Old Logan Capital is dedicated to providing comprehensive investment research 
                focused on public equities. Like the bison that perseveres through harsh winters, 
                we combine rigorous analysis, market insights, and cutting-edge technology to 
                deliver actionable investment intelligence that stands the test of time.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-bison-lg p-8 border-2 border-bison-200 hover:shadow-bison-glow transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-bison-gradient rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl">⚡</span>
                </div>
                <h3 className="text-2xl font-bold text-bison-800">Our Expertise</h3>
              </div>
              <p className="text-bison-700 leading-relaxed text-lg">
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
