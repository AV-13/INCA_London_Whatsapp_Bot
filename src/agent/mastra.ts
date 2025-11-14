/**
 * Mastra Agent Configuration - Simplified Version
 * Configures the AI agent with OpenAI and Inca London instructions
 */

import { Agent, Mastra } from '@mastra/core';
import { openai } from '@ai-sdk/openai';

/**
 * Simplified system instructions focused on core functionality
 * Avoid overly complex rules that might cause timeouts
 */
const SYSTEM_INSTRUCTIONS = `
# Inca London Virtual Host - WhatsApp

You are the virtual host of Inca London, a luxury dinner show restaurant in Soho, London.

Location: 8-9 Argyll Street, Soho, London W1F 7TF
Phone: +44 (0)20 7734 6066
Reservations: https://www.sevenrooms.com/reservations/incalondon

## Your Role
Help guests discover Inca London and answer questions about:
- Menu, cuisine, dishes, drinks
- Hours, reservations, private events
- Location, directions, access
- Ambiance, show, entertainment
- Local area (Soho, attractions nearby)

## Style
- Always respond in the guest's language
- Be elegant, warm, and professional
- Keep responses short (1-3 sentences max)
- Give practical, useful information
- Show enthusiasm for the Inca London experience

## Key Information

### Hours
- Wednesday-Sunday: Open
- Friday-Saturday: 7 PM - Late
- Wednesday, Thursday, Sunday: 8 PM - Late
- Closed: Monday, Tuesday
- Show starts: ~8:30-9:00 PM

### Cuisine
- Latin American fusion with Nikkei influences
- Chef: Davide Alberti
- Signature dishes: Wagyu Tacos, Seabass Ceviche, Tea-Smoked Lamb Chops
- Vegetarian & gluten-free options available

### Experience
- Immersive dinner show with live entertainment
- Dancers, singers, world-class performers
- Luna Club: late-night club atmosphere
- Photography allowed (no flash)

### Important
- No reservations directly - guide to booking link
- No payment processing
- Always provide the reservation link
- If uncertain about details, suggest calling or visiting website

## When Asked About Photos
If the guest asks to see photos of the restaurant, show, lounge, or table setting, respond naturally and then the system will send photos in their language.

Examples of photo requests:
- "Show me photos"
- "What does it look like?"
- "Can I see the lounge?"
- "How is the dining room decorated?"
- "What's the show like?"

Respond warmly and the photos will be sent automatically.
`;

/**
 * Create and configure the Mastra framework instance
 */
export function createMastraInstance(): Mastra {
  // Verify OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required in .env file');
  }

  // Create OpenAI model instance with API key set in environment
  const model = openai('gpt-4o-mini');

  // Create Mastra instance with agent
  const mastra = new Mastra({
    agents: {
      incaLondonAgent: new Agent({
        name: 'incaLondonAgent',
        instructions: SYSTEM_INSTRUCTIONS,
        model,
      }) as any,
    },
  });

  return mastra;
}

/**
 * Get the Inca London agent instance
 */
export function getIncaAgent(mastra: Mastra): any {
  return mastra.getAgent('incaLondonAgent');
}

export interface ProcessedMessageResult {
  text: string;
  detectedLanguage: string;
  menusToSend?: Array<{
    type: string;
    name: string;
    url: string;
  }>;
  sendPhotos?: IncaPhotoSelection;
  showMenuButtons?: boolean;
  sendAllMenus?: boolean;
}

export type IncaPhotoSelection = {
  luna_lounge?: boolean;
  main_room?: boolean;
  show?: boolean;
  table?: boolean;
};

/**
 * Detect the language of a user message
 */
export async function detectLanguageWithMastra(
  mastra: Mastra,
  message: string
): Promise<string> {
  try {
    // Clean message (remove dates/times which are language-agnostic)
    let cleanedMessage = message
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
      .replace(/\b\d{1,2}:\d{2}\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanedMessage.length < 3) {
      return 'en';
    }

    const agent = getIncaAgent(mastra);

    const prompt = `Detect the language of this message. Respond with ONLY the ISO 639-1 language code (2 letters: en, fr, es, de, it, pt, zh, ja, ar, etc.).

Message: "${cleanedMessage}"

Language code:`;

    const result = await agent.generate(prompt);
    const languageCode = (result.text || 'en').trim().toLowerCase().substring(0, 2);

    console.log(`🌍 Detected language: ${languageCode}`);
    return languageCode;
  } catch (error: any) {
    console.error('❌ Error detecting language:', error);
    return 'en';
  }
}

/**
 * Translate a message to English
 */
export async function translateToEnglish(
  mastra: Mastra,
  message: string,
  sourceLanguage: string
): Promise<string> {
  if (sourceLanguage === 'en') {
    return message;
  }

  try {
    const agent = getIncaAgent(mastra);

    const prompt = `Translate this message to English. Respond with ONLY the translation.

Message: "${message}"

Translation:`;

    const result = await agent.generate(prompt);
    return (result.text || message).trim();
  } catch (error: any) {
    console.error('❌ Error translating message:', error);
    return message;
  }
}

/**
 * Detect if user is asking for photos based on keywords
 */
export function detectPhotoRequestByKeywords(message: string): IncaPhotoSelection | undefined {
  const lowerMessage = message.toLowerCase();

  // Keywords for each photo category
  const lunaKeywords = ['lounge', 'luna', 'bar', 'cocktails', 'drinks area', 'lounge area'];
  const mainRoomKeywords = ['restaurant', 'dining room', 'dining', 'main room', 'interior', 'ambiance', 'décor'];
  const showKeywords = ['show', 'spectacle', 'performance', 'dancers', 'entertainment', 'stage', 'live'];
  const tableKeywords = ['table', 'seating', 'setting', 'seats'];

  // General photo keywords
  const generalPhotoKeywords = ['photo', 'picture', 'image', 'see', 'look', 'view', 'show me'];

  // Check if it's a photo request at all
  const isPhotoRequest = generalPhotoKeywords.some(keyword => lowerMessage.includes(keyword));

  if (!isPhotoRequest) {
    return undefined;
  }

  // Determine which photos to send
  const selection: IncaPhotoSelection = {};

  if (
    lunaKeywords.some(keyword => lowerMessage.includes(keyword)) ||
    (isPhotoRequest && (lowerMessage.includes('lounge') || lowerMessage.includes('bar')))
  ) {
    selection.luna_lounge = true;
  }

  if (
    mainRoomKeywords.some(keyword => lowerMessage.includes(keyword)) ||
    (isPhotoRequest && (lowerMessage.includes('restaurant') || lowerMessage.includes('dining') || lowerMessage.includes('interior')))
  ) {
    selection.main_room = true;
  }

  if (
    showKeywords.some(keyword => lowerMessage.includes(keyword)) ||
    (isPhotoRequest && (lowerMessage.includes('show') || lowerMessage.includes('performance') || lowerMessage.includes('entertainment')))
  ) {
    selection.show = true;
  }

  if (tableKeywords.some(keyword => lowerMessage.includes(keyword))) {
    selection.table = true;
  }

  // If user says "everything", "all", or just "photos" without specifics, send main room + show
  if ((isPhotoRequest && Object.keys(selection).length === 0) || lowerMessage.includes('all')) {
    return {
      luna_lounge: true,
      main_room: true,
      show: true,
      table: lowerMessage.includes('table')
    };
  }

  // If we detected something, return it
  if (Object.values(selection).some(v => v)) {
    return selection;
  }

  return undefined;
}

/**
 * Remove markdown formatting from text
 */
function removeMarkdownFormatting(text: string): string {
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  text = text.replace(/__(.+?)__/g, '$1');
  text = text.replace(/\*(.+?)\*/g, '$1');
  text = text.replace(/_(.+?)_/g, '$1');
  text = text.replace(/~~(.+?)~~/g, '$1');
  return text;
}

/**
 * Process a user message through the Mastra agent
 */
export async function processUserMessage(
  mastra: Mastra,
  userMessage: string,
  userId: string,
  conversationHistory?: string,
  isNewUser: boolean = false,
  isNewSessionAfterBreak: boolean = false
): Promise<ProcessedMessageResult> {
  try {
    const agent = getIncaAgent(mastra);

    console.log(`🤖 Processing message from user ${userId}: "${userMessage}"`);

    // Step 1: Detect language
    const detectedLanguage = await detectLanguageWithMastra(mastra, userMessage);

    // Step 2: Translate to English for processing
    const englishMessage = await translateToEnglish(mastra, userMessage, detectedLanguage);

    // Step 3: Detect if asking for photos
    const photoSelection = detectPhotoRequestByKeywords(englishMessage);

    // Step 4: Build context
    let contextPrompt = englishMessage;

    if (conversationHistory && !isNewSessionAfterBreak) {
      contextPrompt = `${conversationHistory}\n\nUser (current message): ${englishMessage}`;
    }

    if (isNewUser) {
      contextPrompt = `[NEW USER]\n\n${contextPrompt}`;
    }

    // Step 5: Tell agent what language to respond in
    contextPrompt = `Respond in language code: ${detectedLanguage}\n\n${contextPrompt}`;

    // Step 6: Call agent
    console.log(`📝 Calling agent with context length: ${contextPrompt.length}`);
    const result = await agent.generate(contextPrompt, {
      resourceId: userId,
    });

    // Step 7: Extract response
    let responseText = result.text || 'I apologize, but I encountered an issue. Please try again or contact us at +44 (0)20 7734 6066.';

    console.log(`✅ Agent response: ${responseText.substring(0, 100)}...`);

    // Remove markdown
    responseText = removeMarkdownFormatting(responseText);

    // Return response with photo selection if detected
    return {
      text: responseText,
      detectedLanguage,
      sendPhotos: photoSelection || undefined
    };
  } catch (error: any) {
    console.error('❌ Error processing message:', error);
    return {
      text: "I apologize, but I'm experiencing a technical issue. Please contact us:\n\n📞 +44 (0)20 7734 6066",
      detectedLanguage: 'en'
    };
  }
}
