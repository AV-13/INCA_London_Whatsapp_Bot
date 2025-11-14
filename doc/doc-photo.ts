/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║                   PHOTO SENDING DOCUMENTATION                         ║
 * ║              Complete Guide to La Java Bleue Photo System              ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * This documentation file centralizes all information about how photos
 * are sent to users in the La Java Bleue WhatsApp Bot.
 *
 * This is DOCUMENTATION ONLY - not executable code.
 * It serves as a comprehensive guide to the photo sending architecture.
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 1. OVERVIEW: PHOTO SENDING SYSTEM
 * ═══════════════════════════════════════════════════════════════════════
 *
 * The photo sending system works as follows:
 *
 *   User sends message
 *        ↓
 *   Webhook receives message (webhook.ts:processIncomingMessage)
 *        ↓
 *   Message sent to Mastra AI agent (mastra.ts:processUserMessage)
 *        ↓
 *   AI detects if user wants to see photos (mastra.ts:detectPhotoRequest)
 *        ↓
 *   Returns ProcessedMessageResult with sendPhotos object
 *        ↓
 *   Check if sendPhotos is set (webhook.ts:1028)
 *        ↓
 *   Generate localized captions in user's language
 *        ↓
 *   For each requested photo type:
 *        - Call whatsappClient.sendImage()
 *        - Pass PHOTO_URLS.[type] and caption
 *        ↓
 *   Image sent via Meta WhatsApp Cloud API
 *
 * STACK:
 * - Frontend: WhatsApp messaging app
 * - Backend: Node.js + Express + TypeScript
 * - AI: OpenAI GPT-4o-mini (via Mastra framework)
 * - API: Meta WhatsApp Business Cloud API (Graph API v21.0)
 * - Storage: Static file serving (Express.js static middleware)
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 2. PHOTO ASSETS & URLS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * LOCATION: /assets/photos/
 *
 * Three photo files are available:
 *
 *   1. Burger.jpg
 *      - Description: Signature charolais beef burger
 *      - Size: ~2-5MB (typical JPG image)
 *      - Quality: High-resolution restaurant photo
 *      - URL: https://domain.com/photos/Burger.jpg
 *
 *   2. steak-frite.jpg
 *      - Description: Steak with homemade beef fat fries
 *      - Size: ~2-5MB (typical JPG image)
 *      - Quality: High-resolution restaurant photo
 *      - URL: https://domain.com/photos/steak-frite.jpg
 *
 *   3. restaurant.jpg
 *      - Description: Restaurant ambiance and interior
 *      - Size: ~2-5MB (typical JPG image)
 *      - Quality: High-resolution restaurant photo
 *      - URL: https://domain.com/photos/restaurant.jpg
 *
 * URL CONFIGURATION (webhook.ts:397-404):
 *
 *   const PHOTO_BASE_URL = process.env.BASE_URL ||
 *     'https://la-java-bleue-wa-bot-ac9e2ab0abdd.herokuapp.com';
 *
 *   const PHOTO_URLS = {
 *     burger: `${PHOTO_BASE_URL}/photos/Burger.jpg`,
 *     steak: `${PHOTO_BASE_URL}/photos/steak-frite.jpg`,
 *     restaurant: `${PHOTO_BASE_URL}/photos/restaurant.jpg`,
 *   };
 *
 * The BASE_URL is configured via environment variable.
 * Photos are served via Express static middleware on /photos route.
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 3. EXPRESS STATIC FILE SERVING SETUP
 * ═══════════════════════════════════════════════════════════════════════
 *
 * LOCATION: src/index.ts:47-49
 *
 * Purpose: Make photos accessible via HTTP URLs
 *
 * CODE REFERENCE:
 *
 *   import { join } from 'path';
 *
 *   // Serve photos from assets/photos folder
 *   const photosPath = join(__dirname, '..', 'assets', 'photos');
 *   app.use('/photos', express.static(photosPath));
 *
 * EXPLANATION:
 * - join(__dirname, '..', 'assets', 'photos') = Constructs path to photos folder
 * - app.use('/photos', express.static(photosPath)) = Creates /photos route
 * - Any file in /assets/photos is now accessible via HTTP
 * - Example: /assets/photos/Burger.jpg → GET /photos/Burger.jpg
 *
 * RESULT:
 * - Photos become available at URLs like:
 *   https://domain.com/photos/Burger.jpg
 *   https://domain.com/photos/steak-frite.jpg
 *   https://domain.com/photos/restaurant.jpg
 *
 * These URLs are used to send photos via WhatsApp API.
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 4. WHATSAPP IMAGE SENDING METHOD
 * ═══════════════════════════════════════════════════════════════════════
 *
 * LOCATION: src/whatsapp/client.ts:136-163
 *
 * Method Name: sendImage()
 *
 * PURPOSE:
 * Send an image to a WhatsApp user via Meta WhatsApp Business API.
 *
 * SIGNATURE:
 *
 *   async sendImage(
 *     to: string,                    // Phone number (format: +1234567890)
 *     imageUrl: string,              // Full URL to image
 *     caption?: string               // Optional caption (max ~1000 chars)
 *   ): Promise<WhatsAppResponse>
 *
 * IMPLEMENTATION DETAILS:
 *
 *   1. Build Payload:
 *      {
 *        messaging_product: 'whatsapp',
 *        recipient_type: 'individual',
 *        to: '1234567890',
 *        type: 'image',
 *        image: {
 *          link: 'https://example.com/photos/Burger.jpg',
 *          caption: 'Our signature charolais burger' // Optional
 *        }
 *      }
 *
 *   2. Send Request:
 *      POST https://graph.facebook.com/v21.0/{phoneNumberId}/messages
 *      Authorization: Bearer {accessToken}
 *      Content-Type: application/json
 *
 *   3. Return Response:
 *      {
 *        messaging_product: 'whatsapp',
 *        contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
 *        messages: [{ id: 'wamid.xxx' }]
 *      }
 *
 * ERROR HANDLING:
 * - Throws Error with message: "Failed to send WhatsApp image: {error}"
 * - Logs error response from Meta API
 * - Non-retriable errors (invalid URL, auth failure, etc.) will throw
 *
 * LOGGING:
 * - "📤 Sending image to {to}: {imageUrl}" - Before sending
 * - "✅ Image sent successfully" - After successful send
 * - "❌ Error sending WhatsApp image: {error}" - On error
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 5. PHOTO REQUEST DETECTION (AI)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * LOCATION: src/agent/mastra.ts:788-850
 *
 * Function Name: detectPhotoRequest()
 *
 * PURPOSE:
 * Use OpenAI GPT-4o-mini to analyze user messages and detect if they're
 * asking for photos of:
 *   - Burger dishes
 *   - Steak/meat dishes
 *   - Restaurant ambiance/interior
 *
 * SIGNATURE:
 *
 *   async function detectPhotoRequest(
 *     mastra: Mastra,
 *     message: string
 *   ): Promise<{
 *     burger?: boolean;
 *     steak?: boolean;
 *     restaurant?: boolean;
 *   } | undefined>
 *
 * HOW IT WORKS:
 *
 *   1. Takes user's translated message (in English)
 *
 *   2. Creates AI prompt asking GPT to detect photo request intent:
 *      "Does the user want to see photos of:
 *       - Burger dishes? (true/false)
 *       - Steak dishes? (true/false)
 *       - Restaurant ambiance? (true/false)"
 *
 *   3. AI returns response like:
 *      "burger: false, steak: true, restaurant: false"
 *      or
 *      "none" (if no photo request detected)
 *
 *   4. Parse response and return object:
 *      { burger: false, steak: true, restaurant: false }
 *      or
 *      undefined (if response is "none")
 *
 * EXAMPLE TRIGGERS:
 *
 *   User Input                          → Detection Result
 *   "Show me your burgers"              → { burger: true }
 *   "Can I see photos of your food?"    → { burger: true, steak: true }
 *   "What does the restaurant look?"    → { restaurant: true }
 *   "Do you have photos of your meals?" → { burger: true, steak: true }
 *   "I want to see steak and fries"     → { steak: true }
 *   "What are your hours?"              → undefined (no photo request)
 *   "How much does it cost?"            → undefined (no photo request)
 *
 * RETURN VALUE:
 * - Object with boolean flags: { burger?, steak?, restaurant? }
 *   OR
 * - undefined: If AI determines no photo request
 *
 * NATURAL LANGUAGE UNDERSTANDING:
 * - Handles various phrasings of photo requests
 * - Understands context and intent
 * - Disambiguates between different photo types
 * - Can detect multiple photo requests in one message
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 6. PROCESSEDMESSAGERESULT INTERFACE
 * ═══════════════════════════════════════════════════════════════════════
 *
 * LOCATION: src/agent/mastra.ts:663-677
 *
 * PURPOSE:
 * Defines the structure of the response returned by the AI agent
 * after processing a user message. This includes flags for sending photos.
 *
 * INTERFACE DEFINITION:
 *
 *   export interface ProcessedMessageResult {
 *     text: string;                          // AI's response text to user
 *     detectedLanguage: string;              // ISO 639-1 code (en, fr, es, etc)
 *     sendMenuButton?: boolean;              // Send menu CTA button
 *     sendLocation?: boolean;                // Send restaurant location pin
 *     sendReservationButton?: boolean;       // Send reservation button
 *     sendDeliveryButton?: boolean;          // Send delivery/food service button
 *     sendTakeawayButton?: boolean;          // Send takeaway button
 *     sendGiftCardButton?: boolean;          // Send gift card button
 *     sendPhotos?: {
 *       burger?: boolean;                    // Send burger photo
 *       steak?: boolean;                     // Send steak photo
 *       restaurant?: boolean;                // Send restaurant photo
 *     };
 *   }
 *
 * PHOTO-RELATED FIELD:
 *
 *   sendPhotos?: {
 *     burger?: boolean;
 *     steak?: boolean;
 *     restaurant?: boolean;
 *   }
 *
 *   - Contains flags for which photos to send
 *   - Set by detectPhotoRequest() if photo request is detected
 *   - undefined if no photos should be sent
 *   - Each property is optional; only include if true
 *
 * EXAMPLE RESPONSES:
 *
 *   {
 *     text: "Voici les photos de nos burgers...",
 *     detectedLanguage: "fr",
 *     sendPhotos: { burger: true }
 *   }
 *
 *   {
 *     text: "Here are our signature dishes...",
 *     detectedLanguage: "en",
 *     sendPhotos: { burger: true, steak: true }
 *   }
 *
 *   {
 *     text: "Voici notre ambiance...",
 *     detectedLanguage: "fr",
 *     sendPhotos: { restaurant: true }
 *   }
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 7. PHOTO CAPTION GENERATION (LOCALIZED)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * LOCATION: src/whatsapp/webhook.ts:1033-1053
 *
 * PURPOSE:
 * Generate captions for photos in the user's detected language,
 * making the experience more personalized.
 *
 * PROCESS:
 *
 *   1. Detect user's language (from previous message detection)
 *   2. For each photo type (burger, steak, restaurant), call generateText()
 *   3. generateText() uses OpenAI GPT-4o-mini to create captions
 *   4. Captions respect length limits (8-10 words)
 *   5. Each caption is sent with the corresponding photo
 *
 * CAPTION GENERATION CALLS:
 *
 *   // For burger photo
 *   const burgerCaption = await generateText(
 *     mastra,
 *     'Photo caption for our signature charolais beef burger (max 10 words)',
 *     userLanguage,           // e.g., 'fr', 'en', 'es'
 *     'Short photo caption for burger'
 *   );
 *
 *   // For steak photo
 *   const steakCaption = await generateText(
 *     mastra,
 *     'Photo caption for steak with homemade beef fat fries (max 10 words)',
 *     userLanguage,
 *     'Short photo caption for steak-frites'
 *   );
 *
 *   // For restaurant photo
 *   const restaurantCaption = await generateText(
 *     mastra,
 *     'Photo caption for La Java Bleue restaurant ambiance (max 8 words)',
 *     userLanguage,
 *     'Short photo caption for restaurant interior'
 *   );
 *
 * MULTILINGUAL SUPPORT:
 *
 *   User Language → Caption Generated In
 *   ─────────────────────────────────────
 *   French (fr)  → French caption
 *   English (en) → English caption
 *   Spanish (es) → Spanish caption
 *   German (de)  → German caption
 *   Italian (it) → Italian caption
 *   Portuguese (pt) → Portuguese caption
 *   (Any supported language)
 *
 * CAPTION LENGTH:
 * - Burger: max 10 words
 * - Steak: max 10 words
 * - Restaurant: max 8 words
 *
 * WhatsApp caption limit is typically 1024 chars, but we keep them short
 * for better UX.
 *
 * EXAMPLE CAPTIONS:
 *
 *   Language: French
 *   ────────────────────────────────────────
 *   Burger:      "Notre burger signature au bœuf charolais 🍔"
 *   Steak:       "Steak accompagné de nos frites maison dorées ⭐"
 *   Restaurant:  "L'ambiance chaleureuse de La Java Bleue 🎭"
 *
 *   Language: English
 *   ────────────────────────────────────────
 *   Burger:      "Signature charolais beef burger perfection 🍔"
 *   Steak:       "Perfectly cooked steak with homemade fries ⭐"
 *   Restaurant:  "La Java Bleue's warm and welcoming ambiance 🎭"
 *
 * GENERATETEXT() FUNCTION:
 * Helper function that:
 *   1. Takes Mastra AI instance
 *   2. Takes AI prompt describing the caption
 *   3. Takes user's language code
 *   4. Takes context/description
 *   5. Returns generated caption text
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 8. WEBHOOK PHOTO SENDING LOGIC
 * ═══════════════════════════════════════════════════════════════════════
 *
 * LOCATION: src/whatsapp/webhook.ts:1027-1090
 *
 * Function: processIncomingMessage()
 *
 * PURPOSE:
 * Main entry point that orchestrates the entire photo sending workflow.
 *
 * SIMPLIFIED FLOW:
 *
 *   // 1. Receive user message from WhatsApp webhook
 *   const message = req.body.entry[0].changes[0].value.messages[0];
 *
 *   // 2. Extract user phone number and language
 *   const to = message.from;
 *   const userLanguage = // detected from previous interaction
 *
 *   // 3. Process message with AI agent
 *   const agentResponse: ProcessedMessageResult =
 *     await processUserMessage(mastra, message.text.body, to);
 *
 *   // 4. Check if photos should be sent
 *   if (agentResponse.sendPhotos) {
 *     // 5. Generate captions in user's language
 *     let burgerCaption = '';
 *     if (agentResponse.sendPhotos.burger) {
 *       burgerCaption = await generateText(
 *         mastra,
 *         'Photo caption for burger (max 10 words)',
 *         agentResponse.detectedLanguage,
 *         'Short burger caption'
 *       );
 *     }
 *
 *     // Similar for steak and restaurant...
 *
 *     // 6. Send each photo with caption
 *     if (agentResponse.sendPhotos.burger) {
 *       await whatsappClient.sendImage(
 *         to,
 *         PHOTO_URLS.burger,
 *         burgerCaption
 *       );
 *     }
 *
 *     if (agentResponse.sendPhotos.steak) {
 *       await whatsappClient.sendImage(
 *         to,
 *         PHOTO_URLS.steak,
 *         steakCaption
 *       );
 *     }
 *
 *     if (agentResponse.sendPhotos.restaurant) {
 *       await whatsappClient.sendImage(
 *         to,
 *         PHOTO_URLS.restaurant,
 *         restaurantCaption
 *       );
 *     }
 *   }
 *
 *   // 7. Send agent's text response
 *   await whatsappClient.sendTextMessage(to, agentResponse.text);
 *
 * FULL WEBHOOK HANDLER STRUCTURE:
 *
 *   app.post('/webhook', async (req, res) => {
 *     try {
 *       // Validate webhook (signature verification, etc.)
 *
 *       // Extract message
 *       const message = req.body.entry[0].changes[0].value.messages[0];
 *       if (!message) return res.status(200).send('OK');
 *
 *       // Get user contact info
 *       const contacts = req.body.entry[0].changes[0].value.contacts[0];
 *       const to = message.from;
 *
 *       // Process message with AI
 *       const agentResponse = await processUserMessage(
 *         mastra,
 *         message.text.body,
 *         to
 *       );
 *
 *       // Send photos if detected
 *       if (agentResponse.sendPhotos) {
 *         // Generate captions...
 *         // Send photos...
 *       }
 *
 *       // Send text response
 *       await whatsappClient.sendTextMessage(to, agentResponse.text);
 *
 *       res.status(200).send('OK');
 *     } catch (error) {
 *       console.error('Webhook error:', error);
 *       res.status(500).send('Error');
 *     }
 *   });
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 9. AI AGENT PHOTO INSTRUCTIONS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * LOCATION: src/agent/mastra.ts:552-587
 *
 * PURPOSE:
 * Instructions given to the AI agent on how to handle photo requests
 * and describe dishes.
 *
 * KEY INSTRUCTIONS TO THE AI:
 *
 *   1. PHOTO CAPABILITIES:
 *      "You can send photos of:
 *       - Burger (our signature charolais beef burger)
 *       - Steak (steak with homemade beef fat fries)
 *       - Restaurant ambiance (interior photos)"
 *
 *   2. AUTOMATIC PHOTO SENDING:
 *      "When users ask for photos, you should mention them naturally
 *       in your response. Photos are sent AUTOMATICALLY by the system
 *       based on keywords - you don't need to explicitly insert them."
 *
 *   3. DO NOT USE PLACEHOLDERS:
 *      "IMPORTANT: Do NOT include text like:
 *       - [photo]
 *       - [insérer photo]
 *       - [insert image]
 *       - [image here]
 *       - Any placeholder indicating where to insert photos"
 *
 *   4. NATURAL LANGUAGE:
 *      "Describe dishes and ambiance as if the photos will be sent
 *       naturally as part of the conversation.
 *
 *       ✓ GOOD: 'Our signature burger au bœuf charolais élevé en
 *                 Haute-Loire, avec pain brioché maison et nos
 *                 fameuses frites 😋'
 *
 *       ✗ BAD: '[photo] Our burger [insérer photo des détails]'"
 *
 *   5. SYSTEM BEHAVIOR:
 *      "The system will:
 *       1. Detect if you mentioned wanting to see photos
 *       2. Generate appropriate captions
 *       3. Send the photos with captions
 *       4. Then send your text response"
 *
 * EXAMPLE AI RESPONSE:
 *
 *   User: "Show me your burgers"
 *
 *   AI response (with sendPhotos: { burger: true } automatically set):
 *   "Voici nos burgers ! Notre signature est le burger au bœuf
 *    charolais élevé en Haute-Loire, avec un pain brioché maison
 *    et nos fameuses frites dorées. Un vrai délice ! 🍔"
 *
 *   System does:
 *   1. Detects: User wants photos of burger
 *   2. Sets: sendPhotos: { burger: true }
 *   3. Generates caption: "Notre burger signature au bœuf charolais 🍔"
 *   4. Sends: Photo with caption
 *   5. Sends: AI response text
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 10. COMPLETE MESSAGE FLOW DIAGRAM
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ USER SENDS MESSAGE VIA WHATSAPP                                  │
 * │ Example: "Show me your burgers please"                           │
 * └─────────────────────┬───────────────────────────────────────────┘
 *                       │
 *                       ↓
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ WEBHOOK RECEIVES MESSAGE                                         │
 * │ File: webhook.ts:processIncomingMessage()                        │
 * │ Extracts: phone_number, message_text, timestamp                  │
 * └─────────────────────┬───────────────────────────────────────────┘
 *                       │
 *                       ↓
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ DETECT USER LANGUAGE                                             │
 * │ File: mastra.ts:detectLanguageWithMastra()                       │
 * │ Result: language = "en" or "fr" or "es" etc.                    │
 * └─────────────────────┬───────────────────────────────────────────┘
 *                       │
 *                       ↓
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ TRANSLATE TO ENGLISH (if needed)                                 │
 * │ File: mastra.ts:translateToEnglish()                             │
 * │ Reason: AI intent detection works best in English                │
 * │ Input: "Montrez-moi vos burgers s'il vous plaît"               │
 * │ Output: "Show me your burgers please"                            │
 * └─────────────────────┬───────────────────────────────────────────┘
 *                       │
 *                       ↓
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ PROCESS MESSAGE WITH AI AGENT                                    │
 * │ File: mastra.ts:processUserMessage()                             │
 * │ - Uses: OpenAI GPT-4o-mini                                       │
 * │ - Input: translated message (English)                            │
 * │ - Output: ProcessedMessageResult                                 │
 * └─────────────────────┬───────────────────────────────────────────┘
 *                       │
 *                       ↓
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ DETECT PHOTO REQUEST (inside processUserMessage)                │
 * │ File: mastra.ts:detectPhotoRequest()                             │
 * │ Input: "Show me your burgers please"                             │
 * │ AI Question: "Does user want to see photos of:                  │
 * │             - burger? - steak? - restaurant?"                    │
 * │ Output: { burger: true }                                         │
 * └─────────────────────┬───────────────────────────────────────────┘
 *                       │
 *                       ↓
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ GENERATE AI RESPONSE                                             │
 * │ File: mastra.ts (AI agent system instructions)                   │
 * │ - AI writes response in detected user language                   │
 * │ - Does NOT include photo placeholders                            │
 * │ - Describes dishes naturally                                     │
 * │ Example (French): "Voici nos burgers..."                        │
 * │ Example (English): "Here are our burgers..."                     │
 * └─────────────────────┬───────────────────────────────────────────┘
 *                       │
 *                       ↓ (Return ProcessedMessageResult)
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ WEBHOOK RECEIVES AGENT RESULT                                    │
 * │ File: webhook.ts:1028-1090                                       │
 * │ {                                                                │
 * │   text: "Voici nos burgers...",                                 │
 * │   detectedLanguage: "fr",                                        │
 * │   sendPhotos: { burger: true }                                  │
 * │ }                                                                │
 * └─────────────────────┬───────────────────────────────────────────┘
 *                       │
 *                       ↓ Check: if (agentResponse.sendPhotos)
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ GENERATE PHOTO CAPTIONS IN USER'S LANGUAGE                       │
 * │ File: webhook.ts:1033-1053                                       │
 * │ - Call: generateText(mastra, prompt, "fr", "Short caption")      │
 * │ - AI creates: "Notre burger signature au bœuf charolais 🍔"    │
 * │ - Respects: Max 10 words per caption                             │
 * │ - Language: Same as user's detected language (French in example) │
 * └─────────────────────┬───────────────────────────────────────────┘
 *                       │
 *                       ↓ For each photo in sendPhotos
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ SEND PHOTO VIA WHATSAPP                                          │
 * │ File: client.ts:sendImage()                                      │
 * │                                                                  │
 * │ Step 1: Build payload                                            │
 * │ {                                                                │
 * │   messaging_product: "whatsapp",                                 │
 * │   recipient_type: "individual",                                  │
 * │   to: "33612345678",                                             │
 * │   type: "image",                                                 │
 * │   image: {                                                       │
 * │     link: "https://domain.com/photos/Burger.jpg",               │
 * │     caption: "Notre burger signature au bœuf charolais 🍔"     │
 * │   }                                                              │
 * │ }                                                                │
 * │                                                                  │
 * │ Step 2: Send to Meta API                                         │
 * │ POST https://graph.facebook.com/v21.0/{phoneNumberId}/messages   │
 * │ Authorization: Bearer {accessToken}                              │
 * │                                                                  │
 * │ Step 3: Meta downloads image from URL and sends to WhatsApp      │
 * │ Image → WhatsApp servers → User's phone                          │
 * └─────────────────────┬───────────────────────────────────────────┘
 *                       │
 *                       ↓ (Photo received on user's phone)
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ USER SEES PHOTO IN WHATSAPP                                      │
 * │ - Image with caption below it                                    │
 * │ - Caption in user's language (French, English, etc.)             │
 * │ - Example: Photo of burger with "Notre burger signature..." text │
 * └─────────────────────┬───────────────────────────────────────────┘
 *                       │
 *                       ↓ (After all photos sent)
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ SEND TEXT RESPONSE                                               │
 * │ File: webhook.ts → client.ts:sendTextMessage()                   │
 * │                                                                  │
 * │ Message: "Voici nos burgers ! Notre signature est le burger au  │
 * │          bœuf charolais élevé en Haute-Loire, avec un pain     │
 * │          brioché maison et nos fameuses frites dorées..."       │
 * │                                                                  │
 * │ Sent to: WhatsApp user                                           │
 * └─────────────────────┬───────────────────────────────────────────┘
 *                       │
 *                       ↓
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ USER SEES FULL RESPONSE                                          │
 * │ 1. First: Photo of burger (with caption)                         │
 * │ 2. Then: Detailed description text from AI                       │
 * │ 3. User can now see and read about the burger                    │
 * └─────────────────────────────────────────────────────────────────┘
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 11. FILES INVOLVED IN PHOTO SENDING
 * ═══════════════════════════════════════════════════════════════════════
 *
 * The following files are involved in the complete photo sending system:
 *
 * ┌─ SOURCE CODE FILES ────────────────────────────────────────────┐
 * │                                                                 │
 * │ 1. src/whatsapp/client.ts (134-163)
 * │    ├─ sendImage() method
 * │    ├─ Sends image via Meta API
 * │    └─ Key function for photo transmission
 * │
 * │ 2. src/whatsapp/webhook.ts (1027-1090)
 * │    ├─ Photo sending orchestration
 * │    ├─ Caption generation
 * │    └─ Main photo flow in processIncomingMessage()
 * │
 * │ 3. src/whatsapp/webhook.ts (397-404)
 * │    ├─ PHOTO_BASE_URL configuration
 * │    ├─ PHOTO_URLS mapping
 * │    └─ Photo URL constants
 * │
 * │ 4. src/agent/mastra.ts (788-850)
 * │    ├─ detectPhotoRequest() function
 * │    ├─ AI-based photo request detection
 * │    └─ Returns sendPhotos flags
 * │
 * │ 5. src/agent/mastra.ts (663-677)
 * │    ├─ ProcessedMessageResult interface
 * │    ├─ Defines sendPhotos object structure
 * │    └─ Response format from AI agent
 * │
 * │ 6. src/agent/mastra.ts (552-587)
 * │    ├─ AI agent system instructions
 * │    ├─ Instructs AI on photo handling
 * │    └─ Photo-related system prompts
 * │
 * │ 7. src/index.ts (47-49)
 * │    ├─ Express static file serving setup
 * │    ├─ Maps /photos route to /assets/photos directory
 * │    └─ Makes photos accessible via HTTP
 * │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * ┌─ ASSET FILES ──────────────────────────────────────────────────┐
 * │                                                                 │
 * │ assets/photos/
 * │  ├─ Burger.jpg (Signature charolais beef burger)
 * │  ├─ steak-frite.jpg (Steak with homemade fries)
 * │  └─ restaurant.jpg (Restaurant ambiance)
 * │
 * └─────────────────────────────────────────────────────────────────┘
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 12. ENVIRONMENT CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════
 *
 * REQUIRED ENVIRONMENT VARIABLES:
 *
 *   1. BASE_URL
 *      Purpose: Base URL for photo serving
 *      Example: "https://la-java-bleue-wa-bot-ac9e2ab0abdd.herokuapp.com"
 *      Usage: Prepended to PHOTO_URLS (burger, steak, restaurant)
 *      Fallback: If not set, defaults to Heroku production URL
 *
 *   2. WHATSAPP_ACCESS_TOKEN
 *      Purpose: Meta WhatsApp Business API access token
 *      Required for: sendImage() and other API calls
 *      Obtained from: Meta Business Account
 *
 *   3. WHATSAPP_PHONE_NUMBER_ID
 *      Purpose: Phone number ID for sending messages
 *      Required for: WhatsAppClient constructor
 *      Format: Numeric ID provided by Meta
 *
 *   4. OPENAI_API_KEY
 *      Purpose: OpenAI API key for AI caption generation and photo detection
 *      Required for: GPT-4o-mini model calls via Mastra
 *
 * ENVIRONMENT SETUP:
 *
 *   .env file should contain:
 *   ─────────────────────────────────────────
 *   BASE_URL=https://your-domain.com
 *   WHATSAPP_ACCESS_TOKEN=your_meta_token
 *   WHATSAPP_PHONE_NUMBER_ID=123456789
 *   OPENAI_API_KEY=your_openai_key
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 13. MULTILINGUAL SUPPORT DETAILS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * LANGUAGE DETECTION:
 * - User message is analyzed to detect language
 * - Function: detectLanguageWithMastra() in mastra.ts:687-741
 * - Returns: ISO 639-1 code (en, fr, es, de, it, pt, zh, ja, ar, etc.)
 * - Ignores ISO date/time formats to avoid false detection
 *
 * MESSAGE PROCESSING:
 * - User message is translated to English for AI intent detection
 * - This ensures consistent photo request detection across languages
 * - Original language is preserved for later use
 *
 * CAPTION GENERATION:
 * - Captions are generated in the user's detected language
 * - Each photo type (burger, steak, restaurant) has its own prompt
 * - Captions respect length limits (8-10 words)
 * - Culturally appropriate descriptions in user's language
 *
 * AI RESPONSE:
 * - AI generates text response in user's detected language
 * - No translation of AI response; generated directly in user's language
 * - Provides authentic experience in user's native language
 *
 * SUPPORTED LANGUAGES (tested):
 * - French (fr)
 * - English (en)
 * - Spanish (es)
 * - German (de)
 * - Italian (it)
 * - Portuguese (pt)
 * - Chinese (zh)
 * - Japanese (ja)
 * - Arabic (ar)
 * - And many others (any language supported by OpenAI)
 *
 * EXAMPLE: French User
 * ───────────────────────────────────────────
 * 1. User sends: "Montrez-moi vos burgers"
 * 2. Language detected: "fr"
 * 3. Translated to English: "Show me your burgers"
 * 4. Photo request detected: { burger: true }
 * 5. Caption generated in French: "Notre burger signature au bœuf charolais 🍔"
 * 6. Photo sent with French caption
 * 7. AI response in French: "Voici nos burgers magnifiques..."
 *
 * EXAMPLE: Spanish User
 * ───────────────────────────────────────────
 * 1. User sends: "Muéstrame tus burguesas"
 * 2. Language detected: "es"
 * 3. Translated to English: "Show me your burgers"
 * 4. Photo request detected: { burger: true }
 * 5. Caption generated in Spanish: "Nuestra hamburguesa de res Charolais 🍔"
 * 6. Photo sent with Spanish caption
 * 7. AI response in Spanish: "Aquí están nuestras deliciosas hamburguesas..."
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 14. ERROR HANDLING & EDGE CASES
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ERROR SCENARIOS:
 *
 * 1. INVALID PHOTO URL
 *    Scenario: Image file missing or URL incorrect
 *    Error: "Failed to send WhatsApp image: Invalid URL"
 *    Handling: sendImage() throws error, caught in webhook try-catch
 *    Result: User gets error response instead of photo
 *
 * 2. META API QUOTA EXCEEDED
 *    Scenario: Too many API calls in short time
 *    Error: Meta API returns rate limit error
 *    Handling: sendImage() throws error
 *    Result: Webhook catches and logs error
 *
 * 3. INVALID ACCESS TOKEN
 *    Scenario: Expired or wrong WhatsApp access token
 *    Error: "Failed to send WhatsApp image: Unauthorized"
 *    Handling: Webhook catches error
 *    Result: No photo sent, error logged
 *    Action needed: Update WHATSAPP_ACCESS_TOKEN in environment
 *
 * 4. PHOTO DETECTION AMBIGUITY
 *    Scenario: Message could mean multiple photo requests
 *    Example: "Do you have burgers and steaks?"
 *    Behavior: AI correctly identifies both: { burger: true, steak: true }
 *    Result: Both photos sent to user
 *
 * 5. NO PHOTO REQUEST DETECTED
 *    Scenario: User asks about hours, price, reservation, etc.
 *    Example: "What are your opening hours?"
 *    Behavior: AI returns undefined for sendPhotos
 *    Result: No photos sent, only text response
 *
 * 6. LANGUAGE DETECTION FAILURE
 *    Scenario: AI cannot determine language
 *    Fallback: Defaults to English ('en')
 *    Captions generated: In English
 *    Result: Suboptimal UX but system continues working
 *
 * 7. CAPTION GENERATION TIMEOUT
 *    Scenario: OpenAI API takes too long to generate caption
 *    Timeout: 30 seconds (typical)
 *    Handling: Catch and continue (empty caption)
 *    Result: Photo still sent, just without caption
 *
 * RECOVERY STRATEGIES:
 *
 * - All sendImage() calls are wrapped in try-catch
 * - Errors are logged for debugging
 * - Webhook returns 200 OK even if photo sending fails (non-blocking)
 * - User receives at least the text response
 * - Photos are optional content, not blocking main conversation
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 15. PERFORMANCE CONSIDERATIONS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * PHOTO SENDING PERFORMANCE:
 *
 * Operation                           Expected Time
 * ──────────────────────────────────────────────────────
 * Detect language                     0.5-1.0 seconds
 * Process message with AI             1-3 seconds
 * Detect photo request                0.5-1.0 seconds
 * Generate 1 caption                  0.5-1.0 seconds
 * Generate 3 captions                 1.5-3.0 seconds
 * Send 1 photo via API                0.5-1.0 seconds
 * Send 3 photos (sequential)          1.5-3.0 seconds
 * Total for 3 photos                  ~4-10 seconds
 * ──────────────────────────────────────────────────────
 *
 * OPTIMIZATION NOTES:
 *
 * 1. SEQUENTIAL PHOTO SENDING
 *    - Photos are sent one at a time
 *    - Why: WhatsApp UX is better with sequential messages
 *    - Alternative: Could parallelize with Promise.all()
 *    - Current: Intentionally sequential
 *
 * 2. CAPTION GENERATION
 *    - Currently sequential: burger → steak → restaurant
 *    - Could optimize: Generate captions in parallel
 *    - Trade-off: Current approach is simpler, slightly slower
 *
 * 3. IMAGE SIZE
 *    - Photos stored as JPG (compressed)
 *    - Typical size: 200-500 KB per image
 *    - Meta API handles image download and optimization
 *    - No need to resize on server
 *
 * 4. CACHING OPPORTUNITIES
 *    - Photo URLs are static (same for all users)
 *    - Captions could be cached per language (not currently done)
 *    - Language detection could use cache (not currently done)
 *    - Photo URLs in memory: webhook.ts:397-404
 *
 * 5. BANDWIDTH
 *    - Images served via Express static middleware
 *    - No database queries needed
 *    - Static file serving is efficient
 *    - Consider CDN for very high traffic
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 16. SECURITY CONSIDERATIONS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * POTENTIAL RISKS & MITIGATIONS:
 *
 * 1. PHOTO URL MANIPULATION
 *    Risk: Attacker could modify PHOTO_URLS to point to malicious content
 *    Mitigation: URLs are hardcoded constants in webhook.ts
 *    Status: ✓ Secure (URLs cannot be changed by user input)
 *
 * 2. WHATSAPP API TOKEN EXPOSURE
 *    Risk: Access token could be leaked in logs or error messages
 *    Mitigation: Token only used in HTTP Authorization header
 *    Status: ✓ Secure (not logged or displayed)
 *
 * 3. IMAGE FILE ACCESS
 *    Risk: Attacker could request arbitrary files from /photos route
 *    Status: ✓ Safe (Express static only serves from /assets/photos)
 *
 * 4. MESSAGE INJECTION
 *    Risk: User sends malicious text that corrupts photo data
 *    Mitigation: Photo data is hardcoded, separate from user input
 *    Status: ✓ Secure (user input doesn't affect photo URLs)
 *
 * 5. CAPTION INJECTION
 *    Risk: User crafts input that generates malicious caption
 *    Mitigation: Captions go through AI generation with safety prompts
 *    Status: ✓ Safe (AI guardrails prevent malicious content)
 *
 * 6. RATE LIMITING
 *    Risk: Attacker floods with photo requests
 *    Current mitigation: Meta API has rate limits
 *    Recommended: Add application-level rate limiting
 *    Status: ⚠ Consider adding per-user rate limits
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 17. TESTING THE PHOTO SENDING SYSTEM
 * ═══════════════════════════════════════════════════════════════════════
 *
 * TEST CASE 1: Basic Photo Request (French)
 * ────────────────────────────────────────────────────────────────
 * Input:   User sends: "Montrez-moi vos burgers s'il vous plaît"
 * Expected:
 *   1. Language detected: "fr" (French)
 *   2. Photo detected: { burger: true }
 *   3. Caption generated in French
 *   4. Photo sent with French caption
 *   5. Text response in French
 * Verification: User receives burger photo + French caption + French text
 *
 * TEST CASE 2: Multiple Photo Request (English)
 * ────────────────────────────────────────────────────────────────
 * Input:   User sends: "Can I see your burgers and steaks?"
 * Expected:
 *   1. Language detected: "en" (English)
 *   2. Photos detected: { burger: true, steak: true }
 *   3. Two captions generated in English
 *   4. Both photos sent with English captions
 *   5. Text response in English
 * Verification: User receives 2 photos (burger + steak) + English captions + text
 *
 * TEST CASE 3: Restaurant Photo Only (Spanish)
 * ────────────────────────────────────────────────────────────────
 * Input:   User sends: "¿Cómo se ve el restaurante?"
 * Expected:
 *   1. Language detected: "es" (Spanish)
 *   2. Photo detected: { restaurant: true }
 *   3. Caption generated in Spanish
 *   4. Restaurant photo sent with Spanish caption
 *   5. Text response in Spanish
 * Verification: User receives restaurant photo + Spanish caption + Spanish text
 *
 * TEST CASE 4: No Photo Request
 * ────────────────────────────────────────────────────────────────
 * Input:   User sends: "What are your opening hours?"
 * Expected:
 *   1. Language detected: "en" (English)
 *   2. Photo detected: undefined (no photo request)
 *   3. No photos sent
 *   4. Text response with opening hours
 * Verification: User receives only text response, no photos
 *
 * TEST CASE 5: Ambiguous Intent
 * ────────────────────────────────────────────────────────────────
 * Input:   User sends: "Show me your menu and restaurant"
 * Expected:
 *   1. Language detected: based on message language
 *   2. Photos detected: { burger: true, steak: true, restaurant: true }
 *   3. All three photos sent with captions
 *   4. Text response describing the full menu
 * Verification: User receives all 3 photos + captions + menu description
 *
 * MANUAL TESTING STEPS:
 * ────────────────────────────────────────────────────────────────
 * 1. Open WhatsApp with business account number
 * 2. Send test messages from different accounts
 * 3. Verify:
 *    - Photos arrive in correct order
 *    - Captions are in correct language
 *    - Text response is in correct language
 *    - No photos sent for non-photo requests
 * 4. Check server logs for:
 *    - "📤 Sending image" messages
 *    - "✅ Image sent successfully"
 *    - Language detection logs
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 18. FUTURE IMPROVEMENTS & ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * POTENTIAL ENHANCEMENTS:
 *
 * 1. PHOTO CAROUSEL/GALLERY
 *    Current: Photos sent individually (one by one)
 *    Enhancement: Use WhatsApp interactive carousel format
 *    Benefit: Better UX, photos displayed together
 *    API: Use type: 'interactive' with carousel action
 *
 * 2. PHOTO METADATA
 *    Current: Photos have only captions
 *    Enhancement: Add ingredient lists, prices, allergen info
 *    Benefit: Richer information, better for food items
 *    Implementation: Store metadata in database
 *
 * 3. DYNAMIC PHOTO GENERATION
 *    Current: Static photos stored on disk
 *    Enhancement: Generate photos dynamically (e.g., with current date)
 *    Benefit: Can show live updates, daily specials
 *    Technology: Could use image manipulation library (ImageMagick, etc.)
 *
 * 4. PHOTO UPLOADING
 *    Current: Photos pre-stored on server
 *    Enhancement: Admin panel to upload new photos
 *    Benefit: Easy updates without redeployment
 *    Implementation: File upload endpoint + database
 *
 * 5. CAPTION CACHING
 *    Current: Captions generated every time
 *    Enhancement: Cache captions per language
 *    Benefit: Faster response, lower API costs
 *    Implementation: In-memory cache or Redis
 *
 * 6. PHOTO VARIANTS
 *    Current: One photo per dish
 *    Enhancement: Multiple photos per dish
 *    Example: Burger from different angles, with different sides, etc.
 *    API: Let user request "show all burger photos"
 *
 * 7. ANALYTICS & TRACKING
 *    Current: Photos sent but no tracking
 *    Enhancement: Track which photos are requested most
 *    Benefit: Understand user interests
 *    Implementation: Log photo requests to database
 *
 * 8. BATCH PROCESSING
 *    Current: Photos sent sequentially
 *    Enhancement: Send photos in parallel (if WhatsApp allows)
 *    Benefit: Faster delivery
 *    Trade-off: May look less natural in chat
 *
 * 9. PHOTO SCHEDULING
 *    Current: Photos available anytime
 *    Enhancement: Schedule photo availability
 *    Example: Show seasonal dishes only in season
 *    Implementation: Time-based conditional logic
 *
 * 10. VIDEO SUPPORT
 *     Current: Static photos only
 *     Enhancement: Support for videos (restaurant tour, dish preparation)
 *     API: Meta supports video type, already in sendDocument logic
 *     Implementation: Add video files and detection logic
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 19. DEBUGGING & TROUBLESHOOTING
 * ═══════════════════════════════════════════════════════════════════════
 *
 * COMMON ISSUES & SOLUTIONS:
 *
 * ISSUE: Photos not being sent
 * ──────────────────────────────────────────────────────────────
 * Possible causes:
 *   1. sendPhotos is not set (photo not detected by AI)
 *   2. Meta API token expired
 *   3. Photo URL incorrect (404 error)
 *   4. Webhook error (check logs for exceptions)
 *
 * Debug steps:
 *   1. Check webhook logs for "📤 Sending image" message
 *   2. If not present, photo detection failed - check AI prompt
 *   3. If present but failed, check Meta API error logs
 *   4. Verify WHATSAPP_ACCESS_TOKEN is valid
 *   5. Test photo URL in browser: https://domain.com/photos/Burger.jpg
 *
 * ISSUE: Captions in wrong language
 * ──────────────────────────────────────────────────────────────
 * Possible causes:
 *   1. Language detection incorrect
 *   2. Caption generation using wrong language code
 *   3. User sent mixed-language message (ambiguous)
 *
 * Debug steps:
 *   1. Check logs for "🌍 Language detection" output
 *   2. Verify detected language matches user's language
 *   3. If detection wrong, check message for ISO dates/times
 *   4. Try again with clearer message
 *
 * ISSUE: Photos arrive but without captions
 * ──────────────────────────────────────────────────────────────
 * Possible causes:
 *   1. Caption generation timed out
 *   2. OpenAI API key expired
 *   3. Caption generation error (caught silently)
 *
 * Debug steps:
 *   1. Check logs for caption generation attempts
 *   2. Verify OPENAI_API_KEY is set and valid
 *   3. Check for timeout errors in logs
 *   4. Photos still arrive because caption is optional
 *
 * ISSUE: Webhook returns error 500
 * ──────────────────────────────────────────────────────────────
 * Possible causes:
 *   1. Unhandled exception in message processing
 *   2. AI agent error
 *   3. WhatsApp API error
 *
 * Debug steps:
 *   1. Check server error logs
 *   2. Look for stack traces
 *   3. Test with simple text message first
 *   4. Test photo request separately
 *
 * LOGGING LOCATIONS:
 *
 * - Server console: npm run dev (if running locally)
 * - Heroku logs: heroku logs --tail (if on Heroku)
 * - CloudWatch: AWS console (if on AWS)
 * - Application monitoring: Check monitoring service
 *
 * KEY LOG MESSAGES TO LOOK FOR:
 *
 *   "🌍 Language detection details:" - Language detection
 *   "📤 Sending image to" - Photo sending attempt
 *   "✅ Image sent successfully" - Photo sent OK
 *   "❌ Error sending WhatsApp image" - Photo send failed
 *   "📤 Sending message to" - Text sending attempt
 *   "✅ Message sent successfully" - Text sent OK
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 20. SUMMARY & QUICK REFERENCE
 * ═══════════════════════════════════════════════════════════════════════
 *
 * PHOTO SENDING SYSTEM AT A GLANCE:
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │ COMPONENTS                                                   │
 * ├─────────────────────────────────────────────────────────────┤
 * │ • Photo storage: /assets/photos/ (3 JPG files)              │
 * │ • Photo serving: Express static @ /photos route             │
 * │ • Photo URLs: PHOTO_URLS object in webhook.ts              │
 * │ • Photo detection: AI-based via detectPhotoRequest()        │
 * │ • Photo sending: sendImage() in WhatsApp client             │
 * │ • Caption generation: generateText() with AI                │
 * │ • Language support: Multilingual via OpenAI                 │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │ KEY FUNCTIONS                                                │
 * ├─────────────────────────────────────────────────────────────┤
 * │ • whatsappClient.sendImage()        - Send photo to user    │
 * │ • detectPhotoRequest()              - Detect if photo asked │
 * │ • generateText()                    - Generate captions     │
 * │ • detectLanguageWithMastra()        - Detect user language  │
 * │ • processUserMessage()              - Process message       │
 * │ • processIncomingMessage()          - Main webhook handler  │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │ AVAILABLE PHOTOS                                             │
 * ├─────────────────────────────────────────────────────────────┤
 * │ • burger       - Signature charolais beef burger            │
 * │ • steak        - Steak with homemade beef fat fries         │
 * │ • restaurant   - Restaurant ambiance and interior           │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │ ENVIRONMENT VARIABLES NEEDED                                 │
 * ├─────────────────────────────────────────────────────────────┤
 * │ • BASE_URL - Photo serving base URL                         │
 * │ • WHATSAPP_ACCESS_TOKEN - Meta API token                    │
 * │ • WHATSAPP_PHONE_NUMBER_ID - Phone ID for sending           │
 * │ • OPENAI_API_KEY - OpenAI API key for AI                    │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │ TYPICAL FLOW                                                 │
 * ├─────────────────────────────────────────────────────────────┤
 * │ 1. User: "Show me your burgers"                             │
 * │ 2. Webhook receives message                                 │
 * │ 3. AI detects photo request: { burger: true }              │
 * │ 4. Generate caption in user's language                      │
 * │ 5. Send burger photo + caption via WhatsApp API             │
 * │ 6. Send text response describing the burger                 │
 * │ 7. User sees: Photo → Caption → Description                │
 * └─────────────────────────────────────────────────────────────┘
 */

// NOTE: This file is documentation only and cannot be executed as TypeScript code.
// It serves as a comprehensive guide for developers working with the photo sending system.
// To understand the actual implementation, refer to the source files listed above.
