const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Proxy endpoint for Yahoo Finance chart data
app.get('/api/chart/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const interval = req.query.interval || '1wk';
        const range = req.query.range || '5y';
        
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}&includePrePost=false`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Yahoo Finance API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch chart data',
            message: error.message 
        });
    }
});

// Proxy endpoint for Yahoo Finance quote summary
app.get('/api/quote/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const modules = req.query.modules || 'summaryProfile,financialData,defaultKeyStatistics,majorHoldersBreakdown';
        
        const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${modules}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Yahoo Finance API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching quote data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch quote data',
            message: error.message 
        });
    }
});

// Combined endpoint that fetches both chart and quote data
app.get('/api/stock/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const interval = req.query.interval || '1wk';
        const range = req.query.range || '5y';
        
        // Expanded modules to include earnings and income statement data
        const modules = 'summaryProfile,financialData,defaultKeyStatistics,majorHoldersBreakdown,incomeStatementHistory,incomeStatementHistoryQuarterly,earningsHistory,earningsTrend';
        
        const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}&includePrePost=false`;
        const quoteUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${modules}`;
        
        // Also fetch SPY data for market direction comparison
        const spyChartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=${interval}&range=${range}&includePrePost=false`;
        
        const [chartResponse, quoteResponse, spyResponse] = await Promise.allSettled([
            fetch(chartUrl),
            fetch(quoteUrl),
            fetch(spyChartUrl)
        ]);
        
        let chartData = null;
        let quoteData = null;
        let spyData = null;
        
        if (chartResponse.status === 'fulfilled' && chartResponse.value.ok) {
            chartData = await chartResponse.value.json();
        }
        
        if (quoteResponse.status === 'fulfilled' && quoteResponse.value.ok) {
            quoteData = await quoteResponse.value.json();
        }
        
        if (spyResponse.status === 'fulfilled' && spyResponse.value.ok) {
            spyData = await spyResponse.value.json();
        }
        
        if (!chartData) {
            throw new Error('Failed to fetch chart data');
        }
        
        res.json({
            symbol,
            chartData,
            quoteData,
            spyData
        });
    } catch (error) {
        console.error('Error fetching stock data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch stock data',
            message: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Investor Portal: http://localhost:${PORT}/investor-portal.html`);
    console.log(`🏠 Homepage: http://localhost:${PORT}/index.html\n`);
});
