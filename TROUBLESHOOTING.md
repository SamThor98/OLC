# Troubleshooting Connection Errors

## Quick Fixes

### 1. Check if the Dev Server is Running

Open a terminal/command prompt in the project directory and run:
```bash
npm run dev
```

You should see output like:
```
VITE v5.0.8  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 2. Check the Correct URL

Make sure you're accessing:
- **http://localhost:5173/** (default Vite port)

NOT:
- http://localhost:3000
- http://127.0.0.1:5173 (though this might work)

### 3. Port Already in Use?

If you see an error about the port being in use:
- Kill any existing processes on port 5173
- Or change the port by modifying `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // or any other port
  },
})
```

### 4. Clear Browser Cache

Try:
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or open in Incognito/Private mode
- Or clear browser cache entirely

### 5. Check for Console Errors

Open browser DevTools (F12) and check:
- Console tab for JavaScript errors
- Network tab for failed requests

### 6. Restart Everything

1. Stop the dev server (Ctrl+C in terminal)
2. Clear node_modules cache (optional):
   ```bash
   rm -rf node_modules
   npm install
   ```
3. Restart the dev server:
   ```bash
   npm run dev
   ```

### 7. Check Environment Variables

Make sure you have a `.env` file in the project root with:
```
VITE_ALPACA_API_KEY=your_key
VITE_ALPACA_SECRET_KEY=your_secret
VITE_ALPACA_USE_PAPER=true
```

### 8. Check Firewall/Antivirus

Sometimes security software blocks local connections. Try:
- Temporarily disabling firewall
- Adding an exception for Node.js
- Checking if antivirus is blocking the connection

### 9. Verify Node.js and npm

Check versions:
```bash
node --version  # Should be v18+
npm --version   # Should be recent
```

### 10. Check Network Tab

In browser DevTools → Network tab:
- Look for red failed requests
- Check if requests are pending
- Look for CORS errors

## Still Having Issues?

If none of these work:
1. Check the terminal where `npm run dev` is running for error messages
2. Share the specific error message you're seeing
3. Check if other local servers work (e.g., visit http://localhost:3000)
