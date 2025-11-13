/**
 * WhatsApp Webhook Handler for Meta Business API
 * Handles incoming messages and webhook verification
 *
 * SIMPLIFIED VERSION - Menus only, no reservation flow
 */

import { Request, Response } from 'express';
import { WhatsAppClient } from './client.js';
import { Mastra } from '@mastra/core';
import { processUserMessage, detectLanguageWithMastra } from '../agent/mastra.js';
import { sessionManager } from '../sessionManager.js';
import { getDatabase } from '../database/supabase.js';
import {
  generateText,
  generateMenuMessage,
  generatePrompt,
  generateErrorMessage,
  generateListLabels
} from '../i18n/dynamicTranslation.js';
import { processAudioMessage } from '../audio/whisper.js';
import { generateLocationResponse, INCA_LONDON_LOCATION, type LocationData } from '../location/maps.js';

/**
 * Set to track processed message IDs (prevents duplicates)
 * Messages are kept for 5 minutes to handle Meta's webhook retries
 */
const processedMessages = new Set<string>();
const MESSAGE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Base publique pour les assets (peut être surchargée par la variable d'environnement BASE_URL)
const PHOTO_BASE_URL =
    (process.env.BASE_URL ? process.env.BASE_URL.replace(/\/+$/, '') : 'https://inca-london-wa-bot-av-dvhtghakgxaaetds.francecentral-01.azurewebsites.net');

// Chemin racine des photos statiques
const PHOTO_ASSET_PATH = '/assets/photos';

// Mapping des photos disponibles
export const PHOTO_URLS = {
    luna_lounge: `${PHOTO_BASE_URL}${PHOTO_ASSET_PATH}/inca_luna_lounge.jpg`,
    main_room: `${PHOTO_BASE_URL}${PHOTO_ASSET_PATH}/inca_main_room.jpg`,
    show: `${PHOTO_BASE_URL}${PHOTO_ASSET_PATH}/inca_show.jpg`,
    show_two: `${PHOTO_BASE_URL}${PHOTO_ASSET_PATH}/inca_show_two.jpg`,
    table: `${PHOTO_BASE_URL}${PHOTO_ASSET_PATH}/inca_table.jpg`,
    table_two: `${PHOTO_BASE_URL}${PHOTO_ASSET_PATH}/inca_table_two.jpg`,
} as const;

// (Optionnel) Type utilitaire si besoin ailleurs
export type PhotoKey = keyof typeof PHOTO_URLS;


/**
 * Detect user's language from conversation history
 * Uses the most recent text messages to detect language, ignoring button IDs
 */
async function detectUserLanguage(
  userId: string,
  userMessage: string,
  mastra: Mastra,
  conversationHistory?: string
): Promise<string> {
  try {
    // Don't detect language from button IDs (they're in English by design)
    const isButtonClick = userMessage.startsWith('menu_') || userMessage.startsWith('action_');

    if (isButtonClick) {
      // Try to extract language from conversation history
      if (conversationHistory) {
        const historyLines = conversationHistory.split('\n');
        for (let i = historyLines.length - 1; i >= 0; i--) {
          const line = historyLines[i];
          if (line.startsWith('User: ')) {
            const lastUserMessage = line.substring(6).trim();
            if (!lastUserMessage.startsWith('menu_') &&
                !lastUserMessage.startsWith('action_') &&
                lastUserMessage.length > 5) {
              console.log(`🌍 Detecting language from history: "${lastUserMessage}"`);
              const detectedLanguage = await detectLanguageWithMastra(mastra, lastUserMessage);
              return detectedLanguage;
            }
          }
        }
      }
      console.log('🌍 Button click detected, no valid history - defaulting to English');
      return 'en';
    }

    const detectedLanguage = await detectLanguageWithMastra(mastra, userMessage);
    return detectedLanguage;
  } catch (error: any) {
    console.error('❌ Error detecting language:', error);
    return 'en';
  }
}

/**
 * WhatsApp webhook message structure from Meta
 */
interface WhatsAppWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: {
    body: string;
  };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
  };
  audio?: {
    id: string;
    mime_type: string;
  };
  voice?: {
    id: string;
    mime_type: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  type: string;
}

interface WhatsAppWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: Array<{
        profile: {
          name: string;
        };
        wa_id: string;
      }>;
      messages?: WhatsAppWebhookMessage[];
      statuses?: Array<any>;
    };
    field: string;
  }>;
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppWebhookEntry[];
}

/**
 * Verify webhook endpoint (GET request from Meta)
 */
export function verifyWebhook(req: Request, res: Response): void {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.error('❌ Webhook verification failed');
    res.status(403).send('Forbidden');
  }
}

/**
 * Handle incoming webhook events (POST request from Meta)
 */
export async function handleWebhook(
  req: Request,
  res: Response,
  whatsappClient: WhatsAppClient,
  mastra: Mastra
): Promise<void> {
  try {
    const body = req.body as WhatsAppWebhookPayload;

    if (body.object !== 'whatsapp_business_account') {
      console.warn('⚠️ Received non-WhatsApp webhook');
      res.sendStatus(404);
      return;
    }

    res.sendStatus(200);

    for (const entry of body.entry) {
      for (const change of entry.changes) {
        const value = change.value;

        if (value.messages && value.messages.length > 0) {
          for (const message of value.messages) {
            await processIncomingMessage(message, whatsappClient, mastra);
          }
        }

        if (value.statuses && value.statuses.length > 0) {
          for (const status of value.statuses) {
            console.log(`📊 Message status update: ${status.status} for message ${status.id}`);
          }
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Error handling webhook:', error);
  }
}

/**
 * Menu configurations
 */
const MENU_CONFIGS = {
  'menu_alacarte': {
    type: 'alacarte',
    name: 'Menu à la Carte',
    url: 'https://www.incalondon.com/_files/ugd/325c3c_bdde0eb515e54beeba08ce662f63b801.pdf'
  },
  'menu_wagyu': {
    type: 'wagyu',
    name: 'Wagyu Platter Menu',
    url: 'https://www.incalondon.com/_files/ugd/325c3c_bb9f24cd9a61499bbde31da9841bfb2e.pdf'
  },
  'menu_wine': {
    type: 'wine',
    name: 'Wine Menu',
    url: 'https://www.incalondon.com/_files/ugd/325c3c_20753e61bce346538f8868a1485acfd9.pdf'
  },
  'menu_drinks': {
    type: 'drinks',
    name: 'Drinks Menu',
    url: 'https://www.incalondon.com/_files/ugd/325c3c_eddf185fa8384622b45ff682b4d14f76.pdf'
  },
  'menu_canapes': {
    type: 'canapes',
    name: 'Canapés & Bowl Food Menu',
    url: 'https://www.incalondon.com/_files/ugd/325c3c_6ce57e56119d41d7bc2b351da5074358.pdf'
  },
  'menu_setmenus': {
    type: 'setmenus',
    name: 'Set Menus',
    url: 'https://www.incalondon.com/_files/ugd/325c3c_165d451e53b844149364ee5e8e6ddb4b.pdf'
  },
  'menu_all': {
    type: 'all',
    name: 'All Menus',
    url: ''
  }
};

/**
 * Send menu selection list
 */
async function sendMenuButtons(
  userId: string,
  whatsappClient: WhatsAppClient,
  language: string,
  mastra: Mastra
): Promise<void> {
  const bodyText = await generatePrompt(mastra, 'choose_menu_prompt', language);
  const buttonText = await generatePrompt(mastra, 'choose_menu_button', language);

  // Translate menu titles (short version)
  const menuLabels = await generateListLabels(
    mastra,
    [
      { id: 'menu_alacarte', englishLabel: 'À la Carte' },
      { id: 'menu_wagyu', englishLabel: 'Wagyu Platter' },
      { id: 'menu_wine', englishLabel: 'Wine' },
      { id: 'menu_drinks', englishLabel: 'Drinks' },
      { id: 'menu_canapes', englishLabel: 'Canapés & Bowl Food' },
      { id: 'menu_setmenus', englishLabel: 'Set Menus' }
    ],
    language
  );

  // Translate menu descriptions ONLY for Canapés and Set Menus (those that need explanation)
  const menuDescriptions = await generateListLabels(
    mastra,
    [
      { id: 'menu_canapes', englishLabel: 'For standing events' },
      { id: 'menu_setmenus', englishLabel: '9+ guests: Warrior, Totem, Empire, Lily' }
    ],
    language
  );

  // Create a map for easy lookup
  const descriptionsMap: Record<string, string> = {
    'menu_canapes': menuDescriptions[0].label,
    'menu_setmenus': menuDescriptions[1].label
  };

  const menusTitle = await generateText(mastra, 'The word "Menus" (1 word)', language);

  await whatsappClient.sendInteractiveList(
    userId,
    bodyText,
    buttonText,
    [{
      title: menusTitle,
      rows: menuLabels.map((item) => ({
        id: item.id,
        title: item.label,
        // Only add description for Canapés and Set Menus
        ...(descriptionsMap[item.id] && { description: descriptionsMap[item.id] })
      }))
    }]
  );

  console.log(`✅ Sent menu selection list to ${userId} in language: ${language}`);
}

/**
 * Handle menu button clicks
 */
async function handleMenuButtonClick(
  userId: string,
  buttonId: string,
  whatsappClient: WhatsAppClient,
  language: string,
  mastra: Mastra
): Promise<void> {
  const menuConfig = MENU_CONFIGS[buttonId as keyof typeof MENU_CONFIGS];

  if (!menuConfig) {
    console.error(`Unknown menu button ID: ${buttonId}`);
    return;
  }

  if (menuConfig.type === 'all') {
    console.log(`📋 Sending all menus to ${userId} in language: ${language}`);

    for (const [key, config] of Object.entries(MENU_CONFIGS)) {
      if (config.type !== 'all') {
        try {
          const menuMessage = await generateMenuMessage(mastra, config.type, language);
          await whatsappClient.sendDocument(
            userId,
            config.url,
            `${config.name}.pdf`,
            menuMessage
          );
          console.log(`✅ Sent ${config.name} PDF to ${userId}`);
        } catch (error) {
          console.error(`❌ Failed to send ${config.name} PDF:`, error);
        }
      }
    }
  } else {
    const menuMessage = await generateMenuMessage(mastra, menuConfig.type, language);
    await whatsappClient.sendDocument(
      userId,
      menuConfig.url,
      `${menuConfig.name}.pdf`,
      menuMessage
    );
    console.log(`✅ Sent ${menuConfig.name} PDF to ${userId} in language: ${language}`);
  }
}

/**
 * Process incoming WhatsApp message
 */
async function processIncomingMessage(
  message: WhatsAppWebhookMessage,
  whatsappClient: WhatsAppClient,
  mastra: Mastra
): Promise<void> {
  const database = getDatabase();

  try {
    const userId = message.from;
    const messageId = message.id;
    let userMessage = '';
    let isButtonClick = false;

    // Handle interactive button/list responses
    if (message.type === 'interactive' && message.interactive) {
      const buttonReply = message.interactive.button_reply;
      const listReply = message.interactive.list_reply;

      if (buttonReply) {
        userMessage = buttonReply.id;
        isButtonClick = true;
        console.log(`🔘 Button clicked: ${buttonReply.id} (${buttonReply.title})`);
      } else if (listReply) {
        userMessage = listReply.id;
        isButtonClick = true;
        console.log(`📋 List item selected: ${listReply.id} (${listReply.title})`);
      }
    }
    // Handle text messages
    else if (message.type === 'text' && message.text?.body) {
      userMessage = message.text.body.trim();
    }
    // Handle audio messages
    else if ((message.type === 'audio' || message.type === 'voice') && (message.audio?.id || message.voice?.id)) {
      const mediaId = message.audio?.id || message.voice?.id;
      if (!mediaId) {
        console.error('❌ Audio message received but no media ID found');
        return;
      }

      console.log(`🎤 Audio/Voice message received, transcribing...`);

      try {
        const accessToken = process.env.META_WHATSAPP_TOKEN;
        if (!accessToken) {
          throw new Error('META_WHATSAPP_TOKEN not configured');
        }

        // Transcribe audio without language hint - let Whisper auto-detect the language
        // This ensures accurate transcription in the original language (French, English, etc.)
        const transcription = await processAudioMessage(mediaId, accessToken);
        userMessage = transcription;

        console.log(`✅ Transcription: "${transcription}"`);

        // IMPORTANT: Audio message will continue to be processed as a normal text message
        // It will go through the same flow as text messages (detection, agent processing, etc.)
      } catch (error: any) {
        console.error('❌ Error transcribing audio:', error);
        const errorLang = await detectUserLanguage(userId, '', mastra);
        const errorMsg = await generateText(
          mastra,
          'Apologize that you could not process the audio message',
          errorLang
        );
        await whatsappClient.sendTextMessage(userId, errorMsg);
        return;
      }
    }
    // Handle location messages
    else if (message.type === 'location' && message.location) {
      console.log(`📍 Location received: ${message.location.latitude}, ${message.location.longitude}`);

      try {
        const tempConversation = await database.getOrCreateConversation(userId);
        const tempMessages = await database.getConversationHistory(tempConversation.id, 5);
        const tempHistory = database.formatHistoryForMastra(tempMessages);
        const userLanguage = await detectUserLanguage(userId, '', mastra, tempHistory);

        const locationData: LocationData = {
          latitude: message.location.latitude,
          longitude: message.location.longitude,
          name: message.location.name,
          address: message.location.address
        };

        const locationResponse = await generateLocationResponse(mastra, locationData, userLanguage);

        await whatsappClient.sendTextMessage(userId, locationResponse);

        await whatsappClient.sendLocationMessage(
          userId,
          INCA_LONDON_LOCATION.latitude,
          INCA_LONDON_LOCATION.longitude,
          INCA_LONDON_LOCATION.name,
          INCA_LONDON_LOCATION.address
        );

        console.log(`✅ Sent location response and restaurant location to ${userId}`);
        return;
      } catch (error: any) {
        console.error('❌ Error processing location:', error);
        const errorLang = await detectUserLanguage(userId, '', mastra);
        const errorMsg = await generateText(
          mastra,
          'Apologize that you could not process the location',
          errorLang
        );
        await whatsappClient.sendTextMessage(userId, errorMsg);
        return;
      }
    }
    else {
      console.log(`⚠️ Ignoring message of type: ${message.type}`);
      return;
    }

    // Check for duplicates
    if (processedMessages.has(messageId)) {
      console.log(`⏭️ Skipping duplicate message: ${messageId}`);
      return;
    }

    processedMessages.add(messageId);

    setTimeout(() => {
      processedMessages.delete(messageId);
    }, MESSAGE_CACHE_DURATION);

    console.log(`\n📨 Incoming message from ${userId}:`);
    console.log(`   Message ID: ${messageId}`);
    console.log(`   Content: "${userMessage}"`);

    // Mark as read with typing indicator enabled
    await whatsappClient.markAsRead(messageId, true);

    // Database integration
    const conversation = await database.getOrCreateConversation(userId);
    const isNewUser = await database.isNewUser(userId);

    await database.saveMessage({
      conversation_id: conversation.id,
      wa_message_id: messageId,
      direction: 'in',
      sender: 'user',
      message_type: message.type,
      text_content: userMessage
    });

    // Récupérer l'historique et filtrer les messages trop anciens
    const messages = await database.getConversationHistory(conversation.id, 10);

    // Filtrer les messages de plus de 2 heures pour éviter les rebonds sur d'anciennes conversations
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const now = Date.now();
    const recentMessages = messages.filter(msg => {
      const messageTime = new Date(msg.created_at).getTime();
      const timeDiff = now - messageTime;
      return timeDiff < TWO_HOURS_MS;
    });

    // Détecter si c'est une reprise après une longue pause
    const isNewSessionAfterBreak = messages.length > 0 && recentMessages.length === 0;

    if (isNewSessionAfterBreak) {
      console.log(`🔄 New session detected after break for user ${userId} - ignoring old history`);
    }

    const conversationHistory = database.formatHistoryForMastra(recentMessages);

    const detectedLanguage = await detectUserLanguage(userId, userMessage, mastra, conversationHistory);

    // Handle "View Menus" button
    if (userMessage === 'action_view_menus') {
      await sendMenuButtons(userId, whatsappClient, detectedLanguage, mastra);
      console.log(`✅ Processing complete for ${userId}`);
      return;
    }

    // Handle menu requests
    if (userMessage.startsWith('menu_')) {
      await handleMenuButtonClick(userId, userMessage, whatsappClient, detectedLanguage, mastra);
      console.log(`✅ Processing complete for ${userId}`);
      return;
    }

    // Process through Mastra
    const agentResponse = await processUserMessage(
      mastra,
      userMessage,
      userId,
      conversationHistory,
      isNewUser,
      isNewSessionAfterBreak
    );

    const userLanguage = agentResponse.detectedLanguage || 'en';

    // Handle agent responses
    if (agentResponse.sendAllMenus) {
      console.log(`📋 Sending all menus to ${userId}`);
      await handleMenuButtonClick(userId, 'menu_all', whatsappClient, userLanguage, mastra);
      console.log(`✅ Processing complete for ${userId}`);
      return;
    }


    if (agentResponse.showMenuButtons) {
      console.log(`📋 Showing menu selection list to ${userId}`);
      await sendMenuButtons(userId, whatsappClient, userLanguage, mastra);
      console.log(`✅ Processing complete for ${userId}`);
      return;
    }

    if (agentResponse.menusToSend && agentResponse.menusToSend.length > 0) {
      console.log(`📋 Sending ${agentResponse.menusToSend.length} menu PDF(s) in language: ${userLanguage}`);

      for (const menu of agentResponse.menusToSend) {
        try {
          const menuMessage = await generateMenuMessage(mastra, menu.type, userLanguage);

          await whatsappClient.sendDocument(
            userId,
            menu.url,
            `${menu.name}.pdf`,
            menuMessage
          );
          console.log(`✅ Sent ${menu.name} PDF to ${userId} with message: "${menuMessage}"`);
        } catch (error) {
          console.error(`❌ Failed to send ${menu.name} PDF:`, error);
        }
      }
    }

    // Send text response
    if (agentResponse.text && agentResponse.text.trim().length > 0) {
      await whatsappClient.sendTextMessage(userId, agentResponse.text);

      await database.saveMessage({
        conversation_id: conversation.id,
        direction: 'out',
        sender: 'bot',
        message_type: 'text',
        text_content: agentResponse.text
      });

      console.log(`✅ Text response sent to ${userId}`);

      // Check if response mentions address
      const addressKeywords = ['address', 'adresse', 'argyll street', 'oxford circus', 'soho', 'w1f 7tf', 'where are you', 'où êtes-vous', '8-9 argyll'];
      const responseText = agentResponse.text.toLowerCase();
      const mentionsAddress = addressKeywords.some(keyword => responseText.includes(keyword.toLowerCase()));

      if (mentionsAddress) {
        console.log(`📍 Response mentions address, sending location pin to ${userId}`);
        await whatsappClient.sendLocationMessage(
          userId,
          INCA_LONDON_LOCATION.latitude,
          INCA_LONDON_LOCATION.longitude,
          INCA_LONDON_LOCATION.name,
          INCA_LONDON_LOCATION.address
        );
        console.log(`✅ Location pin sent to ${userId}`);
      }
    }
      // Send photos if user explicitly requested them
      if (agentResponse.sendPhotos) {
          console.log(`📸 User requested photos, determining which photos to send...`);
          const photosToSend = agentResponse.sendPhotos;

          try {
              // Generate captions in user's language
              const lunaCaption = await generateText(
                  mastra,
                  'Photo caption for Luna Lounge area (max 10 words)',
                  userLanguage,
                  'Short photo caption for lounge'
              );

              const mainRoomCaption = await generateText(
                  mastra,
                  'Photo caption for main dining room (max 10 words)',
                  userLanguage,
                  'Short photo caption for main room'
              );

              const showCaption = await generateText(
                  mastra,
                  'Photo caption for show/performance area (max 10 words)',
                  userLanguage,
                  'Short photo caption for show area'
              );

              const tableCaption = await generateText(
                  mastra,
                  'Photo caption for elegant table setting (max 10 words)',
                  userLanguage,
                  'Short photo caption for table'
              );

              // Send photos based on request
              if (photosToSend.luna_lounge) {
                  await whatsappClient.sendImage(userId, PHOTO_URLS.luna_lounge, `${lunaCaption} 🌙`);
                  console.log(`✅ Luna Lounge photo sent to ${userId}`);
              }

              if (photosToSend.main_room) {
                  await whatsappClient.sendImage(userId, PHOTO_URLS.main_room, `${mainRoomCaption} 🍽️`);
                  console.log(`✅ Main room photo sent to ${userId}`);
              }

              if (photosToSend.show) {
                  await whatsappClient.sendImage(userId, PHOTO_URLS.show, `${showCaption} 🎭`);
                  console.log(`✅ Show photo sent to ${userId}`);
              }

              if (photosToSend.table) {
                  await whatsappClient.sendImage(userId, PHOTO_URLS.table, `${tableCaption} ✨`);
                  console.log(`✅ Table photo sent to ${userId}`);
              }

              console.log(`📸 Photo sending complete for ${userId}`);
          } catch (photoError: any) {
              console.error('❌ Error sending photos:', photoError);
          }
      }

    console.log(`✅ Processing complete for ${userId}`);
  } catch (error: any) {
    console.error('❌ Error processing incoming message:', error);

    try {
      let errorLanguage = 'en';
      try {
        if (message.text?.body) {
          errorLanguage = await detectUserLanguage(message.from, message.text.body, mastra);
        }
      } catch (langError) {
        console.error('Failed to detect language for error message:', langError);
      }

      const errorMessage = await generateErrorMessage(mastra, errorLanguage, 'technical');
      await whatsappClient.sendTextMessage(message.from, errorMessage);
    } catch (sendError) {
      console.error('❌ Failed to send error message to user:', sendError);
      try {
        await whatsappClient.sendTextMessage(
          message.from,
          "I apologize, but I'm experiencing a technical issue. Please try again in a moment, or contact us directly:\n\n📞 +44 (0)20 7734 6066\n📧 reservations@incalondon.com"
        );
      } catch (finalError) {
        console.error('❌ Failed to send fallback error message:', finalError);
      }
    }
  }
}

/**
 * Validate webhook signature
 */
export function validateWebhookSignature(req: Request): boolean {
  const signature = req.headers['x-hub-signature-256'] as string;

  if (!signature) {
    console.warn('⚠️ No signature provided in webhook request');
    return true;
  }

  return true;
}
