# 🦬 Daily Market Email Setup Guide

This guide will help you set up the automated daily market email for **Old Logan Capital**.

## 📬 What You'll Receive

Every weekday at **7:00 AM EST**, you'll get an email covering:

| Stock | Company | Sector |
|-------|---------|--------|
| **NBIS** | Nebius Group | AI Infrastructure |
| **MNMD** | MindMed | Healthcare/Psychedelics |
| **PL** | Planet Labs | Space/Satellite Data |

Each stock includes:
- 📊 Current price with daily change
- 📈 52-week range and distance from high
- 📉 50-day and 200-day moving averages
- 📆 1-week, 1-month, 3-month, and YTD performance
- 🎯 Upcoming catalysts and key events
- 💡 Company overview and investment thesis

Plus market overview: S&P 500, Dow Jones, NASDAQ, and VIX.

---

## 🔧 Setup Instructions

### Step 1: Get Your Gmail App Password ✅ DONE

Your app password: `kmgc soit cblw xdbs`

(Without spaces: `kmgcsoitcblwxdbs`)

---

### Step 2: Add Secrets to GitHub

You need to add TWO secrets to your GitHub repository. Follow these exact steps:

#### 2A. Open GitHub Secrets Page

1. Go to your GitHub repository in your browser
2. Click the **Settings** tab (top menu, near "Insights")
3. In the left sidebar, scroll down to **Security** section
4. Click **Secrets and variables**
5. Click **Actions**
6. Click the green **New repository secret** button

#### 2B. Add First Secret (Email Address)

| Field | What to Enter |
|-------|---------------|
| **Name** | `EMAIL_USER` |
| **Secret** | `OldLoganCapital@gmail.com` |

Click the green **Add secret** button.

#### 2C. Add Second Secret (App Password)

Click **New repository secret** again.

| Field | What to Enter |
|-------|---------------|
| **Name** | `EMAIL_APP_PASSWORD` |
| **Secret** | `kmgcsoitcblwxdbs` |

Click the green **Add secret** button.

#### ✅ Verify Your Secrets

After adding both, you should see:

```
Repository secrets
──────────────────
EMAIL_APP_PASSWORD    Updated just now
EMAIL_USER            Updated just now
```

---

### Step 3: Push Code to GitHub

Make sure the latest code is pushed to your GitHub repository:

```powershell
cd "C:\Users\stton\OneDrive\Desktop\OLC App"
git add .
git commit -m "Add daily market email system"
git push
```

---

### Step 4: Test the Email

1. Go to your GitHub repository
2. Click the **Actions** tab (top menu)
3. In the left sidebar, click **Daily Market Email**
4. Click the **Run workflow** dropdown button (right side)
5. Click the green **Run workflow** button
6. Wait 1-2 minutes
7. Check your inbox at OldLoganCapital@gmail.com! 📧

---

## 📋 Quick Reference

### Your Configuration

| Setting | Value |
|---------|-------|
| **Recipient Email** | OldLoganCapital@gmail.com |
| **Schedule** | 7:00 AM EST, Monday-Friday |
| **Stocks Covered** | NBIS, MNMD, PL |

### GitHub Secrets Summary

| Secret Name | Value |
|-------------|-------|
| `EMAIL_USER` | `OldLoganCapital@gmail.com` |
| `EMAIL_APP_PASSWORD` | `kmgcsoitcblwxdbs` |

---

## 🛠️ Customization

### Change the Schedule

Edit `.github/workflows/daily-market-email.yml`:

```yaml
schedule:
  - cron: '0 12 * * 1-5'  # 7 AM EST weekdays
```

| Schedule | Cron Expression |
|----------|-----------------|
| 6 AM EST weekdays | `'0 11 * * 1-5'` |
| 7 AM EST weekdays | `'0 12 * * 1-5'` |
| 8 AM EST weekdays | `'0 13 * * 1-5'` |
| 9 AM EST weekdays | `'0 14 * * 1-5'` |
| 7 AM EST every day | `'0 12 * * *'` |

### Add or Remove Stocks

Edit `scripts/dailyMarketEmail.js`, find the `CONFIG.stocks` array:

```javascript
stocks: [
  { symbol: 'NBIS', name: 'Nebius Group', sector: 'Technology/AI Infrastructure' },
  { symbol: 'MNMD', name: 'MindMed', sector: 'Healthcare/Psychedelics' },
  { symbol: 'PL', name: 'Planet Labs', sector: 'Technology/Space Data' },
  // Add more stocks here:
  // { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
]
```

---

## ❌ Troubleshooting

### Email Not Arriving?

1. **Check GitHub Actions**: Go to Actions tab → Click on the workflow run → View logs
2. **Check Spam Folder**: The first email might go to spam
3. **Verify Secrets**: Settings → Secrets → Make sure both secrets exist

### "Invalid login" Error in Actions Log?

- Double-check `EMAIL_APP_PASSWORD` has no spaces: `kmgcsoitcblwxdbs`
- Make sure `EMAIL_USER` is exactly: `OldLoganCapital@gmail.com`

### Workflow Not Running?

- Make sure you pushed the code to GitHub
- Check that Actions are enabled (Actions tab → Enable if prompted)

---

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `scripts/dailyMarketEmail.js` | Main email script |
| `scripts/package.json` | Node.js dependencies |
| `.github/workflows/daily-market-email.yml` | Automation schedule |
| `DAILY_EMAIL_SETUP.md` | This setup guide |

---

## 💰 Cost

**Completely FREE!**

- ✅ GitHub Actions: Free for public repos
- ✅ Yahoo Finance API: Free, no key needed
- ✅ Gmail SMTP: Free

---

## 🔒 Security Note

Your app password (`kmgcsoitcblwxdbs`) is stored securely in GitHub Secrets. It's encrypted and never visible in logs. However, you may want to regenerate it periodically:

1. Go to https://myaccount.google.com/apppasswords
2. Delete the old password
3. Create a new one
4. Update the `EMAIL_APP_PASSWORD` secret in GitHub

---

Happy investing! 📈🦬

*Old Logan Capital - Automated Daily Briefing*
