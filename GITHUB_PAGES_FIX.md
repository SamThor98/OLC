# GitHub Pages Deployment Fix

## Issues Fixed

### 1. Missing GitHub Actions Workflow ✅
**Problem**: No automated build and deployment workflow existed, so the site wasn't being built and deployed to GitHub Pages.

**Solution**: Created `.github/workflows/deploy.yml` that:
- Automatically builds the app when you push to main/master
- Sets up environment variables from GitHub Secrets
- Deploys the built files to GitHub Pages

### 2. Missing .nojekyll File ✅
**Problem**: GitHub Pages uses Jekyll by default, which can interfere with single-page applications.

**Solution**: Created `public/.nojekyll` file to disable Jekyll processing.

### 3. Improved 404.html ✅
**Problem**: The 404.html redirect script could be more robust.

**Solution**: Enhanced the redirect script for better reliability.

## Next Steps

### 1. Set Up GitHub Secrets (Required for API to work)
Your Alpaca API keys need to be set as GitHub Secrets for the build process:

1. Go to: https://github.com/SamThor98/OLC/settings/secrets/actions
2. Click "New repository secret" and add:
   - **Name**: `VITE_ALPACA_API_KEY`
   - **Value**: Your Alpaca API key
3. Add another secret:
   - **Name**: `VITE_ALPACA_SECRET_KEY`
   - **Value**: Your Alpaca secret key
4. (Optional) Add:
   - **Name**: `VITE_ALPACA_USE_PAPER`
   - **Value**: `true` (or `false` for live trading)

### 2. Enable GitHub Pages with GitHub Actions
1. Go to: https://github.com/SamThor98/OLC/settings/pages
2. Under "Source", select **"GitHub Actions"** (NOT "Deploy from a branch")
3. Save the settings

### 3. Push the Changes
Commit and push the new files:
```bash
git add .github/workflows/deploy.yml public/.nojekyll public/404.html
git commit -m "Add GitHub Actions workflow for deployment"
git push
```

### 4. Check Deployment Status
1. Go to: https://github.com/SamThor98/OLC/actions
2. You should see a "Deploy to GitHub Pages" workflow running
3. Wait for it to complete (green checkmark)
4. Your site should be available at: https://samthor98.github.io/OLC/

## Troubleshooting

### If the workflow fails:
1. Check the Actions tab for error messages
2. Verify GitHub Secrets are set correctly
3. Make sure the repository name is exactly "OLC" (case-sensitive)
4. Check that `base: '/OLC/'` in `vite.config.ts` matches your repo name

### If the page loads but shows blank:
1. Open browser DevTools (F12)
2. Check the Console tab for errors
3. Check the Network tab for failed asset loads
4. Verify the base path in `vite.config.ts` matches your GitHub Pages URL

### If API calls don't work:
1. Verify GitHub Secrets are set correctly
2. Check browser console for API errors
3. Make sure the secrets are named exactly:
   - `VITE_ALPACA_API_KEY`
   - `VITE_ALPACA_SECRET_KEY`
   - `VITE_ALPACA_USE_PAPER` (optional)

## Important Notes

- The base path in `vite.config.ts` is set to `/OLC/` - this must match your repository name
- If you rename your repository, update the base path accordingly
- The workflow runs automatically on every push to main/master
- You can also trigger it manually from the Actions tab
