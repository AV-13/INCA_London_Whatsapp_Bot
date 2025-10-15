/**
 * WhatsApp Webhook Handler for Meta Business API
 * Handles incoming messages and webhook verification
 */

import { Request, Response } from 'express';
import { WhatsAppClient } from './client.js';
import { Mastra } from '@mastra/core';
import { processUserMessage } from '../agent/mastra.js';

/**
 * Set to track processed message IDs (prevents duplicates)
 * Messages are kept for 5 minutes to handle Meta's webhook retries
 */
const processedMessages = new Set<string>();
const MESSAGE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Détecte la langue d'un message utilisateur
 */
function detectLanguage(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Mots-clés français
  const frenchKeywords = ['menu', 'bonjour', 'salut', 'merci', 'carte', 'vin', 'vins', 'wagyu', 'plat', 'plats'];
  // Mots-clés anglais
  const englishKeywords = ['hello', 'hi', 'thanks', 'thank', 'wine', 'dish', 'dishes', 'drink'];
  // Mots-clés espagnols
  const spanishKeywords = ['hola', 'gracias', 'vino', 'menú', 'bebida', 'comida'];

  let frenchScore = 0;
  let englishScore = 0;
  let spanishScore = 0;

  frenchKeywords.forEach(keyword => {
    if (lowerMessage.includes(keyword)) frenchScore++;
  });

  englishKeywords.forEach(keyword => {
    if (lowerMessage.includes(keyword)) englishScore++;
  });

  spanishKeywords.forEach(keyword => {
    if (lowerMessage.includes(keyword)) spanishScore++;
  });

  // Par défaut anglais si aucune détection
  if (frenchScore === 0 && englishScore === 0 && spanishScore === 0) {
    return 'en';
  }

  if (frenchScore >= englishScore && frenchScore >= spanishScore) {
    return 'fr';
  } else if (spanishScore > englishScore) {
    return 'es';
  }

  return 'en';
}

/**
 * Génère un message minimal pour accompagner l'envoi d'un menu
 */
function getMenuMessage(menuType: string, language: string): string {
  const messages: Record<string, Record<string, string>> = {
    'alacarte': {
      'fr': 'Voici le menu à la carte',
      'en': 'Here is the à la carte menu',
      'es': 'Aquí está el menú a la carta'
    },
    'wagyu': {
      'fr': 'Voici le menu Wagyu',
      'en': 'Here is the Wagyu menu',
      'es': 'Aquí está el menú Wagyu'
    },
    'wine': {
      'fr': 'Voici la carte des vins',
      'en': 'Here is the wine menu',
      'es': 'Aquí está la carta de vinos'
    },
    'drinks': {
      'fr': 'Voici le menu boissons',
      'en': 'Here is the drinks menu',
      'es': 'Aquí está el menú de bebidas'
    }
  };

  return messages[menuType]?.[language] || messages[menuType]?.['en'] || '';
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
 * Process an incoming WhatsApp message
 */
async function processIncomingMessage(
  message: WhatsAppWebhookMessage,
  whatsappClient: WhatsAppClient,
  mastra: Mastra
): Promise<void> {
  try {
    // Only process text messages
    if (message.type !== 'text' || !message.text?.body) {
      console.log(`⚠️ Ignoring non-text message of type: ${message.type}`);
      return;
    }

    const userId = message.from;
    const userMessage = message.text.body.trim();
    const messageId = message.id;

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

    // Process message through Mastra agent
    const agentResponse = await processUserMessage(mastra, userMessage, userId);

    // Détecter la langue de l'utilisateur
    const userLanguage = detectLanguage(userMessage);

    // If there are menus to send, send them as documents with minimal message
    if (agentResponse.menusToSend && agentResponse.menusToSend.length > 0) {
      console.log(`📋 Sending ${agentResponse.menusToSend.length} menu PDF(s) in language: ${userLanguage}`);

      for (const menu of agentResponse.menusToSend) {
        try {
          // Générer le message minimal dans la langue de l'utilisateur
          const menuMessage = getMenuMessage(menu.type, userLanguage);

          await whatsappClient.sendDocument(
            userId,
            menu.url,
            `${menu.name}.pdf`,
            menuMessage // Utiliser le message minimal au lieu de menu.name
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
