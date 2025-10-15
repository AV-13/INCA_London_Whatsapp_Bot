# Inca London WhatsApp Bot

An intelligent WhatsApp chatbot for **Inca London**, a premium Latin American restaurant and dinner-show venue in Soho, London.

## Overview

This bot provides automated customer service for Inca London via **Meta WhatsApp Business API**, powered by the **Mastra framework** and **OpenAI GPT-4** for natural language understanding.

**Key Features:**
- 🤖 AI-powered responses using Mastra framework and OpenAI GPT-4
- 🛠️ Custom tools for restaurant-specific information
- 📱 Meta WhatsApp Business API integration
- 🌐 Webhook-based architecture with Express server
- 🔧 No database or memory management required
- 🎯 Handles inquiries about reservations, menu, events, and more

## Prerequisites

Before you begin, ensure you have:
- Node.js (v18 or higher)
- npm or yarn
- **OpenAI API key** ([Get one here](https://platform.openai.com/api-keys))
- **Meta Developer Account** with WhatsApp Business API access
- **ngrok** for exposing local webhook ([Download here](https://ngrok.com/download))

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Inca_London
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Edit `.env` and fill in your credentials (see Configuration section below)

5. Build the TypeScript project:
```bash
npm run build
```

## Configuration

### Step 1: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env` file:
```env
OPENAI_API_KEY=sk-proj-xxxxx
```

### Step 2: Setup Meta WhatsApp Business API

#### Create Meta App
1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Click **Create App**
3. Choose **Business** type
4. Fill in app details and create

#### Configure WhatsApp
1. In your app dashboard, click **Add Product**
2. Find **WhatsApp** and click **Set Up**
3. Go to **API Setup** tab
4. Note down:
   - **Phone Number ID** (copy to `.env` as `META_WHATSAPP_PHONE_NUMBER_ID`)
   - **Access Token** (copy to `.env` as `META_WHATSAPP_TOKEN`)

#### Configure Webhook
1. Choose a verification token (any secure random string)
2. Add it to `.env` as `META_WEBHOOK_VERIFY_TOKEN`

### Step 3: Expose Your Server with ngrok

1. Install ngrok: https://ngrok.com/download
2. Start ngrok on port 3000:
```bash
ngrok http 3000
```
3. Copy the **HTTPS Forwarding URL** (e.g., `https://xxxx.ngrok.io`)
4. Add it to your `.env`:
```env
NGROK_URL=https://xxxx.ngrok.io
```

### Step 4: Configure Webhook in Meta

1. In Meta Developer Console, go to **WhatsApp > Configuration**
2. Click **Edit** next to Webhook
3. Enter:
   - **Callback URL**: `https://xxxx.ngrok.io/webhook`
   - **Verify Token**: The token you set in `.env` as `META_WEBHOOK_VERIFY_TOKEN`
4. Click **Verify and Save**
5. Subscribe to **messages** webhook field

### Final .env File

Your `.env` should look like this:
```env
NODE_ENV=development
PORT=3000

OPENAI_API_KEY=sk-proj-xxxxx
META_WHATSAPP_TOKEN=EAAxxxxx
META_WHATSAPP_PHONE_NUMBER_ID=123456789
META_WEBHOOK_VERIFY_TOKEN=your_secure_random_token

NGROK_URL=https://xxxx.ngrok.io
```

## Usage

### Starting the Bot

1. Start ngrok in a terminal:
```bash
ngrok http 3000
```

2. In another terminal, start the bot:
```bash
npm start
```

The server will start on port 3000 and display:
```
🚀 Inca London WhatsApp Bot is running!
📡 Server listening on port 3000
🌐 Webhook URL: http://localhost:3000/webhook
```

### Testing the Bot

1. Open WhatsApp on your phone
2. Send a message to your WhatsApp Business number
3. The bot should respond automatically!

**Test queries:**
- "Hello" → Welcome message
- "I want to make a reservation"
- "What's on the menu?"
- "What time do you open?"
- "What's the dress code?"
- "Where are you located?"

## Project Structure

```
Inca_London/
├── src/
│   ├── index.ts                  # Express server & main entry point
│   ├── config.ts                 # Restaurant information
│   ├── agent/
│   │   ├── mastra.ts            # Mastra agent configuration
│   │   └── tools.ts             # Custom tools for the agent
│   ├── whatsapp/
│   │   ├── client.ts            # Meta WhatsApp API client
│   │   └── webhook.ts           # Webhook handlers
│   ├── responses.ts             # (Legacy) Response templates
│   └── messageHandler.ts        # (Legacy) Intent detection
├── dist/                         # Compiled JavaScript
├── instructions.md               # Bot behavior guidelines
├── package.json
├── tsconfig.json
└── README.md
```

## How It Works

### Architecture

```
User → WhatsApp → Meta API → Webhook (ngrok) → Express Server
                                                      ↓
                                                 Mastra Agent
                                                      ↓
                                              OpenAI GPT-4 + Tools
                                                      ↓
                                              Response Generated
                                                      ↓
                                            Meta API → WhatsApp → User
```

### Mastra Agent

The bot uses the **Mastra framework** to create an intelligent agent:
- **Model**: OpenAI GPT-4 for natural language understanding
- **Instructions**: Comprehensive system prompt based on `instructions.md`
- **Tools**: Custom functions that provide restaurant-specific data

### Custom Tools

The agent has access to 6 custom tools:
1. **get_opening_hours** - Restaurant schedule
2. **get_contact_info** - Phone, email, social media
3. **get_dress_code** - Entry policies and requirements
4. **get_reservation_info** - Booking procedures and policies
5. **get_location_info** - Address and transport details
6. **get_private_events_info** - Event capabilities

### Webhook Flow

1. **User sends WhatsApp message**
2. **Meta sends webhook to `/webhook` endpoint**
3. **Express server receives and validates webhook**
4. **Message is processed by Mastra agent**
5. **Agent uses tools to get accurate information**
6. **OpenAI generates natural response**
7. **Response sent back via Meta API**

### No Database Required

- No memory/database persistence needed
- Each conversation is stateless
- OpenAI handles context within the conversation
- Tools provide real-time data from `config.ts`

## Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Build and start the server
- `npm run dev` - Build and run in development mode

## Production Deployment

### Option 1: Using PM2 (Recommended)

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Build the project:
```bash
npm run build
```

3. Start with PM2:
```bash
pm2 start dist/index.js --name inca-london-bot
```

4. Configure auto-restart:
```bash
pm2 startup
pm2 save
```

5. Monitor:
```bash
pm2 logs inca-london-bot
pm2 status
```

### Option 2: Using a Public URL Service

For production, replace ngrok with a proper hosting solution:

1. **Deploy to a cloud server** (AWS, DigitalOcean, Heroku, etc.)
2. **Use a domain name** instead of ngrok
3. **Configure webhook** with your production URL
4. **Set environment variables** on your server

Example with Heroku:
```bash
heroku create inca-london-bot
heroku config:set OPENAI_API_KEY=xxx
heroku config:set META_WHATSAPP_TOKEN=xxx
# ... set other env vars
git push heroku main
```

Then configure Meta webhook with: `https://inca-london-bot.herokuapp.com/webhook`

### Option 3: Using Docker

Create a `Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

Build and run:
```bash
docker build -t inca-london-bot .
docker run -d -p 3000:3000 --env-file .env --name inca-bot inca-london-bot
```

## Troubleshooting

### Webhook Verification Fails
- Double-check your `META_WEBHOOK_VERIFY_TOKEN` matches in both `.env` and Meta console
- Ensure ngrok is running and the URL is correct
- Check that your server is accessible at the webhook URL

### Bot Not Receiving Messages
- Verify webhook is configured correctly in Meta Developer Console
- Check that you subscribed to the **messages** webhook field
- Look at server logs for incoming webhook requests
- Test webhook with: `curl https://your-ngrok-url.ngrok.io/health`

### Bot Not Responding
- Check OpenAI API key is valid and has credits
- Verify Meta WhatsApp token hasn't expired
- Check server logs for error messages
- Ensure phone number ID is correct

### OpenAI Errors
```
Error: Invalid API key
```
- Verify your `OPENAI_API_KEY` in `.env`
- Check if your OpenAI account has credits

### Meta API Errors
```
Error: Invalid access token
```
- Token may have expired - generate a new one in Meta console
- Make sure the token has WhatsApp permissions

### ngrok Issues
- Free ngrok URLs expire after 2 hours - you'll need to restart and update Meta webhook
- Consider upgrading to ngrok paid plan for persistent URLs
- Or deploy to production with a real domain

### Dependencies Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use
```bash
# Find and kill process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

## Security Considerations

1. **Protect your `.env` file** - Never commit it to version control
2. **Keep API keys secure** - Rotate them regularly
3. **Use webhook signature validation** in production (implement in `webhook.ts`)
4. **Enable HTTPS** for production webhooks
5. **Implement rate limiting** to prevent abuse
6. **Monitor API usage** for OpenAI and Meta
7. **Use environment-specific tokens** (separate dev/prod)

## Maintenance

### Updating Restaurant Information

1. Edit `src/config.ts` to update:
   - Contact details
   - Operating hours
   - Policies
   - Venue information

2. Rebuild and restart:
```bash
npm run build
pm2 restart inca-london-bot  # if using PM2
```

### Modifying Agent Behavior

1. Edit system instructions in `src/agent/mastra.ts`
2. Adjust tone, style, or response patterns
3. Rebuild and restart

### Adding New Tools

1. Create new tool in `src/agent/tools.ts`:
```typescript
export const myNewTool = createTool({
  id: 'my_new_tool',
  description: 'What this tool does',
  inputSchema: z.object({ /* ... */ }),
  outputSchema: z.object({ /* ... */ }),
  execute: async ({ context }) => { /* ... */ },
});
```

2. Add to `incaLondonTools` array
3. Rebuild and restart

### Monitoring

Check logs regularly:
```bash
# If using PM2
pm2 logs inca-london-bot

# If running directly
# Logs appear in terminal
```

## API Endpoints

Once running, the following endpoints are available:

- `GET /` - Health check and service info
- `GET /health` - Detailed health status
- `GET /webhook` - Webhook verification (for Meta)
- `POST /webhook` - Incoming message handler (for Meta)

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `3000` |
| `OPENAI_API_KEY` | OpenAI API key | Yes | `sk-proj-xxx` |
| `META_WHATSAPP_TOKEN` | Meta access token | Yes | `EAAxxxxx` |
| `META_WHATSAPP_PHONE_NUMBER_ID` | Phone number ID | Yes | `123456789` |
| `META_WEBHOOK_VERIFY_TOKEN` | Webhook verification | Yes | `your_token` |
| `NGROK_URL` | Public URL | No | `https://xxx.ngrok.io` |

## Resources

- [Mastra Documentation](https://mastra.ai/docs)
- [Meta WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [ngrok Documentation](https://ngrok.com/docs)

## License

Private project for Inca London. All rights reserved.

---

**Built with:**
- [Mastra](https://mastra.ai/) - AI agent framework
- [OpenAI GPT-4](https://openai.com/) - Natural language AI
- [Meta WhatsApp Business API](https://developers.facebook.com/products/whatsapp/) - Messaging platform
- [Express](https://expressjs.com/) - Web framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Node.js](https://nodejs.org/) - JavaScript runtime

**Developed for Inca London**
*Where Latin Spirit meets London Nights* 🎭