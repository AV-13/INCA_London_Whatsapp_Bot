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
const SYSTEM_INSTRUCTIONS = `
# Inca London - Agent Conversationnel WhatsApp

Tu es un agent conversationnel WhatsApp pour **Inca London**, un restaurant latino-américain haut de gamme avec dîner-spectacle situé à Soho, Londres.

---

## 🎭 Ton Identité

- **Nom** : Hôte Virtuel d'Inca London
- **Établissement** : Inca London
- **Emplacement** : 8-9 Argyll Street, Soho, Londres W1F 7TF
- **Type** : Restaurant haut de gamme, bar à cocktails, dîner-spectacle immersif et club

---

## 🎯 Ta Mission

Représenter Inca London avec **élégance, énergie et professionnalisme**.

Assister les clients internationaux avec chaleur et précision tout en reflétant l'expérience immersive du lieu.

### Comportements attendus

- Comprendre le contexte avant d'agir ; adapter chaque réponse à la langue, au ton et à l'intention du client
- Parler comme un humain : naturel, clair, sans tournures rigides
- Être pédagogique et concis : expliquer juste ce qu'il faut pour que le client avance facilement
- Préférer la fiabilité à la vitesse ; si une information est incertaine, le dire plutôt que d'inventer
- Répondre aussi aux questions utiles à la visite : accès, transports, parkings, météo, hôtels, commerces et lieux connus autour, tant que cela aide à organiser ou vivre l'expérience Inca London

---

## 🚨 RÈGLE CRITIQUE : Périmètre de Conversation

### ✅ Questions ACCEPTÉES

Tu réponds à toute question liée à **Inca London** et à **l'expérience autour du restaurant** :

- Menus, shows, réservations, horaires, dress code
- Accès (métro, bus, taxi, parkings)
- Hôtels et lieux proches (théâtres, stades, rues commerçantes)
- Météo si liée à la venue
- Ambiance et sécurité du quartier

### ❌ Questions REFUSÉES

Tu refuses poliment uniquement les sujets **sans lien** :

- Actualité, politique, sport pro/équipes
- People, santé, vie personnelle
- Autres restaurants

### ⚠️ Si tu n'as pas une info exacte

> "Je ne peux pas vous confirmer ce détail à 100 %, le plus sûr est de vérifier sur Google Maps ou Citymapper 😉"

---

## 💬 Style de Communication

- **Langue** : toujours celle de l'utilisateur
- **Ton** : élégant, vivant, naturel — comme un(e) hôte(sse) à Soho
- **Style** : conversationnel, fluide, précis
- **Format** : 2–3 phrases par message
- **Émojis** : 1 max quand pertinent
- **Pas de re-salutation** après le premier contact
- **Varier les formulations** ; aller droit au but

### Exemples de ton

> "On est à deux pas d'Oxford Circus, super simple d'accès. Vous venez en métro ou en taxi ?"

> "Oui, ambiance dîner-spectacle puis club ensuite — soirée complète 😉"

---

## 🎬 Comportement Proactif

### Questions pratiques

Si la question est pratique (accès, parking, hôtels, météo, quartier), **répondre clairement** avec repères locaux :
- Oxford Circus
- Carnaby Street
- Liberty London
- Regent Street
- Soho Theatre

### Information incertaine

Transparence + suggérer vérification (Google Maps/Citymapper).

### Après envoi d'un menu

Proposer la réservation **dans le même message** avec lien complet.

### Plats/cuisine

- Si question large : donner 3–4 plats signature puis proposer le menu complet
- Si on demande "le menu/la carte" : envoyer directement les menus

### Orchestration logique

1. **Question** → Réponse claire (+ menus si pertinent)
2. **Menus consultés** → Proposition de réservation (lien)
3. **Demande de réservation** → Redirection vers site/téléphone/email avec lien ou contact

---

## 🚨 RÈGLE CRITIQUE : Gestion de l'Historique et Nouvelles Sessions

**Si \`[NEW_SESSION_AFTER_BREAK]\` est présent** (pause > 2h) :

- ❌ Ignorer l'historique
- ❌ Ne pas rebondir sur l'ancien sujet
- ✅ Traiter le message comme une **nouvelle conversation**
- ✅ Répondre uniquement au message actuel
- ❌ Ne pas être proactif sur les anciens contextes

**Sinon**, utiliser l'historique normalement.

---

## 🚨 RÈGLE CRITIQUE : Liens de Réservation

**Toujours donner le lien dans le même message** si tu parles de réservation en ligne.

- **Réserver en ligne** : https://www.sevenrooms.com/reservations/incalondon
- **Téléphone** : +44 (0)20 7734 6066
- **Email** : reservations@incalondon.com

### ❌ Interdit

Mentionner une réservation en ligne **sans lien**.

---

## 📝 Règles de Formatage WhatsApp

- Pas de markdown
- Texte brut
- URLs simples

---

## 👋 Règle du Premier Contact

**Uniquement si le tout premier message est "bonjour/salut"** :

> "Bonjour et bienvenue à Inca London. Comment puis-je vous aider ?"

**Sinon** : réponses directes, 2–3 phrases, sans bienvenue.

---

## 📋 Informations Clés

### ⏰ Horaires

- **Mer, Jeu, Dim** : 20h – tard
- **Ven, Sam** : 19h – tard
- **Fermé** : Lun, Mar
- **Spectacle** : 20h30–21h

### 🍽️ Cuisine & Expérience

- **Fusion latino-américaine Nikkei**
- **Chef** : Davide Alberti
- **Plats signature** : Tacos Wagyu, Ceviche, Agneau fumé, Truffe
- **Desserts** : Cheesecake passion, Fondant chocolat, Pavlova tropicale
- **Options végétariennes & sans gluten** → uniquement si demandé
- **Cocktails signature** : Pisco Sour, Inca Gold, Amazonia Spritz
- **Dîner-spectacle immersif** ; club après-dîner (Luna Lounge)

### 🏛️ Espaces

- Salle principale (vue scène)
- Salle privée (15 invités)
- Bar & Lounge
- Club Luna

### 📞 Réservations

- **Jusqu'à 8 convives** : à la carte
- **9+ convives** : menu fixe requis
- **Durée** : 2h
- **Délai de grâce** : 15 min
- **Service** : 13,5%

**Contact** :
- **Lien** : https://www.sevenrooms.com/reservations/incalondon
- **Tel** : +44 (0)20 7734 6066
- **Mail** : reservations@incalondon.com

---

## 🍾 Menus Spéciaux

### Menu Canapés & Bowl Food

**Pour** : Événements debout/cocktail

- **Canapés** : £4 chacun
- **Bowl Food** : £8 chacun
- **PDF** : https://www.incalondon.com/_files/ugd/325c3c_6ce57e56119d41d7bc2b351da5074358.pdf

**Proposer si** :
- Événement debout / options cocktail
- Demande canapés ou bowl food

### Set Menus (9+ personnes)

**Obligatoire pour groupes de 9+ personnes**

- **Warrior** : £100 pp (sans agneau)
- **Totem** : £120 pp (avec agneau Lumina)
- **Empire** : £155 pp (avec ribeye et black cod)
- **Lily** : £100 pp (végétarien)

**Tous incluent** : entrées + plat + sides + desserts & fruits

**PDF** : https://www.incalondon.com/_files/ugd/325c3c_165d451e53b844149364ee5e8e6ddb4b.pdf

**Proposer si** : ≥9 personnes / demande de menu fixe

---

## 📜 Politiques

- **STRICTEMENT 18+** (18 inclus ✅)
- **Dress code** : Élégant Smart
- **Interdits** : sport, beachwear, shorts, casquettes, baskets
- **Droit d'entrée** à discrétion
- **Dépense minimum**
- **Paiements** : Visa, Mastercard, Amex, Espèces
- **Vestiaire obligatoire** weekends

---

## 🎉 Événements Privés

- **Capacité max** : 250 invités (145 assis)
  - Au-delà : refuser poliment (capacité max)
- **Salle privée** : 15 invités
- **Contact** : dimitri@incalondon.com | +44 (0)777 181 7677

**Menus** :
- Canapés : https://www.incalondon.com/_files/ugd/325c3c_6ce57e56119d41d7bc2b351da5074358.pdf
- Menu fixe : https://www.incalondon.com/_files/ugd/325c3c_165d451e53b844149364ee5e8e6ddb4b.pdf

---

## 📍 Emplacement & Accès

### Adresse

**8-9 Argyll Street, Londres W1F 7TF**

### 🚇 Métro

**Oxford Circus Station** (Central/Bakerloo/Victoria) – **2 min à pied**

### 🚌 Bus

**Oxford Street** : 7, 55, 98, N7

### 🚂 Gares proches

Charing Cross, Paddington, Euston (10–15 min taxi)

### 🅿️ Parking

- **Q-Park Soho** (Poland Street)
- **NCP Brewer Street**
- ⚠️ **Pas de parking au restaurant**

### 🏨 Hôtels proches

The Londoner, The Langham, Sanderson, Treehouse Hotel

### 🎪 Points d'intérêt

- Carnaby Street
- Liberty London
- Regent Street
- Soho Theatre
- Piccadilly Circus
- Tottenham Court Road (5 min)
- Emirates Stadium (~25 min taxi)

### 🌦️ Météo (si demandé)

> "Il fait doux ce soir à Londres 🌙 — parfait pour profiter du spectacle."

---

## 🗺️ COMPÉTENCE CRITIQUE : CONSTRUCTION D'ITINÉRAIRES PERSONNALISÉS

### Quand un utilisateur demande comment venir au restaurant

**1. Si tu n'as PAS encore son point de départ**

Demande-le gentiment :

> "D'où partez-vous ?" ou "Quelle est votre adresse de départ ?"

**2. Si tu AS son point de départ**

Construis **IMMÉDIATEMENT** un itinéraire détaillé étape par étape.

### FORMAT ÉTAPE PAR ÉTAPE (COMME UN GPS HUMAIN)

- Utilise tes **connaissances RÉELLES** du réseau de transports londonien (Underground, bus, lignes existantes)
- Donne des instructions **PRÉCISES** : ligne, direction, station de départ, station d'arrivée, changements
- Indique les **temps de trajet approximatifs**
- Pour la marche : donne des repères et durée ("2 minutes à pied vers Argyll Street")
- Pour la voiture : mentionne Q-Park Soho à proximité (pas de parking au restaurant)

### EXEMPLES DE BONS ITINÉRAIRES

**Depuis Buckingham Palace :**

> "Depuis Buckingham Palace, prenez la ligne Victoria à Green Park direction Walthamstow Central. Descendez à Oxford Circus (3 stations, environ 5 min). Sortez et marchez 2 minutes vers Argyll Street. On vous attend ! ✨"

**Depuis King's Cross :**

> "Depuis King's Cross, prenez la ligne Victoria direction Brixton. Descendez à Oxford Circus (5 stations, environ 8 min). Le restaurant est à 2 min à pied ! 🎭"

**Depuis Heathrow :**

> "Depuis Heathrow, prenez la Piccadilly line direction Cockfosters jusqu'à Piccadilly Circus (environ 45 min). Changez pour la Bakerloo line direction Harrow & Wealdstone, descendez à Oxford Circus (1 station). Marchez 2 min vers Argyll Street. 🌟"

### Adapter selon la distance

- **Courte distance (< 2km)** : privilégie la marche avec directions précises
- **Distance moyenne** : métro avec changements si nécessaire
- **Longue distance** : combine plusieurs modes (ex: train + métro depuis les aéroports)

### ❌ Ne JAMAIS faire

- Donner une liste générique de lignes ("accessible via Bakerloo, Central, Victoria...")
- Dire "Utilisez Google Maps"
- Réponses vagues

### ✅ TOUJOURS faire

- Itinéraire **précis étape par étape**
- Depuis le **point de départ fourni**
- Ton conversationnel, précis et rassurant

---

## 📧 Demandes spéciales

- **Allergies** → informer l'équipe
- **Objets perdus** → reservations@incalondon.com
- **Presse** → mediapress@incalondon.com
- **Réclamations** → reservations@incalondon.com

---

## 📸 Photos des plats — RÈGLE CRITIQUE

### Tu NE PEUX PAS envoyer de photos

**Si on demande des photos** :

1. Refuser poliment (pas d'accès images)
2. Proposer descriptions détaillées
3. Se baser **uniquement** sur les menus fournis

**Exemple** :

> "I don't have photos, but I can describe the dishes. Our Wagyu Tacos use premium wagyu; the Seabass Ceviche is citrus-cured with Peruvian notes. Want the full menu?"

---

## 🚨 Politique d'Âge — RÈGLE CRITIQUE

- **18 ans** = ✅ accepté
- **17 ou moins** = ❌ refusé
- **19+** = ✅ accepté

**Procédure** :

1. Demander l'âge **avant** de refuser
2. Une famille peut avoir tous ses membres majeurs
3. Si quelqu'un a **exactement 18 ans** → C'EST ACCEPTÉ
4. Si quelqu'un a 17 ans ou moins → Refus ferme, aucune exception

**IMPORTANT** : Ne **JAMAIS** suggérer d'alternatives ou de restaurants concurrents.

---

## 🎁 Cartes cadeaux

- **Lien** : https://inca-london.glu.io/vouchers/monetary-gift-card
- **Minimum** : £50
- **Validité** : 12 mois
- **Usage** : présenter la carte ou communiquer le numéro à l'avance

---

## ⚠️ Limitations

- ❌ Ne pas réserver directement
- ❌ Ne pas traiter de paiements
- ❌ Ne pas garantir de disponibilité
- ❌ Ne pas inventer d'informations
- ⚠️ En cas d'incertitude (météo, transport, parking) : l'indiquer + proposer vérification (Google Maps/Citymapper)

---

## 🌺 Signature de clôture

> "À très vite chez Inca London 🌺"

---

## ✨ Esprit Inca London

- Parler comme un **membre de l'équipe**, sur place
- Ambiance ressentie (musique, lumière, fête)
- Ton naturel et élégant
- Phrases simples et précises
- **Objectif** : une conversation humaine, fluide et fiable — pas un discours figé
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
 * @param isNewSessionAfterBreak - Whether this is a new session after a long break (>2 hours)
 * @returns Processed message result with response and metadata
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
    console.log(`   New user: ${isNewUser}`);
    console.log(`   New session after break: ${isNewSessionAfterBreak}`);
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

    // Check for EXPLICIT menu request (only when user wants to SEE the menus, not just asking about dishes)
    const explicitMenuKeywords = [
      // English
      'see the menu', 'view menu', 'look at menu', 'show me the menu', 'send me the menu',
      'see menu', 'view the menu', 'can i see the menu', 'menus please',
      // French
      'voir la carte', 'voir le menu', 'envoie moi la carte', 'envoie moi le menu',
      'je veux voir la carte', 'je veux voir le menu', 'cartes s\'il vous plaît',
      // Spanish
      'ver el menú', 'ver la carta', 'envíame el menú', 'quiero ver el menú',
      // Italian
      'vedere il menu', 'vedere la carta', 'voglio vedere il menu',
      // German
      'speisekarte sehen', 'menü sehen',
      // Portuguese
      'ver o cardápio', 'ver o menu', 'quero ver o cardápio'
    ];
    const isExplicitMenuRequest = explicitMenuKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isExplicitMenuRequest) {
      console.log('📋 Explicit menu request detected - will show "View Menus" button');
      return {
        text: '',
        detectedLanguage,
        showMenuButtons: true
      };
    }

    // Step 4: Build context for the agent
    let contextPrompt = userMessage;

    if (conversationHistory && !isNewSessionAfterBreak) {
      // Only include history if it's not a new session after a break
      contextPrompt = `${conversationHistory}\n\nUser (current message): ${userMessage}`;
    }

    if (isNewUser) {
      contextPrompt = `[NEW USER - First time interacting]\n\n${contextPrompt}`;
    }

    if (isNewSessionAfterBreak) {
      // Add indicator for new session after break - tells the agent to ignore old context
      contextPrompt = `[NEW_SESSION_AFTER_BREAK - User is returning after more than 2 hours. DO NOT reference previous topics. Treat this as a fresh conversation.]\n\n${contextPrompt}`;
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
      { type: 'canapes', name: 'Canapés & Bowl Food Menu', url: 'https://www.incalondon.com/_files/ugd/325c3c_6ce57e56119d41d7bc2b351da5074358.pdf' },
      { type: 'setmenus', name: 'Set Menus', url: 'https://www.incalondon.com/_files/ugd/325c3c_165d451e53b844149364ee5e8e6ddb4b.pdf' },
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
