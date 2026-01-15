# 📊 Personal Portfolio Email Setup Guide

This guide will help you set up the automated daily portfolio email for **sttonka9@gmail.com**.

## 📬 What You'll Receive

Every weekday at **7:30 AM CST**, you'll get an email covering:

### Portfolio Summary
- Total portfolio value
- Total P/L (gain/loss)
- Today's change

### Alerts & Signals
- 🎯 Profit-taking alerts (positions up 50%+)
- ⚠️ Stop-loss alerts (positions down 20%+)
- 📊 Position sizing alerts (>25% concentration)
- 📈 RSI overbought/oversold signals
- 🔥 Unusual volume alerts
- ⚖️ Sector concentration warnings

### Daily News & Interpretation
- 📰 Market-moving headlines with sentiment analysis
- 💡 AI-style interpretation of how news affects YOUR positions
- 🎯 Stock-specific news for your holdings
- Automatic detection of relevant sector/theme news
- Bullish/Bearish/Neutral sentiment tagging

### Recommendations
- Technical analysis signals (MA crossovers)
- Buy/sell/hold suggestions
- Risk management guidance

### Your Portfolio Positions

| Symbol | Company | Sector | Shares | Cost Basis |
|--------|---------|--------|--------|------------|
| ACMR | ACM Research | Semiconductors | 505 | $39.41 |
| AEHR | Aehr Test Systems | Semiconductors | 400 | $26.27 |
| AMZN | Amazon | Technology | 75 | $200.00 |
| ASML | ASML Holding | Semiconductors | 50 | $783.59 |
| HOOD | Robinhood Markets | Fintech | 50 | $47.71 |
| JKS | JinkoSolar | Solar/Renewables | 208 | $24.04 |
| LSCC | Lattice Semiconductor | Semiconductors | 404 | $68.83 |
| NVTS | Navitas Semiconductor | Semiconductors | 2000 | $7.50 |
| PL | Planet Labs | Space/Satellite | 1250 | $12.09 |

### Market Overview
- S&P 500, Dow Jones, NASDAQ, VIX
- Semiconductor ETF (SMH)

---

## 🔧 Setup Instructions

### Step 1: Gmail App Password ✅ ALREADY DONE

Your app password: `jykj gvuc zquj ptlq`

(Without spaces: `jykjgvuczqujptlq`)

---

### Step 2: Add Secrets to GitHub

You need to add TWO **NEW** secrets (separate from the OLC email secrets):

#### 2A. Open GitHub Secrets Page

1. Go to your GitHub repository: https://github.com/YOUR-USERNAME/OLC-App
2. Click the **Settings** tab
3. In the left sidebar, scroll to **Security** section
4. Click **Secrets and variables**
5. Click **Actions**
6. Click the green **New repository secret** button

#### 2B. Add First Secret (Personal Email Address)

| Field | What to Enter |
|-------|---------------|
| **Name** | `PERSONAL_EMAIL_USER` |
| **Secret** | `sttonka9@gmail.com` |

Click the green **Add secret** button.

#### 2C. Add Second Secret (Personal App Password)

Click **New repository secret** again.

| Field | What to Enter |
|-------|---------------|
| **Name** | `PERSONAL_EMAIL_APP_PASSWORD` |
| **Secret** | `jykjgvuczqujptlq` |

Click the green **Add secret** button.

#### ✅ Verify Your Secrets

After adding both, you should now have FOUR secrets total:

```
Repository secrets
──────────────────
EMAIL_APP_PASSWORD           (for OLC)
EMAIL_USER                   (for OLC)
PERSONAL_EMAIL_APP_PASSWORD  (for Personal)
PERSONAL_EMAIL_USER          (for Personal)
```

---

### Step 3: Push Code to GitHub

Make sure the latest code is pushed to your GitHub repository:

```powershell
cd "C:\Users\stton\OneDrive\Desktop\OLC App"
git add .
git commit -m "Add personal portfolio email system"
git push
```

---

### Step 4: Test the Email

1. Go to your GitHub repository
2. Click the **Actions** tab
3. In the left sidebar, click **Personal Portfolio Email**
4. Click the **Run workflow** dropdown button
5. Click the green **Run workflow** button
6. Wait 2-3 minutes (fetches 9 stocks + 5 indices)
7. Check your inbox at sttonka9@gmail.com! 📧

---

## 📋 Quick Reference

### Your Configuration

| Setting | Value |
|---------|-------|
| **Recipient Email** | sttonka9@gmail.com |
| **Schedule** | 7:30 AM CST, Monday-Friday |
| **Positions Tracked** | 9 stocks |

### GitHub Secrets Summary

| Secret Name | Value |
|-------------|-------|
| `PERSONAL_EMAIL_USER` | `sttonka9@gmail.com` |
| `PERSONAL_EMAIL_APP_PASSWORD` | `jykjgvuczqujptlq` |

---

## 🛠️ Customization

### Update Your Portfolio

Edit `scripts/personalMarketEmail.js`, find the `CONFIG.portfolio` array:

```javascript
portfolio: [
  { symbol: 'ACMR', name: 'ACM Research', sector: 'Semiconductors', shares: 505, costBasis: 39.41 },
  // Update shares or cost basis as needed
  // Add new positions:
  // { symbol: 'NVDA', name: 'NVIDIA', sector: 'Semiconductors', shares: 10, costBasis: 500.00 },
]
```

### Adjust Alert Thresholds

```javascript
alerts: {
  profitTakePercent: 50,      // Alert when gain exceeds X%
  stopLossPercent: -20,       // Alert when loss exceeds X%
  maxPositionPercent: 25,     // Alert when position > X% of portfolio
  minPositionPercent: 3,      // Alert when position < X% of portfolio
  highVolumeMultiple: 2.0,    // Alert when volume > Xx average
  rsiOverbought: 70,          // RSI overbought threshold
  rsiOversold: 30             // RSI oversold threshold
}
```

### Change the Schedule

Edit `.github/workflows/personal-market-email.yml`:

```yaml
schedule:
  - cron: '30 13 * * 1-5'  # 7:30 AM CST weekdays
```

| Schedule | Cron Expression |
|----------|-----------------|
| 6:30 AM CST weekdays | `'30 12 * * 1-5'` |
| 7:30 AM CST weekdays | `'30 13 * * 1-5'` |
| 8:30 AM CST weekdays | `'30 14 * * 1-5'` |
| 7:30 AM CST every day | `'30 13 * * *'` |

---

## 📊 What Each Alert Means

### Profit-Taking Alerts (🎯)
Position is up significantly from your cost basis. Consider:
- Taking partial profits (sell 25-50%)
- Setting a trailing stop
- Letting winners run if thesis is intact

### Stop-Loss Alerts (⚠️)
Position is down significantly. Consider:
- Re-evaluating your thesis
- Cutting losses if thesis is broken
- Averaging down if thesis is intact and position is small

### RSI Signals
- **RSI > 70**: Overbought - may see a pullback
- **RSI < 30**: Oversold - may see a bounce
- Use as a timing tool, not a standalone signal

### Position Sizing
- **>25% of portfolio**: Concentrated risk, consider trimming
- Diversification reduces single-stock risk

### Moving Average Signals
- **Bullish**: Price > 50 DMA > 200 DMA
- **Bearish**: Price < 50 DMA < 200 DMA

### News Interpretation
Each news item is analyzed for:
- **Sentiment**: Bullish 📈 / Bearish 📉 / Neutral 📰
- **Affected Stocks**: Which of YOUR holdings may be impacted
- **Interpretation**: What the news means for your portfolio

The system automatically detects:
- Direct mentions of your stocks
- Sector-relevant news (semiconductors, solar, fintech, etc.)
- Macro events (Fed, rates, trade policy)

---

## ❌ Troubleshooting

### Email Not Arriving?

1. **Check GitHub Actions**: Actions tab → Click workflow run → View logs
2. **Check Spam Folder**: First emails often go to spam
3. **Verify Secrets**: Settings → Secrets → Confirm all 4 secrets exist

### "Invalid login" Error?

- Check `PERSONAL_EMAIL_APP_PASSWORD` has no spaces: `jykjgvuczqujptlq`
- Verify `PERSONAL_EMAIL_USER` is exactly: `sttonka9@gmail.com`

### Only Some Stocks Loading?

- Yahoo Finance may rate-limit requests
- Script has built-in delays to prevent this
- If persistent, try running again in a few minutes

---

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `scripts/personalMarketEmail.js` | Personal portfolio email script |
| `scripts/dailyMarketEmail.js` | OLC watchlist email (separate) |
| `.github/workflows/personal-market-email.yml` | Personal email automation |
| `.github/workflows/daily-market-email.yml` | OLC email automation (separate) |
| `PERSONAL_EMAIL_SETUP.md` | This setup guide |

---

## 🔒 Security Note

Your app password is stored securely in GitHub Secrets. It's encrypted and never visible in logs.

To regenerate if needed:
1. Go to https://myaccount.google.com/apppasswords
2. Delete the old password
3. Create a new one
4. Update `PERSONAL_EMAIL_APP_PASSWORD` in GitHub

---

## 💰 Cost

**Completely FREE!**

- ✅ GitHub Actions: Free for public repos
- ✅ Yahoo Finance API: Free, no key needed
- ✅ Gmail SMTP: Free

---

Happy investing! 📈

*Personal Portfolio Briefing - Automated Daily Analysis*
