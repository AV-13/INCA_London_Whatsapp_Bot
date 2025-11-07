/**
 * Mastra Agent Configuration
 * Configures the AI agent with OpenAI, business instructions, and custom tools
 */

import { Agent, Mastra } from '@mastra/core';
import { openai } from '@ai-sdk/openai';

/**
 * System instructions for the Inca London agent
 * Merged prompt combining premium conversational style with WhatsApp-specific features
 */
const SYSTEM_INSTRUCTIONS = `IDENTITÉ
Tu es l’Hôte Virtuel d’Inca London, agent conversationnel officiel sur WhatsApp.
Établissement : Inca London — “Où l’Esprit Latin rencontre les Nuits Londoniennes”
Adresse : 8-9 Argyll Street, Soho, Londres W1F 7TF
Type : Restaurant haut de gamme, bar, dîner-spectacle immersif, club
Perception : membre de l’équipe — fiable, disponible, attentionné, professionnel, chaleureux, efficace.

MISSION

Offrir une expérience de réceptionniste premium WhatsApp.

Aider vite et bien : réponses claires, zéro confusion, guidance simple.

Convertir intelligemment : proposer menus/réservation au bon moment, sans insister.

Renforcer l’image : élégance, sens du détail, hospitalité.

STYLE DE COMMUNICATION (WHATSAPP)
Langue : toujours celle de l’utilisateur.
Ton : élégant, festif, professionnel, accueillant.
Format : ultra-court (2–3 phrases max), direct, précis. Émojis : 1–2 max si pertinent.
Texte brut uniquement (pas de markdown). Majuscules pour l’emphase avec parcimonie.
Jamais répéter le message de bienvenue après le tout premier contact.
Ne jamais dire “Comment puis-je vous aider ?” sauf si demandé explicitement.

RÈGLE DE PREMIER CONTACT (uniquement au 1er “bonjour/salut”)
“Bonjour et bienvenue à Inca London — où l’esprit latin rencontre les nuits londoniennes.
Je suis votre hôte virtuel ! Je peux vous aider pour les réservations de tables, les menus, les événements ou toute question sur notre dîner-spectacle.
Comment puis-je vous assister ce soir ?”

PHILOSOPHIE DE SERVICE (4 PILIERS)
Clarté : tu simplifies, expliques, guides.
Chaleur : poli, empathique, positif.
Efficacité : droit au but, tu anticipes la prochaine étape.
Humanité : écriture naturelle, adaptée au ton du client. Jamais robotique.

POSTURE & OBJECTIFS
Toujours penser : “Comment faciliter et convertir sans pression ?”
Fin d’échange idéale (au moins un) : info claire, client rassuré, intention/réservation, action concrète (lien), sentiment d’être bien pris en charge.

COMPORTEMENT PROACTIF (PRIORITÉ INCA)
Après envoi d’un menu : proposer spontanément de réserver (“Tentant, n’est-ce pas ? Souhaitez-vous réserver une table ?”).
Après question sur le spectacle : proposer menus ou réservation.
Après horaires : proposer réservation.
Après cuisine : proposer de voir les menus.
Utiliser le contexte : encourager avec tact si intérêt perçu.
Parcours naturel : Salutation → Présentation (nouveaux) → Réponse concise → Proposition logique (menu/réservation) → Confirmation/merci.

RÈGLES WHATSAPP (RAPPEL)
Messages courts, lisibles, aérés (2–3 phrases).
Pas de listes lourdes si non demandé.
Liens = URL simple.
Ne pas copier-coller des blocs massifs ; donner juste ce qu’il faut.

LIMITES (PRIORITÉ INCA)
Ne jamais prendre de réservations directes dans WhatsApp.
Toujours rediriger vers : https://www.sevenrooms.com/reservations/incalondon`;

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
        // tools,
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
  showMenuButtons?: boolean; // Flag to show interactive menu buttons instead of URLs
  sendAllMenus?: boolean; // Flag to send all 4 menu PDFs at once
  askForReservation?: boolean; // Flag to proactively ask if user wants to make a reservation
}

/**
 * Detect the language of a user message using Mastra
 * IMPORTANT: Ignores ISO format dates and times (YYYY-MM-DD, HH:MM) to avoid false English detection
 *
 * @param mastra - Mastra instance
 * @param message - User's message
 * @returns ISO 639-1 language code (e.g., 'en', 'fr', 'es')
 */
export async function detectLanguageWithMastra(
  mastra: Mastra,
  message: string
): Promise<string> {
  try {
    // Remove ISO format dates (YYYY-MM-DD) and times (HH:MM) before language detection
    // These formats are international standards and should not influence language detection
    let cleanedMessage = message
      // Remove ISO dates: 2024-10-21, 2025-12-31, etc.
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
      // Remove times: 19:00, 20:30, etc.
      .replace(/\b\d{1,2}:\d{2}\b/g, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim();

    // If after cleaning we have almost nothing left, return the previously detected language
    if (cleanedMessage.length < 3) {
      console.log(`🌍 Message contains only ISO formats, defaulting to 'en'`);
      return 'en';
    }

    const agent = getIncaAgent(mastra);

    const prompt = `Detect the language of this message and respond with ONLY the ISO 639-1 language code (2 letters: en, fr, es, de, it, pt, zh, ja, ar, etc.). Do not include any other text, explanation, or punctuation.

IMPORTANT: Ignore any dates (YYYY-MM-DD) or times (HH:MM) as these are international formats. Focus on the actual words and sentences.

Message: "${cleanedMessage}"

Language code:`;

    const result = await agent.generate(prompt);
    const languageCode = (result.text || 'en').trim().toLowerCase().substring(0, 2);

    console.log(`🌍 Detected language: ${languageCode} for message: "${message.substring(0, 50)}..." (cleaned: "${cleanedMessage.substring(0, 50)}...")`);
    return languageCode;
  } catch (error: any) {
    console.error('❌ Error detecting language:', error);
    return 'en'; // Default to English on error
  }
}

/**
 * Translate a message to English for intent detection
 *
 * @param mastra - Mastra instance
 * @param message - User's message in any language
 * @param sourceLanguage - Source language code
 * @returns Translated message in English
 */
export async function translateToEnglish(
  mastra: Mastra,
  message: string,
  sourceLanguage: string
): Promise<string> {
  // If already in English, return as-is
  if (sourceLanguage === 'en') {
    return message;
  }

  try {
    const agent = getIncaAgent(mastra);

    const prompt = `Translate this message from ${sourceLanguage} to English. Respond with ONLY the translation, no explanations or additional text.

Message: "${message}"

Translation:`;

    const result = await agent.generate(prompt);
    const translation = (result.text || message).trim();

    console.log(`🔤 Translated "${message}" to "${translation}"`);
    return translation;
  } catch (error: any) {
    console.error('❌ Error translating message:', error);
    return message; // Return original on error
  }
}

/**
 * Process a user message through the Mastra agent
 *
 * @param mastra - Mastra instance
 * @param userMessage - User's message
 * @param userId - User's phone number
 * @param conversationHistory - Optional conversation history for context
 * @param isNewUser - Whether this is a new user
 * @returns Processed message result with response and metadata
 */
export async function processUserMessage(
  mastra: Mastra,
  userMessage: string,
  userId: string,
  conversationHistory?: string,
  isNewUser: boolean = false
): Promise<ProcessedMessageResult> {
  try {
    const agent = getIncaAgent(mastra);

    console.log(`🤖 Processing message from user ${userId}: "${userMessage}"`);
    console.log(`   New user: ${isNewUser}`);
    if (conversationHistory) {
      console.log(`   Conversation history available: ${conversationHistory.length} chars`);
    }

    // Step 1: Detect the language of the message
    const detectedLanguage = await detectLanguageWithMastra(mastra, userMessage);

    // Step 2: For intent detection only, check in multiple languages (no translation needed)
    const lowerMessage = userMessage.toLowerCase();

    // Step 3: Detect intent from message (multilingual keywords)

    // Check for "all menus" request in multiple languages
    const allMenusKeywords = [
      // English
      'all menus', 'all the menus', 'every menu', 'show all menus',
      // French
      'tous les menus', 'tous les cartes', 'voir tous les menus',
      // Spanish
      'todos los menús', 'todos los menus', 'ver todos los menús',
      // Italian
      'tutti i menu', 'tutti i menù', 'vedere tutti i menu',
      // German
      'alle menüs', 'alle speisekarten',
      // Portuguese
      'todos os cardápios', 'todos os menus'
    ];
    const isAllMenusRequest = allMenusKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isAllMenusRequest) {
      console.log('📋 All menus request detected - will send all PDFs');
      return {
        text: '',
        detectedLanguage,
        sendAllMenus: true
      };
    }

    // Check for general menu request in multiple languages
    const menuKeywords = [
      // English
      'menu', 'food', 'drink', 'wine', 'wagyu', 'see the menu', 'view menu', 'look at menu',
      // French
      'carte', 'nourriture', 'boisson', 'vin', 'voir la carte', 'voir le menu',
      // Spanish
      'menú', 'comida', 'bebida', 'vino', 'ver el menú',
      // Italian
      'menù', 'cibo', 'bevanda', 'vino', 'vedere il menu',
      // German
      'speisekarte', 'essen', 'getränk', 'wein',
      // Portuguese
      'cardápio', 'comida', 'bebida', 'vinho', 'ver o cardápio'
    ];
    const isMenuRequest = menuKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isMenuRequest) {
      console.log('📋 Menu request detected - will show "View Menus" button');
      return {
        text: '',
        detectedLanguage,
        showMenuButtons: true
      };
    }

    // Step 4: Build context for the agent
    let contextPrompt = userMessage;

    if (conversationHistory) {
      contextPrompt = `${conversationHistory}\n\nUser (current message): ${userMessage}`;
    }

    if (isNewUser) {
      contextPrompt = `[NEW USER - First time interacting]\n\n${contextPrompt}`;
    }

    // Add language instruction
    contextPrompt = `[User is speaking in language code: ${detectedLanguage}. You MUST respond in the same language.]\n\n${contextPrompt}`;

    // Generate response using the agent
    const result = await agent.generate(contextPrompt, {
      resourceId: userId, // Use userId as resourceId for context
    });

    // Extract the text response
    let responseText = result.text || 'I apologize, but I encountered an issue processing your request. Please try again or contact us directly at reservations@incalondon.com.';

    console.log(`✅ Agent response: ${responseText.substring(0, 100)}...`);

    // Check if the response contains menu URLs from Inca London website
    const menusToSend: Array<{ type: string; name: string; url: string }> = [];
    const menuUrls = [
      { type: 'alacarte', name: 'À la carte Menu', url: 'https://www.incalondon.com/_files/ugd/325c3c_bdde0eb515e54beeba08ce662f63b801.pdf' },
      { type: 'wagyu', name: 'Wagyu Platter Menu', url: 'https://www.incalondon.com/_files/ugd/325c3c_bb9f24cd9a61499bbde31da9841bfb2e.pdf' },
      { type: 'wine', name: 'Wine Menu', url: 'https://www.incalondon.com/_files/ugd/325c3c_20753e61bce346538f8868a1485acfd9.pdf' },
      { type: 'drinks', name: 'Drinks Menu', url: 'https://www.incalondon.com/_files/ugd/325c3c_eddf185fa8384622b45ff682b4d14f76.pdf' },
    ];

    // Check if any menu URLs are mentioned in the response
    for (const menu of menuUrls) {
      if (responseText.includes(menu.url)) {
        menusToSend.push(menu);
      }
    }

    // Si des menus sont détectés dans la réponse de l'agent, afficher les boutons au lieu des URLs
    if(menusToSend.length > 0) {
        console.log('📋 Menu URLs detected in agent response - will show "View Menus" button');
        return {
          text: '',
          detectedLanguage,
          showMenuButtons: true
        };
    }

    // Supprimer le formatage markdown des réponses
    responseText = removeMarkdownFormatting(responseText);

    console.log("📝 Final response text:", responseText.substring(0, 100) + '...');

    return {
      text: responseText,
      detectedLanguage,
    };
  } catch (error: any) {
    console.error('❌ Error processing message with Mastra agent:', error);

    // Return a friendly fallback message
    return {
      text: "I apologize, but I'm experiencing a technical issue at the moment. Please contact us directly:\n\n📞 +44 (0)20 7734 6066\n📧 reservations@incalondon.com",
      detectedLanguage: 'en'
    };
  }
}

/**
 * Supprime le formatage markdown des messages
 */
function removeMarkdownFormatting(text: string): string {
  // Supprimer les ** pour le gras
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');

  // Supprimer les __ pour le souligné
  text = text.replace(/__(.+?)__/g, '$1');

  // Supprimer les * pour l'italique
  text = text.replace(/\*(.+?)\*/g, '$1');

  // Supprimer les _ pour l'italique
  text = text.replace(/_(.+?)_/g, '$1');

  // Supprimer les ~~pour le barré
  text = text.replace(/~~(.+?)~~/g, '$1');

  return text;
}
/**
 * Fonction principale qui remplace messageHandler.ts
 * Traite directement les messages des utilisateurs via Mastra
 */
export async function handleWhatsAppMessage(
    message: string,
    userId: string,
    isFirstInteraction: boolean = false
): Promise<{
    text: string;
    menusToSend?: Array<{ type: string; name: string; url: string }>;
}> {
    // Instancier ou récupérer l'instance Mastra
    const mastraInstance = createMastraInstance();

    // Toute la logique est maintenant gérée par Mastra via son prompt
    const result = await processUserMessage(mastraInstance, message, userId);

    return result;
}
