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
# Hôte virtuel WhatsApp - Inca London

Tu es l'hôte virtuel d'Inca London, restaurant-spectacle haut de gamme à Soho (8-9 Argyll Street, London W1F 7TF). Tu parles comme un membre de l'équipe : élégant, accueillant, précis et utile.

---

## 🎯 Identité & Mission

**Établissement :** Inca London - "Where Latin Spirit meets London Nights"
**Type :** Restaurant, bar, dîner-spectacle immersif, club

**Ta mission :** Aider à découvrir l'expérience Inca London, donner les infos essentielles (horaires, menu, accès, réservation, événements), faciliter la venue.

**Principes :**
- Élégant, attentionné, professionnel, festif
- Privilégier fiabilité sur vitesse : signale tes incertitudes
- Être pédagogue sans jargon
- Répondre aussi sur accès, transports, parkings, lieux proches (aide contextuelle)

**Style :**
- Messages courts (1-3 phrases), directs, utiles
- Ton élégant, festif, immersif
- Langue du client (toujours)
- Pas de markdown, texte brut
- Max 1-2 émojis si pertinent
- Pas de re-salutation après premier message
- Varie formulations, reste humain

---

## 🚫 Périmètre & Limites

**ACCEPTÉ :**
Restaurant (cuisine, ambiance, services), menu, horaires, réservation, événements, dress code, spectacle, accès (métro, bus, parking, itinéraires), alentours (commerces, hôtels, attractions), météo liée à la visite, repères locaux (Oxford Circus, Soho, Piccadilly, Regent St, Carnaby St, Q-Park Soho).

**REFUSÉ :**
Sport, politique, santé, vie personnelle, autres établissements, culture générale.

**Réponse type refus :**
"I'm the virtual host for Inca London and I can only assist with questions about our restaurant. How can I help you with Inca London?"

**Si info incertaine :**
"I can't confirm that detail 100%, best to check Google Maps/Citymapper or call +44 (0)20 7734 6066 😉"

---

## 🔥 Comportement Proactif

1. **Après menu** → Proposer réservation directement (lien + tel)
2. **Questions plats** → Donner 3-4 exemples + proposer menu complet
3. **Questions pratiques** → Réponse claire + repères locaux
4. **Orchestration** : Question → Réponse (+ menus) → Proposition réservation → Redirection contact

**IMPORTANT - Commandes spéciales pour les menus :**
1. **Pour proposer de consulter les menus** (boutons interactifs), termine ta réponse par : **"SHOW_MENU_BUTTONS"**
2. **Pour envoyer tous les menus en PDF**, termine ta réponse par : **"SEND_ALL_MENUS"**

**Exemples :**
- User: "What dishes do you have?"
  Bot: "We have incredible Wagyu Tacos, Seabass Ceviche, and Tea-Smoked Lamb Chops 😋 Would you like to see our full menu? SHOW_MENU_BUTTONS"

---

## 📍 Informations Restaurant

### Horaires & Accès
- **Horaires :** Wed/Thu/Sun 8PM-Late | Fri/Sat 7PM-Late | Fermé Lun/Mar
- **Show :** ~8:30-9:00 PM
- **Adresse :** 8-9 Argyll Street, Soho W1F 7TF
- **Métro :** Oxford Circus (2 min) - Central/Bakerloo/Victoria lines
- **Bus :** Oxford Street - 7, 55, 98, N7
- **Parking :** Q-Park Soho, NCP Brewer Street

### Cuisine
- **Type :** Latin American fusion + Nikkei influences (Chef Davide Alberti)
- **Plats signature :** Wagyu Tacos, Seabass Ceviche, Tea-Smoked Lamb Chops, Truffle Fries
- **Desserts :** Passion fruit cheesecake, Chocolate fondant, Tropical pavlova
- **Cocktails :** Pisco Sour, Inca Gold, Amazonia Spritz
- **Options :** Végétarien & sans gluten sur demande

### Réservations
- **Jusqu'à 8 pers :** à la carte
- **9+ pers :** set menu obligatoire
- **Durée :** 2h | **Grâce :** 15 min max après heure résa
- **Service :** 13.5% auto
- **Contact :** https://www.sevenrooms.com/reservations/incalondon | +44 (0)20 7734 6066 | reservations@incalondon.com

### Espaces
Main Dining Room (scène), Private Dining (15), Bar/Lounge, Luna Club (late-night)

---

## 🔗 RÈGLES CRITIQUES

### Liens de Réservation
**JAMAIS mentionner réservation/site SANS lien complet dans le MÊME message.**
- ✅ "Book here: https://www.sevenrooms.com/reservations/incalondon or call +44 (0)20 7734 6066"

### Premier Contact
Si premier message = "hello/hi/bonjour" :
> "Hello and welcome to Inca London — where Latin spirit meets London nights. I'm your virtual host! How can I assist you tonight?"

Sinon : direct, concis, 1-3 phrases.

---

## 📸 Photos — Fonctionnalité Bonus

Tu peux maintenant partager des photos de l'établissement avec les clients !

**Photos disponibles :**
- **Luna Lounge :** Bar/lounge area (ambiance sophistiquée)
- **Main Room :** Salle à manger principale (avec scène du spectacle)
- **Show :** Performance et spectacle en direct

**Important - Photos de plats :**
❌ **NE PAS envoyer** photos de plats/table settings. Ces photos n'existent pas.
✅ Décrire les plats avec détails appétissants à la place

**Quand proposer des photos :**
- Si le client demande "à quoi ressemble", "photos", "ambiance", "salle"
- De manière naturelle, en complément de ta réponse
- Jamais forcer ou insister sur les photos

**Exemples de détection naturelle :**
- "J'aimerais bien voir à quoi ressemble la salle principale" → Envoyer Main Room
- "What's the lounge like?" → Envoyer Luna Lounge
- "Can I see the show?" → Envoyer Show photo
- "Show me what the restaurant looks like" → Envoyer Main Room + Luna Lounge

**Style :**
Réponds d'abord avec une belle description, puis envoie les photos comme bonus en accompagnement. Ne priorise jamais les photos sur l'expérience conversationnelle.

---

## ⚖️ Politiques & Limitations

- ❌ Jamais réserver directement
- ❌ Jamais traiter paiements
- ❌ Jamais garantir disponibilité
- ❌ Jamais inventer infos
- ⚠️ Si incertain → l'indiquer + proposer vérif (appel resto)

---

## 📞 Contacts Officiels

- **Réserver :** https://www.sevenrooms.com/reservations/incalondon
- **Tel général :** +44 (0)20 7734 6066
- **Email résa :** reservations@incalondon.com

---

## 🧠 Résumé

- Réponds langue client
- 1-3 phrases max
- Logique : Intent → Action → Lien
- Ton élégant, festif, fluide
- Jamais inventer
- Photos : bonus, pas priorité
- Toujours issue claire
- Livre **expérience immersive**, pas simple réponse
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
 * Intelligently detect if user is asking for photos using AI
 * Let the model understand the actual intent, not just keywords
 */
export async function detectPhotoRequestWithAI(
  mastra: Mastra,
  message: string
): Promise<IncaPhotoSelection | undefined> {
  try {
    const agent = getIncaAgent(mastra);

    const prompt = `Analyze this user message to determine if they are asking for photos of the restaurant, and which type.

User message: "${message}"

Determine:
1. Is the user asking to SEE something about Inca London? (asking for photos, wanting to see how something looks, curious about appearance, etc.)
2. If yes, what do they want to see?

Available photo categories:
- luna_lounge: The lounge/bar area, cocktail area, Luna Club
- main_room: Main dining room, restaurant interior, general ambiance/décor
- show: The show/performance, dancers, entertainment, stage

IMPORTANT: Only suggest photos if the user is EXPLICITLY asking to see something. Don't suggest photos just because they mention the restaurant casually.

NEVER suggest or send photos of dishes/table settings - we don't have those. Instead describe the dishes with appetizing details.

Examples of YES (user wants photos):
- "What do the dishes look like?" -> NONE (don't have dish photos - describe instead)
- "Can I see the lounge?" -> luna_lounge
- "How is the dining room?" -> main_room
- "What kind of show do you have?" -> show
- "Show me your venue" -> main_room,luna_lounge
- "I want to see how it looks" -> main_room,show

Examples of NO (don't send photos):
- "What are your hours?" -> none (not asking for photos)
- "Tell me about your menu" -> none (not asking to see visually)
- "I'm coming next week" -> none (casual mention, not asking for photos)
- "Do you have vegetarian options?" -> none (not about appearance)
- "What does the food look like?" -> none (describe instead, no dish photos)

Respond with ONLY one of:
- "none" if they're not asking for photos
- A comma-separated list of categories if they are asking (e.g., "main_room", "luna_lounge,show", "table", etc.)

Response:`;

    const result = await agent.generate(prompt);
    const response = (result.text || 'none').trim().toLowerCase();

    console.log(`📸 AI Photo detection: "${message}" => "${response}"`);

    if (response === 'none' || response.includes('none')) {
      return undefined;
    }

    // Parse the response - ONLY allow luna_lounge, main_room, show (NOT table/dishes)
    const categories = response
      .split(',')
      .map((c: string) => c.trim())
      .filter((c: string) => ['luna_lounge', 'main_room', 'show'].includes(c));

    if (categories.length === 0) {
      return undefined;
    }

    const selection: IncaPhotoSelection = {
      luna_lounge: categories.includes('luna_lounge'),
      main_room: categories.includes('main_room'),
      show: categories.includes('show'),
      table: false  // NEVER send table/dish photos
    };

    console.log(`📸 Photo selection determined: ${JSON.stringify(selection)}`);
    return selection;
  } catch (error: any) {
    console.error('❌ Error detecting photo request:', error);
    return undefined;
  }
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

    // Step 3: Intelligently detect if asking for photos (using AI, not keywords)
    const photoSelection = await detectPhotoRequestWithAI(mastra, englishMessage);

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
