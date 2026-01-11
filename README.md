# Old Logan Capital Website

A professional investment research website for Old Logan Capital with integrated Alpaca API for real-time market data.

## Features

- **Real-Time Market Data**: Search and display real-time stock quotes and market statistics
- **Alpaca API Integration**: Powered by Alpaca Markets API for live market data
- **Modern UI**: Clean, professional design built with React, TypeScript, and Tailwind CSS
- **Stock Research Tools**: View quotes, daily statistics, and price charts
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Alpaca API credentials (get them from [alpaca.markets](https://alpaca.markets/))

### Installation

1. Clone or navigate to the project directory:
```bash
cd "OLC App"
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your Alpaca API credentials:
```env
VITE_ALPACA_API_KEY=your_api_key_here
VITE_ALPACA_SECRET_KEY=your_secret_key_here
VITE_ALPACA_USE_PAPER=true
```

   **Getting Alpaca API Keys:**
   - Sign up at [alpaca.markets](https://alpaca.markets/)
   - Navigate to your dashboard
   - Generate API keys (use Paper Trading keys for testing)
   - Copy your API Key ID and Secret Key to the `.env` file

### Running the Development Server

```bash
npm run dev
```

The website will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
OLC App/
├── src/
│   ├── components/          # React components
│   │   ├── Header.tsx       # Site header/navigation
│   │   ├── Hero.tsx         # Hero section
│   │   ├── StockSearch.tsx  # Stock search form
│   │   ├── StockDisplay.tsx # Stock data display
│   │   └── About.tsx        # About section
│   ├── services/
│   │   └── alpacaService.ts # Alpaca API integration
│   ├── styles/
│   │   └── index.css        # Global styles
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Usage

1. **Search for Stocks**: Use the search bar to enter a stock symbol (e.g., AAPL, MSFT, TSLA)
2. **View Market Data**: See real-time quotes, daily statistics, and price information
3. **Analyze Trends**: Review bid/ask prices, volume, and price changes

## Technologies Used

- **React 18**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API requests
- **Recharts**: Charting library for data visualization
- **Alpaca API**: Market data provider

## Alpaca API Features Used

- Real-time stock quotes
- Daily bar data (OHLCV)
- Market data endpoints

## Important Notes

- **Paper Trading**: By default, the app uses Alpaca's paper trading environment. Set `VITE_ALPACA_USE_PAPER=false` for live trading (use with caution)
- **API Limits**: Be aware of Alpaca API rate limits
- **Security**: Never commit your `.env` file with real API keys to version control

## License

This project is private and proprietary to Old Logan Capital.

## Support

For issues or questions about the Alpaca API, visit [alpaca.markets/docs](https://alpaca.markets/docs/)
