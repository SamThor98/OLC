# Old Logan Capital Website

Investment company website with Weinstein Stage Analysis and CANSLIM Stock Screening.

## Features

- Professional investment company website
- **Investor Portal** with stock screening tools:
  - **Weinstein Stage Analysis**: Analyzes stocks across 4 stages (Accumulation, Advancing, Distribution, Declining)
  - **CANSLIM Screener**: Evaluates stocks based on 7 criteria (C, A, N, S, L, I, M)
- Real-time stock data from Yahoo Finance
- Modern, responsive design

## Setup & Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode (with Backend Server)

The Investor Portal requires a backend server to proxy Yahoo Finance API requests (to avoid CORS restrictions).

1. Start the backend server:
```bash
npm start
# or
npm run dev
```

2. Open your browser and navigate to:
   - Homepage: http://localhost:3001/index.html
   - Investor Portal: http://localhost:3001/investor-portal.html

### Static Mode (Homepage Only)

If you only want to view the homepage without the Investor Portal:

```bash
npm run static
```

This will start a simple static server on port 8081.

## Usage

### Investor Portal

1. Navigate to the Investor Portal
2. Enter a stock symbol (e.g., AAPL, MSFT, TSLA, PL)
3. Click "Analyze" to run both Weinstein Stage Analysis and CANSLIM screening
4. Review the results in the tabs:
   - **Weinstein Stages**: Shows the current stage and criteria analysis
   - **CANSLIM Analysis**: Displays evaluation of all 7 CANSLIM criteria

## API Endpoints

The backend server provides the following endpoints:

- `GET /api/stock/:symbol` - Fetch combined chart and quote data for a symbol
- `GET /api/chart/:symbol` - Fetch historical chart data
- `GET /api/quote/:symbol` - Fetch quote and financial data
- `GET /api/health` - Health check endpoint

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js, Express
- **Data Source**: Yahoo Finance API (via proxy)

## Notes

- The backend server runs on port 3001 by default
- Yahoo Finance API requests are proxied through the backend to avoid CORS restrictions
- The Investor Portal requires the backend server to be running

## License

Private and proprietary to Old Logan Capital.
