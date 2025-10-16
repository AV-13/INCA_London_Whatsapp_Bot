/**
 * WhatsApp Webhook Handler for Meta Business API
 * Handles incoming messages and webhook verification
 */

import { Request, Response } from 'express';
import { WhatsAppClient } from './client.js';
import { Mastra } from '@mastra/core';
import { processUserMessage } from '../agent/mastra.js';
import { sessionManager } from '../sessionManager.js';
import { getDatabase } from '../database/supabase.js';

/**
 * Set to track processed message IDs (prevents duplicates)
 * Messages are kept for 5 minutes to handle Meta's webhook retries
 */
const processedMessages = new Set<string>();
const MESSAGE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Translation dictionary for UI messages
 * Used for buttons, prompts, and system messages
 */

// TODO Laisser mastra faire, ne rien garder ici
const TRANSLATIONS: Record<string, Record<string, string>> = {
  viewMenusPrompt: {
    en: 'Would you like to view our menus?',
    fr: 'Souhaitez-vous consulter nos menus ?',
    es: '¿Le gustaría ver nuestros menús?',
    de: 'Möchten Sie unsere Menüs ansehen?',
    it: 'Vuoi vedere i nostri menu?',
    pt: 'Gostaria de ver nossos cardápios?',
  },
  viewMenusButton: {
    en: 'View Menus',
    fr: 'Voir les Menus',
    es: 'Ver Menús',
    de: 'Menüs ansehen',
    it: 'Visualizza Menu',
    pt: 'Ver Cardápios',
  },
  chooseMenuPrompt: {
    en: 'We offer 4 different menus. Which one would you like to view?',
    fr: 'Nous proposons 4 menus différents. Lequel souhaitez-vous consulter ?',
    es: 'Ofrecemos 4 menús diferentes. ¿Cuál te gustaría ver?',
    de: 'Wir bieten 4 verschiedene Menüs an. Welches möchten Sie sehen?',
    it: 'Offriamo 4 menu diversi. Quale vorresti vedere?',
    pt: 'Oferecemos 4 cardápios diferentes. Qual você gostaria de ver?',
  },
  chooseMenuButton: {
    en: 'Choose a menu',
    fr: 'Choisir un menu',
    es: 'Elegir un menú',
    de: 'Menü wählen',
    it: 'Scegli un menu',
    pt: 'Escolher um cardápio',
  },
  menuAlacarte: {
    en: 'À la Carte',
    fr: 'À la Carte',
    es: 'A la Carta',
    de: 'À la Carte',
    it: 'Alla Carta',
    pt: 'À la Carte',
  },
  menuWagyu: {
    en: 'Wagyu',
    fr: 'Wagyu',
    es: 'Wagyu',
    de: 'Wagyu',
    it: 'Wagyu',
    pt: 'Wagyu',
  },
  menuWine: {
    en: 'Wine',
    fr: 'Vins',
    es: 'Vinos',
    de: 'Weine',
    it: 'Vini',
    pt: 'Vinhos',
  },
  menuDrinks: {
    en: 'Drinks',
    fr: 'Boissons',
    es: 'Bebidas',
    de: 'Getränke',
    it: 'Bevande',
    pt: 'Bebidas',
  },
  menuMessageAlacarte: {
    en: 'Here is the à la carte menu',
    fr: 'Voici le menu à la carte',
    es: 'Aquí está el menú a la carta',
    de: 'Hier ist das À-la-carte-Menü',
    it: 'Ecco il menu alla carta',
    pt: 'Aqui está o cardápio à la carte',
  },
  menuMessageWagyu: {
    en: 'Here is the Wagyu menu',
    fr: 'Voici le menu Wagyu',
    es: 'Aquí está el menú Wagyu',
    de: 'Hier ist das Wagyu-Menü',
    it: 'Ecco il menu Wagyu',
    pt: 'Aqui está o cardápio Wagyu',
  },
  menuMessageWine: {
    en: 'Here is the wine menu',
    fr: 'Voici la carte des vins',
    es: 'Aquí está la carta de vinos',
    de: 'Hier ist die Weinkarte',
    it: 'Ecco la carta dei vini',
    pt: 'Aqui está a carta de vinhos',
  },
  menuMessageDrinks: {
    en: 'Here is the drinks menu',
    fr: 'Voici le menu boissons',
    es: 'Aquí está el menú de bebidas',
    de: 'Hier ist die Getränkekarte',
    it: 'Ecco il menu delle bevande',
    pt: 'Aqui está o cardápio de bebidas',
  },
};

/**
 * Get a translated string for a given key and language
 * Falls back to English if translation not available
 *
 * @param key - Translation key
 * @param language - Language code (ISO 639-1)
 * @returns Translated string
 */
function translate(key: string, language: string): string {
  const translations = TRANSLATIONS[key];
  if (!translations) {
    console.warn(`⚠️ Translation key not found: ${key}`);
    return key;
  }

  return translations[language] || translations['en'] || key;
}

/**
 * Get translated menu message based on menu type
 *
 * @param menuType - Menu type identifier
 * @param language - Language code
 * @returns Translated menu message
 */
function getMenuMessage(menuType: string, language: string): string {
  const keyMap: Record<string, string> = {
    'alacarte': 'menuMessageAlacarte',
    'wagyu': 'menuMessageWagyu',
    'wine': 'menuMessageWine',
    'drinks': 'menuMessageDrinks'
  };

  const key = keyMap[menuType];
  return key ? translate(key, language) : '';
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
 * This is called by Meta when you first configure the webhook
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

    // Validate webhook payload
    if (body.object !== 'whatsapp_business_account') {
      console.warn('⚠️ Received non-WhatsApp webhook');
      res.sendStatus(404);
      return;
    }

    // Respond immediately to Meta (required)
    res.sendStatus(200);

    // Process each entry in the webhook
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        const value = change.value;

        // Handle incoming messages
        if (value.messages && value.messages.length > 0) {
          for (const message of value.messages) {
            await processIncomingMessage(message, whatsappClient, mastra);
          }
        }

        // Handle message status updates (optional)
        if (value.statuses && value.statuses.length > 0) {
          for (const status of value.statuses) {
            console.log(`📊 Message status update: ${status.status} for message ${status.id}`);
          }
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Error handling webhook:', error);
    // Don't send error response - we already sent 200
  }
}

/**
 * Configuration des menus disponibles
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
  'menu_all': {
    type: 'all',
    name: 'All Menus',
    url: '' // Special case - will send all PDFs
  }
};

/**
 * Send intermediate "View Menus" button
 * This is shown first before displaying the menu selection list
 *
 * @param userId - User's WhatsApp ID
 * @param whatsappClient - WhatsApp client instance
 * @param language - User's language code
 */
async function sendViewMenusButton(userId: string, whatsappClient: WhatsAppClient, language: string): Promise<void> {
  const prompt = translate('viewMenusPrompt', language);
  const buttonTitle = translate('viewMenusButton', language);

  await whatsappClient.sendInteractiveButtons(
    userId,
    prompt,
    [{ id: 'action_view_menus', title: buttonTitle }]
  );

  console.log(`✅ Sent "View Menus" button to ${userId} in language: ${language}`);
}

/**
 * Send interactive menu selection list
 * Shows all 4 menu options for the user to choose from
 *
 * @param userId - User's WhatsApp ID
 * @param whatsappClient - WhatsApp client instance
 * @param language - User's language code
 */
async function sendMenuButtons(userId: string, whatsappClient: WhatsAppClient, language: string): Promise<void> {
  const bodyText = translate('chooseMenuPrompt', language);
  const buttonText = translate('chooseMenuButton', language);

  await whatsappClient.sendInteractiveList(
    userId,
    bodyText,
    buttonText,
    [{
      title: 'Menus',
      rows: [
        {
          id: 'menu_alacarte',
          title: translate('menuAlacarte', language)
        },
        {
          id: 'menu_wagyu',
          title: translate('menuWagyu', language)
        },
        {
          id: 'menu_wine',
          title: translate('menuWine', language)
        },
        {
          id: 'menu_drinks',
          title: translate('menuDrinks', language)
        }
      ]
    }]
  );

  console.log(`✅ Sent menu selection list to ${userId} in language: ${language}`);
}

/**
 * Handle menu button clicks and send corresponding PDFs
 *
 * @param userId - User's WhatsApp ID
 * @param buttonId - Button ID that was clicked
 * @param whatsappClient - WhatsApp client instance
 * @param language - User's language code
 */
async function handleMenuButtonClick(
  userId: string,
  buttonId: string,
  whatsappClient: WhatsAppClient,
  language: string
): Promise<void> {
  const menuConfig = MENU_CONFIGS[buttonId as keyof typeof MENU_CONFIGS];

  if (!menuConfig) {
    console.error(`Unknown menu button ID: ${buttonId}`);
    return;
  }

  // Special case: send all menus
  if (menuConfig.type === 'all') {
    console.log(`📋 Sending all menus to ${userId} in language: ${language}`);

    for (const [key, config] of Object.entries(MENU_CONFIGS)) {
      if (config.type !== 'all') {
        try {
          const menuMessage = getMenuMessage(config.type, language);
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
    // Send single menu
    const menuMessage = getMenuMessage(menuConfig.type, language);
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
 * Gère le flux de réservation interactif
 */
async function handleReservationFlow(
  userId: string,
  userMessage: string,
  whatsappClient: WhatsAppClient,
  language: string
): Promise<boolean> {
  const flow = sessionManager.getReservationFlow(userId);

  // Si pas de flux actif, vérifier si c'est une demande de réservation
  if (!flow || !flow.active) {
    const reservationKeywords = ['reserv', 'book', 'table', 'réserv'];
    const isReservationRequest = reservationKeywords.some(keyword =>
      userMessage.toLowerCase().includes(keyword)
    );

    if (isReservationRequest) {
      sessionManager.startReservationFlow(userId);
      await sendPartySizeButtons(userId, whatsappClient, language);
      return true;
    }
    return false;
  }

  // Gérer les différentes étapes du flux
  switch (flow.step) {
    case 'party_size':
      // L'utilisateur a répondu (via bouton ou texte)
      return false; // Les boutons géreront via leur ID

    case 'date':
      // Attendre que l'utilisateur entre une date
      const dateMatch = userMessage.match(/\d{4}-\d{2}-\d{2}/);
      if (dateMatch) {
        sessionManager.updateReservationFlow(userId, 'time', { date: dateMatch[0] });
        await sendTimeButtons(userId, whatsappClient, language);
        return true;
      }
      break;

    case 'time':
      // Les boutons géreront via leur ID
      return false;

    case 'duration':
      // Les boutons géreront via leur ID
      return false;
  }

  return false;
}

/**
 * Envoie les boutons pour le nombre de personnes
 */
async function sendPartySizeButtons(userId: string, whatsappClient: WhatsAppClient, language: string): Promise<void> {
  const messages: Record<string, string> = {
    'fr': 'Pour combien de personnes souhaitez-vous réserver ?',
    'en': 'How many people would you like to reserve for?',
    'es': '¿Para cuántas personas desea reservar?'
  };

  const buttonText: Record<string, string> = {
    'fr': 'Choisir',
    'en': 'Choose',
    'es': 'Elegir'
  };

  await whatsappClient.sendInteractiveList(
    userId,
    messages[language] || messages['en'],
    buttonText[language] || buttonText['en'],
    [{
      title: 'Personnes',
      rows: [
        { id: 'reservation_party_1', title: '1 personne' },
        { id: 'reservation_party_2', title: '2 personnes' },
        { id: 'reservation_party_3', title: '3 personnes' },
        { id: 'reservation_party_4', title: '4 personnes' },
        { id: 'reservation_party_5', title: '5 personnes' },
        { id: 'reservation_party_6', title: '6 personnes' },
        { id: 'reservation_party_7', title: '7 personnes' },
        { id: 'reservation_party_8', title: '8 personnes' },
        { id: 'reservation_party_more', title: '9+ personnes' }
      ]
    }]
  );
}

/**
 * Envoie un message demandant la date
 */
async function sendDateRequest(userId: string, whatsappClient: WhatsAppClient, language: string): Promise<void> {
  const messages: Record<string, string> = {
    'fr': 'Pour quelle date souhaitez-vous réserver ? Veuillez entrer la date au format AAAA-MM-JJ (par exemple: 2025-10-25)',
    'en': 'What date would you like to reserve? Please enter the date in YYYY-MM-DD format (e.g., 2025-10-25)',
    'es': '¿Para qué fecha desea reservar? Ingrese la fecha en formato AAAA-MM-DD (por ejemplo: 2025-10-25)'
  };

  await whatsappClient.sendTextMessage(userId, messages[language] || messages['en']);
}

/**
 * Envoie les boutons pour l'heure
 */
async function sendTimeButtons(userId: string, whatsappClient: WhatsAppClient, language: string): Promise<void> {
  const messages: Record<string, string> = {
    'fr': 'À quelle heure souhaitez-vous arriver ?',
    'en': 'What time would you like to arrive?',
    'es': '¿A qué hora le gustaría llegar?'
  };

  const buttonText: Record<string, string> = {
    'fr': 'Choisir l\'heure',
    'en': 'Choose time',
    'es': 'Elegir hora'
  };

  await whatsappClient.sendInteractiveList(
    userId,
    messages[language] || messages['en'],
    buttonText[language] || buttonText['en'],
    [{
      title: 'Horaires',
      rows: [
        { id: 'reservation_time_19:00', title: '19:00' },
        { id: 'reservation_time_19:30', title: '19:30' },
        { id: 'reservation_time_20:00', title: '20:00' },
        { id: 'reservation_time_20:30', title: '20:30' },
        { id: 'reservation_time_21:00', title: '21:00' },
        { id: 'reservation_time_21:30', title: '21:30' },
        { id: 'reservation_time_22:00', title: '22:00' }
      ]
    }]
  );
}

/**
 * Envoie les boutons pour la durée
 */
async function sendDurationButtons(userId: string, whatsappClient: WhatsAppClient, language: string): Promise<void> {
  const messages: Record<string, string> = {
    'fr': 'Quelle durée souhaitez-vous pour votre repas ?',
    'en': 'How long would you like your meal to be?',
    'es': '¿Cuánto tiempo le gustaría para su comida?'
  };

  const buttonText: Record<string, string> = {
    'fr': 'Choisir la durée',
    'en': 'Choose duration',
    'es': 'Elegir duración'
  };

  await whatsappClient.sendInteractiveButtons(
    userId,
    messages[language] || messages['en'],
    [
      { id: 'reservation_duration_90', title: '1h30' },
      { id: 'reservation_duration_120', title: '2h00' },
      { id: 'reservation_duration_150', title: '2h30' }
    ]
  );
}

/**
 * Génère et envoie le lien de réservation final
 */
async function sendReservationLink(userId: string, whatsappClient: WhatsAppClient, language: string): Promise<void> {
  const flow = sessionManager.getReservationFlow(userId);
  if (!flow || !flow.data.partySize || !flow.data.date || !flow.data.time || !flow.data.duration) {
    console.error('Incomplete reservation data');
    return;
  }

  const { partySize, date, time, duration } = flow.data;

  // Construire l'URL avec les paramètres
  const baseUrl = 'https://www.sevenrooms.com/explore/incalondon/reservations/create/search';
  const params = new URLSearchParams({
    date: date,
    halo: duration.toString(),
    party_size: partySize.toString(),
    start_time: time.replace(':', '%3A')
  });

  const reservationUrl = `${baseUrl}?${params.toString()}`;

  const messages: Record<string, string> = {
    'fr': `Parfait ! Voici le lien pour finaliser votre réservation :\n\n${reservationUrl}\n\nRécapitulatif :\n👥 ${partySize} personne(s)\n📅 ${date}\n🕐 ${time}\n⏱️ ${duration} minutes`,
    'en': `Perfect! Here's the link to complete your reservation:\n\n${reservationUrl}\n\nSummary:\n👥 ${partySize} person(s)\n📅 ${date}\n🕐 ${time}\n⏱️ ${duration} minutes`,
    'es': `¡Perfecto! Aquí está el enlace para completar su reserva:\n\n${reservationUrl}\n\nResumen:\n👥 ${partySize} persona(s)\n📅 ${date}\n🕐 ${time}\n⏱️ ${duration} minutos`
  };

  await whatsappClient.sendTextMessage(userId, messages[language] || messages['en']);

  // Terminer le flux
  sessionManager.updateReservationFlow(userId, 'complete', {});
}

/**
 * Gère les clics sur les boutons de réservation
 */
async function handleReservationButtonClick(
  userId: string,
  buttonId: string,
  whatsappClient: WhatsAppClient,
  language: string
): Promise<void> {
  const flow = sessionManager.getReservationFlow(userId);
  if (!flow) return;

  // Gérer nombre de personnes
  if (buttonId.startsWith('reservation_party_')) {
    const partySizeStr = buttonId.replace('reservation_party_', '');
    let partySize: number;

    if (partySizeStr === 'more') {
      partySize = 9; // Par défaut pour 9+
    } else {
      partySize = parseInt(partySizeStr);
    }

    sessionManager.updateReservationFlow(userId, 'date', { partySize });
    await sendDateRequest(userId, whatsappClient, language);
    return;
  }

  // Gérer l'heure
  if (buttonId.startsWith('reservation_time_')) {
    const time = buttonId.replace('reservation_time_', '');
    sessionManager.updateReservationFlow(userId, 'duration', { time });
    await sendDurationButtons(userId, whatsappClient, language);
    return;
  }

  // Gérer la durée
  if (buttonId.startsWith('reservation_duration_')) {
    const duration = parseInt(buttonId.replace('reservation_duration_', ''));
    sessionManager.updateReservationFlow(userId, 'complete', { duration });
    await sendReservationLink(userId, whatsappClient, language);
    return;
  }
}

/**
 * Process an incoming WhatsApp message
 * Integrates with Supabase for conversation history and Mastra for intelligent responses
 *
 * @param message - Incoming WhatsApp message from Meta webhook
 * @param whatsappClient - WhatsApp client for sending responses
 * @param mastra - Mastra AI agent instance
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
        userMessage = buttonReply.id; // Use button ID as the message
        isButtonClick = true;
        console.log(`🔘 Button clicked: ${buttonReply.id} (${buttonReply.title})`);
      } else if (listReply) {
        userMessage = listReply.id; // Use list item ID as the message
        isButtonClick = true;
        console.log(`📋 List item selected: ${listReply.id} (${listReply.title})`);
      }
    }
    // Handle text messages
    else if (message.type === 'text' && message.text?.body) {
      userMessage = message.text.body.trim();
    }
    // Ignore other message types
    else {
      console.log(`⚠️ Ignoring message of type: ${message.type}`);
      return;
    }

    // Check if we've already processed this message (deduplication)
    if (processedMessages.has(messageId)) {
      console.log(`⏭️ Skipping duplicate message: ${messageId}`);
      return;
    }

    // Add message to processed set
    processedMessages.add(messageId);

    // Clean up old messages after cache duration
    setTimeout(() => {
      processedMessages.delete(messageId);
    }, MESSAGE_CACHE_DURATION);

    console.log(`\n📨 Incoming message from ${userId}:`);
    console.log(`   Message ID: ${messageId}`);
    console.log(`   Content: "${userMessage}"`);

    // Mark message as read
    await whatsappClient.markAsRead(messageId);

    // Send typing indicator (simulated)
    await whatsappClient.sendTypingIndicator(userId);

    // === DATABASE INTEGRATION ===
    // Get or create conversation and check if user is new
    const conversation = await database.getOrCreateConversation(userId);
    const isNewUser = await database.isNewUser(userId);

    // Save incoming message to database
    await database.saveMessage({
      conversation_id: conversation.id,
      wa_message_id: messageId,
      direction: 'in',
      sender: 'user',
      message_type: message.type,
      text_content: userMessage
    });

    // Get conversation history for context
    const messages = await database.getConversationHistory(conversation.id, 10);
    const conversationHistory = database.formatHistoryForMastra(messages);

    // === BUTTON CLICK HANDLERS ===
    // These need to be checked before passing to Mastra

    // Handle "View Menus" button click -> show menu selection
    if (userMessage === 'action_view_menus') {
      // We need language from a previous message or detect from history
      // For now, we'll use a default approach - the language will be detected by Mastra
      const detectedLanguage = 'en'; // Will be improved by looking at history
      await sendMenuButtons(userId, whatsappClient, detectedLanguage);
      console.log(`✅ Processing complete for ${userId}`);
      return;
    }

    // Handle direct menu requests from button clicks
    if (userMessage.startsWith('menu_')) {
      // Detect language from recent conversation history or default to English
      const detectedLanguage = 'en'; // Will be improved by looking at history
      await handleMenuButtonClick(userId, userMessage, whatsappClient, detectedLanguage);
      console.log(`✅ Processing complete for ${userId}`);
      return;
    }

    // Handle reservation button clicks
    if (userMessage.startsWith('reservation_')) {
      const detectedLanguage = 'en'; // Will be improved
      await handleReservationButtonClick(userId, userMessage, whatsappClient, detectedLanguage);
      console.log(`✅ Processing complete for ${userId}`);
      return;
    }

    // Check if user is in a reservation flow
    const detectedLanguage = 'en'; // Will be improved
    const handledByReservationFlow = await handleReservationFlow(userId, userMessage, whatsappClient, detectedLanguage);
    if (handledByReservationFlow) {
      console.log(`✅ Processing complete for ${userId} (reservation flow)`);
      return;
    }

    // === MASTRA AGENT PROCESSING ===
    // Process message through Mastra with conversation history and user context
    const agentResponse = await processUserMessage(
      mastra,
      userMessage,
      userId,
      conversationHistory,
      isNewUser
    );

    // Extract detected language from agent response
    const userLanguage = agentResponse.detectedLanguage || 'en';

    // If agent wants to send all menus at once
    if (agentResponse.sendAllMenus) {
      console.log(`📋 Sending all menus to ${userId}`);
      await handleMenuButtonClick(userId, 'menu_all', whatsappClient, userLanguage);
      console.log(`✅ Processing complete for ${userId}`);
      return;
    }

    // If agent wants to show intermediate "View Menus" button
    if (agentResponse.showViewMenusButton) {
      console.log(`📋 Showing "View Menus" button to ${userId}`);
      await sendViewMenusButton(userId, whatsappClient, userLanguage);
      console.log(`✅ Processing complete for ${userId}`);
      return;
    }

    // If agent wants to show menu selection buttons
    if (agentResponse.showMenuButtons) {
      console.log(`📋 Showing menu selection list to ${userId}`);
      await sendMenuButtons(userId, whatsappClient, userLanguage);
      console.log(`✅ Processing complete for ${userId}`);
      return;
    }

    // If there are menus to send, send them as documents with minimal message
    if (agentResponse.menusToSend && agentResponse.menusToSend.length > 0) {
      console.log(`📋 Sending ${agentResponse.menusToSend.length} menu PDF(s) in language: ${userLanguage}`);

      for (const menu of agentResponse.menusToSend) {
        try {
          const menuMessage = getMenuMessage(menu.type, userLanguage);

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

    // Send response back to user (text message) only if there's text
    if (agentResponse.text && agentResponse.text.trim().length > 0) {
      await whatsappClient.sendTextMessage(userId, agentResponse.text);

      // Save bot response to database
      await database.saveMessage({
        conversation_id: conversation.id,
        direction: 'out',
        sender: 'bot',
        message_type: 'text',
        text_content: agentResponse.text
      });

      console.log(`✅ Text response sent to ${userId}`);
    }

    console.log(`✅ Processing complete for ${userId}`);
  } catch (error: any) {
    console.error('❌ Error processing incoming message:', error);

    // Try to send error message to user
    try {
      await whatsappClient.sendTextMessage(
        message.from,
        "I apologize, but I'm experiencing a technical issue. Please try again in a moment, or contact us directly:\n\n📞 +44 (0)20 7734 6066\n📧 reservations@incalondon.com"
      );
    } catch (sendError) {
      console.error('❌ Failed to send error message to user:', sendError);
    }
  }
}

/**
 * Validate webhook signature (optional but recommended for production)
 * Verifies that the webhook request actually came from Meta
 */
export function validateWebhookSignature(req: Request): boolean {
  // Meta sends signature in X-Hub-Signature-256 header
  const signature = req.headers['x-hub-signature-256'] as string;

  if (!signature) {
    console.warn('⚠️ No signature provided in webhook request');
    return true; // Allow for development - set to false in production
  }

  // In production, you should verify the signature using your app secret
  // For now, we'll accept all requests
  return true;
}
