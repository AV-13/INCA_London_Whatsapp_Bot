# Photo URL Configuration Guide

## Overview

The Inca London WhatsApp bot serves photos to users. For WhatsApp to successfully download these photos, they must be accessible via a **publicly accessible URL** that Meta's servers can reach.

This guide explains how to set up photo URLs for both **local development** (with ngrok) and **production** (Azure).

---

## How It Works

The bot constructs photo URLs dynamically based on your environment:

```
Photo URL = BASE_URL + /assets/photos/ + filename
Example: https://your-ngrok-url.ngrok-free.dev/assets/photos/inca_show.jpg
```

---

## Local Development (ngrok)

### Setup Steps

1. **Start the bot server locally:**
   ```bash
   npm run dev
   # or
   node dist/index.js
   ```

2. **Expose with ngrok:**
   ```bash
   ngrok http 3000
   ```
   You'll see output like:
   ```
   Forwarding                    https://dilatory-keiko-dendrological.ngrok-free.dev -> http://localhost:3000
   ```

3. **Update `.env` with your ngrok URL:**
   ```env
   BASE_URL=https://dilatory-keiko-dendrological.ngrok-free.dev
   ```

4. **Verify the URL works:**
   ```bash
   curl https://dilatory-keiko-dendrological.ngrok-free.dev/assets/photos/inca_show.jpg
   # Should return the image (200 OK)
   ```

5. **Update your WhatsApp webhook URL in Meta Developer Console:**
   - Go to Meta Developer Console
   - WhatsApp > Configuration
   - Webhook URL: `https://your-ngrok-url/webhook/whatsapp`
   - Verify token: Match `META_WEBHOOK_VERIFY_TOKEN` from `.env`

6. **Test photo sending:**
   - Send a message like "Can you show me photos of the show?"
   - Bot should respond with description + send 2 photos automatically

### Troubleshooting

- **Photos not received?**
  - Check logs for `🖼️ Photo base URL: xxx` to see what URL is being used
  - Verify the URL is accessible: `curl -I https://your-ngrok-url/assets/photos/inca_show.jpg`
  - Make sure ngrok is still running and the URL hasn't changed

- **Ngrok URL expires?**
  - Free ngrok URLs change every 2 hours
  - Either upgrade to paid ngrok, or restart ngrok and update `.env`

---

## Production (Azure App Service)

### Setup Steps

1. **Build and deploy to Azure:**
   ```bash
   npm run build
   az webapp deployment source config-zip --resource-group <group> --name <app-name> --src <zip-file>
   ```

2. **In `.env`, set for production:**
   ```env
   NODE_ENV=production
   BASE_URL=   # Leave empty - will auto-use Azure URL
   ```

   Or explicitly:
   ```env
   BASE_URL=https://inca-london-wa-bot-av-dvhtghakgxaaetds.francecentral-01.azurewebsites.net
   ```

3. **Update your WhatsApp webhook URL in Meta Developer Console:**
   - Webhook URL: `https://inca-london-wa-bot-av-dvhtghakgxaaetds.francecentral-01.azurewebsites.net/webhook/whatsapp`

4. **Verify assets are served:**
   ```bash
   curl -I https://inca-london-wa-bot-av-dvhtghakgxaaetds.francecentral-01.azurewebsites.net/assets/photos/inca_show.jpg
   # Should return 200 OK
   ```

### How the Code Chooses the URL

Located in `src/whatsapp/webhook.ts`:

```typescript
function getPhotoBaseUrl(): string {
  // 1. If BASE_URL env var is set explicitly, use it (ngrok)
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/+$/, '');
  }

  // 2. If NODE_ENV=production, use Azure URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://inca-london-wa-bot-av-dvhtghakgxaaetds.francecentral-01.azurewebsites.net';
  }

  // 3. Default to localhost:3000 (for local testing without ngrok)
  return `http://localhost:${process.env.PORT || 3000}`;
}
```

**Priority order:**
1. `BASE_URL` environment variable (if set)
2. `NODE_ENV=production` → Use Azure URL
3. Default → `http://localhost:3000`

---

## Common Issues

### ❌ Photos fail with "failed" status in WhatsApp

**Cause:** WhatsApp can't download the image from the URL.

**Solutions:**
- Verify the URL is publicly accessible: `curl -I <your-url>/assets/photos/inca_show.jpg`
- Make sure you're using the correct ngrok URL (it changes every 2 hours on free plan)
- Check that the file exists: `ls assets/photos/`
- In Azure, verify static files are served correctly

### ❌ ngrok URL changes every 2 hours

**Solution:**
- Upgrade to paid ngrok for persistent URLs
- Or restart ngrok and update `.env` with new URL
- Or switch to Azure for production stability

### ❌ "Photo base URL is localhost" but using ngrok

**Cause:** `BASE_URL` not set in `.env`

**Solution:**
```bash
# Verify ngrok is running
ngrok http 3000

# Copy the forwarding URL and add to .env
BASE_URL=https://your-ngrok-url.ngrok-free.dev
```

---

## Testing Checklist

- [ ] Build succeeds: `npm run build`
- [ ] Server starts: `npm start` or `node dist/index.js`
- [ ] ngrok is running: `ngrok http 3000`
- [ ] `.env` has correct `BASE_URL` (ngrok) or is empty (Azure)
- [ ] Photo URL is accessible: `curl -I <url>/assets/photos/inca_show.jpg` → 200 OK
- [ ] WhatsApp webhook URL is updated in Meta Developer Console
- [ ] Test message: "Can you show me the show?" → Photo is received ✅

---

## Environment Variables Summary

| Variable | Local (ngrok) | Production (Azure) |
|----------|---------------|--------------------|
| `NODE_ENV` | `development` | `production` |
| `BASE_URL` | `https://your-ngrok-url.ngrok-free.dev` | Empty or leave unset |
| `PORT` | `3000` | `3000` (or as set by Azure) |

---

## File Structure

```
assets/
├── photos/
│   ├── inca_luna_lounge.jpg
│   ├── inca_main_room.jpg
│   ├── inca_show.jpg
│   ├── inca_show_two.jpg
│   ├── inca_table.jpg
│   └── inca_table_two.jpg
└── (other assets)

src/
└── whatsapp/
    └── webhook.ts          # Contains getPhotoBaseUrl() function
```

---

## Next Steps

1. **Local testing with ngrok:**
   - Run bot: `npm start`
   - Run ngrok: `ngrok http 3000`
   - Update `.env` with ngrok URL
   - Test with WhatsApp message

2. **Deploy to Azure:**
   - Build project: `npm run build`
   - Deploy: Use Azure deployment process
   - Update Meta webhook URL
   - Test with WhatsApp message

3. **Monitoring:**
   - Check logs for `🖼️ Photo base URL: xxx`
   - Monitor Meta webhook responses for "failed" status
   - Check Azure app logs if photos don't appear

