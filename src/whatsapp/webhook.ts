/**
 * WhatsApp Webhook Handler for Meta Business API
 * Handles incoming messages and webhook verification
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
  generateReservationConfirmation,
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

/**
 * Detect user's language from conversation history
 * Uses the most recent text messages to detect language, ignoring button IDs
 *
 * @param userId - User's WhatsApp ID
 * @param userMessage - Current user message
 * @param mastra - Mastra instance
 * @param conversationHistory - Recent conversation messages
 * @returns Detected language code
 */
async function detectUserLanguage(
  userId: string,
  userMessage: string,
  mastra: Mastra,
  conversationHistory?: string
): Promise<string> {
  try {
    // Don't detect language from button IDs (they're in English by design)
    const isButtonClick = userMessage.startsWith('menu_') ||
                         userMessage.startsWith('reservation_') ||
                         userMessage.startsWith('action_');

    if (isButtonClick) {
      // Try to extract language from conversation history
      if (conversationHistory) {
        // Extract the last user message from history (not a button ID)
        const historyLines = conversationHistory.split('\n');
        for (let i = historyLines.length - 1; i >= 0; i--) {
          const line = historyLines[i];
          if (line.startsWith('User: ')) {
            const lastUserMessage = line.substring(6).trim();
            // Check if it's not a button ID
            if (!lastUserMessage.startsWith('menu_') &&
                !lastUserMessage.startsWith('reservation_') &&
                !lastUserMessage.startsWith('action_') &&
                lastUserMessage.length > 5) {
              console.log(`🌍 Detecting language from history: "${lastUserMessage}"`);
              const detectedLanguage = await detectLanguageWithMastra(mastra, lastUserMessage);
              return detectedLanguage;
            }
          }
        }
      }
      // Fallback to English if no history found
      console.log('🌍 Button click detected, no valid history - defaulting to English');
      return 'en';
    }

    // For regular text messages, detect language normally
    const detectedLanguage = await detectLanguageWithMastra(mastra, userMessage);
    return detectedLanguage;
  } catch (error: any) {
    console.error('❌ Error detecting language:', error);
    return 'en'; // Default to English
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
    type: 'button_reply' | 'list_reply' | 'nfm_reply';
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
    nfm_reply?: {
      name: string;
      body: string;
      response_json: string;
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
 * Now uses AI to generate text in any language
 *
 * @param userId - User's WhatsApp ID
 * @param whatsappClient - WhatsApp client instance
 * @param language - User's language code
 * @param mastra - Mastra instance for text generation
 */
async function sendViewMenusButton(
  userId: string,
  whatsappClient: WhatsAppClient,
  language: string,
  mastra: Mastra
): Promise<void> {
  const prompt = await generatePrompt(mastra, 'view_menus_prompt', language);
  const buttonTitle = await generatePrompt(mastra, 'view_menus_button', language);

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
 * Now uses AI to generate text in any language
 *
 * @param userId - User's WhatsApp ID
 * @param whatsappClient - WhatsApp client instance
 * @param language - User's language code
 * @param mastra - Mastra instance for text generation
 */
async function sendMenuButtons(
  userId: string,
  whatsappClient: WhatsAppClient,
  language: string,
  mastra: Mastra
): Promise<void> {
  const bodyText = await generatePrompt(mastra, 'choose_menu_prompt', language);
  const buttonText = await generatePrompt(mastra, 'choose_menu_button', language);

  // Generate menu labels in the user's language
  const menuLabels = await generateListLabels(
    mastra,
    [
      { id: 'menu_alacarte', englishLabel: 'À la Carte' },
      { id: 'menu_wagyu', englishLabel: 'Wagyu' },
      { id: 'menu_wine', englishLabel: 'Wine' },
      { id: 'menu_drinks', englishLabel: 'Drinks' }
    ],
    language
  );

  // Generate "Menus" title in user's language
  const menusTitle = await generateText(mastra, 'The word "Menus" (1 word)', language);

  await whatsappClient.sendInteractiveList(
    userId,
    bodyText,
    buttonText,
    [{
      title: menusTitle,
      rows: menuLabels.map(item => ({
        id: item.id,
        title: item.label
      }))
    }]
  );

  console.log(`✅ Sent menu selection list to ${userId} in language: ${language}`);
}

/**
 * Handle menu button clicks and send corresponding PDFs
 * Now uses AI to generate messages in any language
 *
 * @param userId - User's WhatsApp ID
 * @param buttonId - Button ID that was clicked
 * @param whatsappClient - WhatsApp client instance
 * @param language - User's language code
 * @param mastra - Mastra instance for text generation
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

  // Special case: send all menus
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
    // Send single menu
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
 * Gère le flux de réservation interactif
 * Now uses AI for language detection and text generation
 */
async function handleReservationFlow(
  userId: string,
  userMessage: string,
  whatsappClient: WhatsAppClient,
  language: string,
  mastra: Mastra
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
      await sendPartySizeButtons(userId, whatsappClient, language, mastra);
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
      // Attendre que l'utilisateur entre une date au format YYYY-MM-DD
      const dateMatch = userMessage.match(/\d{4}-\d{2}-\d{2}/);
      if (dateMatch) {
        console.log(`📅 Date manually entered: ${dateMatch[0]}`);
        sessionManager.updateReservationFlow(userId, 'time', { date: dateMatch[0] });
        await sendTimeButtons(userId, whatsappClient, language, mastra);
        return true;
      } else {
        // Si le format n'est pas correct, redemander
        const errorMessage = await generateText(
          mastra,
          'The date format is incorrect. Please enter the date in YYYY-MM-DD format (for example: 2025-10-25)',
          language
        );
        await whatsappClient.sendTextMessage(userId, `❌ ${errorMessage}`);
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
 * Now uses AI to generate text in any language
 */
async function sendPartySizeButtons(
  userId: string,
  whatsappClient: WhatsAppClient,
  language: string,
  mastra: Mastra
): Promise<void> {
  const bodyText = await generatePrompt(mastra, 'party_size_prompt', language);
  const buttonText = await generatePrompt(mastra, 'party_size_button', language);

  // Generate party size labels
  const partySizeLabels = await generateListLabels(
    mastra,
    [
      { id: 'reservation_party_1', englishLabel: '1 person' },
      { id: 'reservation_party_2', englishLabel: '2 people' },
      { id: 'reservation_party_3', englishLabel: '3 people' },
      { id: 'reservation_party_4', englishLabel: '4 people' },
      { id: 'reservation_party_5', englishLabel: '5 people' },
      { id: 'reservation_party_6', englishLabel: '6 people' },
      { id: 'reservation_party_7', englishLabel: '7 people' },
      { id: 'reservation_party_8', englishLabel: '8 people' },
      { id: 'reservation_party_more', englishLabel: '9+ people' }
    ],
    language
  );

  const peopleTitle = await generateText(mastra, 'The word "People" or "Guests" (1 word)', language);

  await whatsappClient.sendInteractiveList(
    userId,
    bodyText,
    buttonText,
    [{
      title: peopleTitle,
      rows: partySizeLabels.map(item => ({
        id: item.id,
        title: item.label
      }))
    }]
  );
}

/**
 * Generate available dates for the next 30 days
 * Returns dates formatted for display
 */
function generateAvailableDates(): Array<{ date: string; displayDate: string }> {
  const dates: Array<{ date: string; displayDate: string }> = [];
  const today = new Date();

  // Generate next 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    // Format display date
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    const day = date.getDate();

    let displayDate = `${dayName} ${day} ${monthName}`;

    // Add "Today" or "Tomorrow" for first two days
    if (i === 0) {
      displayDate += ' (Today)';
    } else if (i === 1) {
      displayDate += ' (Tomorrow)';
    }

    dates.push({ date: dateStr, displayDate });
  }

  return dates;
}

/**
 * Send interactive date selector using WhatsApp lists
 * Creates a multi-section list with dates grouped by weeks
 */
async function sendDateRequest(
  userId: string,
  whatsappClient: WhatsAppClient,
  language: string,
  mastra: Mastra
): Promise<void> {
  const bodyText = await generatePrompt(mastra, 'date_request', language);
  // WhatsApp limit: 20 chars max for button text
  // const buttonText = await generatePrompt(mastra, 'date_picker_button', language);

  // Generate available dates
  const availableDates = generateAvailableDates();

  // Split dates into weeks (7 days each) for better organization
  const sections = [];
  const weeksLabels = ['This Week', 'Next Week', 'Week 3', 'Week 4'];

  for (let weekIndex = 0; weekIndex < 4; weekIndex++) {
    const startIndex = weekIndex * 7;
    const endIndex = Math.min(startIndex + 7, availableDates.length);
    const weekDates = availableDates.slice(startIndex, endIndex);

    if (weekDates.length > 0) {
      // Translate week label
      const weekLabel = await generateText(mastra, `The phrase "${weeksLabels[weekIndex]}" (2-3 words)`, language);

      sections.push({
        title: weekLabel,
        rows: weekDates.map(({ date, displayDate }) => ({
          id: `reservation_date_${date}`,
          title: displayDate
        }))
      });
    }
  }
  // Send date list (commented out as it's a fallback)
  // await whatsappClient.sendInteractiveList(
  //   userId,
  //   bodyText,
  //   buttonText,
  //   sections
  // );

  console.log(`✅ Date request list prepared for ${userId} in language: ${language}`);
}

/**
 * Calculate date range for reservations
 * Restaurant is closed on Monday and Tuesday
 */
function calculateAvailableDateRange(): { minDate: string; maxDate: string; unavailableDates: string[] } {
  const today = new Date();
  const minDate = today.toISOString().split('T')[0]; // Today

  // Max date: 90 days from now
  const maxDateObj = new Date(today);
  maxDateObj.setDate(today.getDate() + 90);
  const maxDate = maxDateObj.toISOString().split('T')[0];

  // Calculate unavailable dates (Mondays and Tuesdays)
  const unavailableDates: string[] = [];
  const current = new Date(today);

  while (current <= maxDateObj) {
    const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday
    if (dayOfWeek === 1 || dayOfWeek === 2) {
      unavailableDates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }

  return { minDate, maxDate, unavailableDates };
}

/**
 * Send manual date input request
 * Asks user to type date in YYYY-MM-DD format
 * Now uses AI to generate text in any language
 *
 * ⚠️ CALENDAR FLOW TEMPORARILY DISABLED - Using manual date input instead
 */
async function sendCalendarPicker(
  userId: string,
  whatsappClient: WhatsAppClient,
  language: string,
  mastra: Mastra
): Promise<void> {
  // ⚠️ Flow calendar code commented out - using manual date input
  // const flowId = process.env.META_WHATSAPP_FLOW_ID;

  // if (!flowId) {
  //   console.error('❌ META_WHATSAPP_FLOW_ID not configured in .env');
  //   await sendDateRequest(userId, whatsappClient, language, mastra);
  //   return;
  // }

  // const flowCta = await generateText(mastra, 'Select Date', language);
  // const bodyText = await generateText(mastra, 'Please select your preferred date for the reservation', language);

  // try {
  //   await whatsappClient.sendCalendarFlow(userId, {
  //     flowId,
  //     flowCta,
  //     bodyText,
  //   });
  //   console.log(`✅ Sent Flow to ${userId} in language: ${language}`);
  // } catch (error) {
  //   console.error('❌ Error sending Flow:', error);
  //   console.log('   Falling back to date request list');
  //   await sendDateRequest(userId, whatsappClient, language, mastra);
  // }

  // ✅ Manual date input fallback
  const datePrompt = await generateText(
    mastra,
    'Please enter your preferred reservation date in the format YYYY-MM-DD (for example: 2025-10-25). We are open Wednesday to Sunday.',
    language
  );

  await whatsappClient.sendTextMessage(userId, `📅 ${datePrompt}`);

  console.log(`✅ Sent manual date input request to ${userId} in language: ${language}`);
}

/**
 * Send time selection buttons
 * Now uses AI to generate text in any language
 */
async function sendTimeButtons(
  userId: string,
  whatsappClient: WhatsAppClient,
  language: string,
  mastra: Mastra
): Promise<void> {
  const bodyText = await generatePrompt(mastra, 'time_prompt', language);
  const buttonText = await generatePrompt(mastra, 'time_button', language);

  // Generate time labels in the user's language
  const timeLabels = await generateListLabels(
    mastra,
    [
      { id: 'reservation_time_19:00', englishLabel: '19:00 (7:00 PM)' },
      { id: 'reservation_time_19:30', englishLabel: '19:30 (7:30 PM)' },
      { id: 'reservation_time_20:00', englishLabel: '20:00 (8:00 PM)' },
      { id: 'reservation_time_20:30', englishLabel: '20:30 (8:30 PM)' },
      { id: 'reservation_time_21:00', englishLabel: '21:00 (9:00 PM)' },
      { id: 'reservation_time_21:30', englishLabel: '21:30 (9:30 PM)' },
      { id: 'reservation_time_22:00', englishLabel: '22:00 (10:00 PM)' },
      { id: 'reservation_time_22:30', englishLabel: '22:30 (10:30 PM)' },
    ],
    language
  );

  const timeTitle = await generateText(mastra, 'The word "Time" (1 word)', language);

  await whatsappClient.sendInteractiveList(
    userId,
    bodyText,
    buttonText,
    [{
      title: timeTitle,
      rows: timeLabels.map(item => ({
        id: item.id,
        title: item.label
      }))
    }]
  );

  console.log(`✅ Sent time selection list to ${userId} in language: ${language}`);
}

/**
 * Envoie les boutons pour la durée
 * Now uses AI to generate text in any language
 */
async function sendDurationButtons(
  userId: string,
  whatsappClient: WhatsAppClient,
  language: string,
  mastra: Mastra
): Promise<void> {
  const bodyText = await generatePrompt(mastra, 'duration_prompt', language);
  const buttonText = await generatePrompt(mastra, 'duration_button', language);

  await whatsappClient.sendInteractiveButtons(
    userId,
    bodyText,
    [
      { id: 'reservation_duration_90', title: '1h30' },
      { id: 'reservation_duration_120', title: '2h00' },
      { id: 'reservation_duration_150', title: '2h30' }
    ]
  );
}

/**
 * Génère et envoie le lien de réservation final
 * Now uses AI to generate text in any language
 */
async function sendReservationLink(
  userId: string,
  whatsappClient: WhatsAppClient,
  language: string,
  mastra: Mastra
): Promise<void> {
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

  // Generate confirmation message using AI
  const message = await generateReservationConfirmation(
    mastra,
    language,
    { partySize, date, time, duration, url: reservationUrl }
  );

  await whatsappClient.sendTextMessage(userId, message);

  // Terminer le flux
  sessionManager.updateReservationFlow(userId, 'complete', {});
}

/**
 * Gère les clics sur les boutons de réservation
 * Now uses AI for text generation
 * Updated to use CalendarPicker flow
 */
async function handleReservationButtonClick(
  userId: string,
  buttonId: string,
  whatsappClient: WhatsAppClient,
  language: string,
  mastra: Mastra
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
    // Use the new CalendarPicker flow instead of date list
    await sendCalendarPicker(userId, whatsappClient, language, mastra);
    return;
  }

  // Gérer la date sélectionnée depuis le Flow CalendarPicker
  if (buttonId.startsWith('reservation_flow_date_')) {
    const date = buttonId.replace('reservation_flow_date_', '');
    sessionManager.updateReservationFlow(userId, 'time', { date });
    await sendTimeButtons(userId, whatsappClient, language, mastra);
    return;
  }

  // Gérer la date sélectionnée depuis la liste (fallback)
  if (buttonId.startsWith('reservation_date_')) {
    const date = buttonId.replace('reservation_date_', '');
    sessionManager.updateReservationFlow(userId, 'time', { date });
    await sendTimeButtons(userId, whatsappClient, language, mastra);
    return;
  }

  // Gérer l'heure
  if (buttonId.startsWith('reservation_time_')) {
    const time = buttonId.replace('reservation_time_', '');
    sessionManager.updateReservationFlow(userId, 'duration', { time });
    await sendDurationButtons(userId, whatsappClient, language, mastra);
    return;
  }

  // Gérer la durée
  if (buttonId.startsWith('reservation_duration_')) {
    const duration = parseInt(buttonId.replace('reservation_duration_', ''));
    sessionManager.updateReservationFlow(userId, 'complete', { duration });
    await sendReservationLink(userId, whatsappClient, language, mastra);
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
      const nfmReply = message.interactive.nfm_reply;

      if (buttonReply) {
        userMessage = buttonReply.id; // Use button ID as the message
        isButtonClick = true;
        console.log(`🔘 Button clicked: ${buttonReply.id} (${buttonReply.title})`);
      } else if (listReply) {
        userMessage = listReply.id; // Use list item ID as the message
        isButtonClick = true;
        console.log(`📋 List item selected: ${listReply.id} (${listReply.title})`);
      } else if (nfmReply) {
        // Handle WhatsApp Flow response (e.g., CalendarPicker)
        console.log(`📅 Flow response received: ${nfmReply.name}`);
        try {
          const flowData = JSON.parse(nfmReply.response_json);
          console.log(`   Flow data:`, flowData);

          // Handle calendar response
          if (flowData.calendar || flowData.date) {
            const selectedDate = flowData.calendar || flowData.date;
            userMessage = `reservation_flow_date_${selectedDate}`;
            isButtonClick = true;
            console.log(`📅 Calendar date selected: ${selectedDate}`);
          }
        } catch (error) {
          console.error('❌ Error parsing flow response:', error);
          userMessage = nfmReply.body || '';
        }
      }
    }
    // Handle text messages
    else if (message.type === 'text' && message.text?.body) {
      userMessage = message.text.body.trim();
    }
    // Handle audio messages (including voice notes)
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

        // Get conversation history to detect language hint for better transcription
        const tempConversation = await database.getOrCreateConversation(userId);
        const tempMessages = await database.getConversationHistory(tempConversation.id, 5);
        const tempHistory = database.formatHistoryForMastra(tempMessages);
        const languageHint = await detectUserLanguage(userId, '', mastra, tempHistory);

        // Transcribe audio using Whisper
        const transcription = await processAudioMessage(mediaId, accessToken, languageHint);
        userMessage = transcription;

        console.log(`✅ Transcription: "${transcription}"`);

        // Send a quick acknowledgment to user
        await whatsappClient.sendTextMessage(
          userId,
          `🎤 ${await generateText(mastra, 'Say "I heard:" followed by what you transcribed (very short)', languageHint)} "${transcription}"`
        );
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
        // Get user's language
        const tempConversation = await database.getOrCreateConversation(userId);
        const tempMessages = await database.getConversationHistory(tempConversation.id, 5);
        const tempHistory = database.formatHistoryForMastra(tempMessages);
        const userLanguage = await detectUserLanguage(userId, '', mastra, tempHistory);

        // Generate response text
        const locationData: LocationData = {
          latitude: message.location.latitude,
          longitude: message.location.longitude,
          name: message.location.name,
          address: message.location.address
        };

        const locationResponse = await generateLocationResponse(mastra, locationData, userLanguage);

        // Send text response first
        await whatsappClient.sendTextMessage(userId, locationResponse);

        // Then send the restaurant's location as a WhatsApp location message
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

    // Detect user language for button interactions (pass conversation history to detect from context)
    const detectedLanguage = await detectUserLanguage(userId, userMessage, mastra, conversationHistory);

    // Handle "View Menus" button click -> show menu selection
    if (userMessage === 'action_view_menus') {
      await sendMenuButtons(userId, whatsappClient, detectedLanguage, mastra);
      console.log(`✅ Processing complete for ${userId}`);
      return;
    }

    // Handle direct menu requests from button clicks
    if (userMessage.startsWith('menu_')) {
      await handleMenuButtonClick(userId, userMessage, whatsappClient, detectedLanguage, mastra);
      console.log(`✅ Processing complete for ${userId}`);
      return;
    }

    // Handle reservation button clicks
    if (userMessage.startsWith('reservation_')) {
      await handleReservationButtonClick(userId, userMessage, whatsappClient, detectedLanguage, mastra);
      console.log(`✅ Processing complete for ${userId}`);
      return;
    }

    // Check if user is in a reservation flow
    const handledByReservationFlow = await handleReservationFlow(userId, userMessage, whatsappClient, detectedLanguage, mastra);
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
      await handleMenuButtonClick(userId, 'menu_all', whatsappClient, userLanguage, mastra);
      console.log(`✅ Processing complete for ${userId}`);
      return;
    }

    // If agent wants to show intermediate "View Menus" button
    if (agentResponse.showViewMenusButton) {
      console.log(`📋 Showing "View Menus" button to ${userId}`);
      await sendViewMenusButton(userId, whatsappClient, userLanguage, mastra);
      console.log(`✅ Processing complete for ${userId}`);
      return;
    }

    // If agent wants to show menu selection buttons
    if (agentResponse.showMenuButtons) {
      console.log(`📋 Showing menu selection list to ${userId}`);
      await sendMenuButtons(userId, whatsappClient, userLanguage, mastra);
      console.log(`✅ Processing complete for ${userId}`);
      return;
    }

    // If there are menus to send, send them as documents with minimal message
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

      // Check if the response mentions the address/location and send WhatsApp location pin
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

    console.log(`✅ Processing complete for ${userId}`);
  } catch (error: any) {
    console.error('❌ Error processing incoming message:', error);

    // Try to send error message to user in their language
    try {
      // Try to detect language or use English as fallback
      let errorLanguage = 'en';
      try {
        if (message.text?.body) {
          errorLanguage = await detectUserLanguage(message.from, message.text.body, mastra);
        }
      } catch (langError) {
        // Fallback to English if detection fails
        console.error('Failed to detect language for error message:', langError);
      }

      const errorMessage = await generateErrorMessage(mastra, errorLanguage, 'technical');
      await whatsappClient.sendTextMessage(message.from, errorMessage);
    } catch (sendError) {
      console.error('❌ Failed to send error message to user:', sendError);
      // Last resort: send hardcoded English message
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
