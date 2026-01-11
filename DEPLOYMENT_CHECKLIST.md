# GitHub Pages Deployment Checklist

## Step 1: Enable GitHub Pages
1. Go to: https://github.com/SamThor98/OLC/settings/pages
2. Under "Source", select **"GitHub Actions"** (NOT "Deploy from a branch")
3. Save the settings

## Step 2: Make Repository Public (if needed)
1. Go to: https://github.com/SamThor98/OLC/settings
2. Scroll to "Danger Zone"
3. Click "Change visibility"
4. Select "Make public"

## Step 3: Check Workflow Status
1. Go to: https://github.com/SamThor98/OLC/actions
2. Look for "Deploy to GitHub Pages" workflow
3. Check if it completed successfully (green checkmark)
4. If it failed, click on it to see error messages

## Step 4: Wait for Deployment
- After enabling GitHub Pages, wait 1-2 minutes
- The site should be available at: https://samthor98.github.io/OLC/

## Troubleshooting
- If the workflow fails, check the error logs in the Actions tab
- Clear your browser cache or try incognito mode
- Make sure the repository name is exactly "OLC" (case-sensitive)
