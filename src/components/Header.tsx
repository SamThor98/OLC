import React, { useState } from 'react';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navLinkClasses = "block px-4 py-2 text-ap-100 hover:text-gold-400 hover:bg-ap-800 rounded-lg font-medium transition-colors";
  const navLinkDesktopClasses = "text-ap-100 hover:text-gold-400 font-medium transition-colors relative group";

  return (
    <header className="bg-ap-900/95 backdrop-blur-md shadow-ap sticky top-0 z-50 border-b border-gold-500/30 tapisserie">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-ap-gradient rounded-lg flex items-center justify-center shadow-ap-glow transform hover:scale-105 transition-transform overflow-hidden border border-gold-500/40">
                <img 
                  src={`${import.meta.env.BASE_URL}images.jpeg`}
                  alt="Bison in storm" 
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center' }}
                />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gold-500 rounded-full border-2 border-ap-900"></div>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gold-400">Old Logan Capital</h1>
              <p className="text-xs sm:text-sm text-ap-200 font-medium hidden xs:block">Perseverance Through Analysis</p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 lg:space-x-8">
            <a href="#home" className={navLinkDesktopClasses}>
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold-500 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#research" className={navLinkDesktopClasses}>
              Research
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold-500 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#markets" className={navLinkDesktopClasses}>
              Markets
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold-500 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#about" className={navLinkDesktopClasses}>
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold-500 group-hover:w-full transition-all duration-300"></span>
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-ap-100 hover:text-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-500 rounded-lg"
            aria-label="Toggle mobile menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-gold-500/20">
            <div className="flex flex-col space-y-1 pt-4">
              <a href="#home" onClick={closeMobileMenu} className={navLinkClasses}>
                Home
              </a>
              <a href="#research" onClick={closeMobileMenu} className={navLinkClasses}>
                Research
              </a>
              <a href="#markets" onClick={closeMobileMenu} className={navLinkClasses}>
                Markets
              </a>
              <a href="#about" onClick={closeMobileMenu} className={navLinkClasses}>
                About
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
