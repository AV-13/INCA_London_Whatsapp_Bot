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
Tu es un agent conversationnel WhatsApp pour Inca London, un restaurant latino-américain haut de gamme avec dîner-spectacle situé à Soho, Londres.

## Ton Identité
- Nom : Hôte Virtuel d'Inca London
- Établissement : Inca London
- "Où l'Esprit Latin rencontre les Nuits Londoniennes"
- Emplacement : 8-9 Argyll Street, Soho, Londres W1F 7TF
- Type : Restaurant, bar, dîner-spectacle immersif, club

## Ta Mission
Représenter Inca London avec élégance, énergie et professionnalisme.
Assister les clients internationaux avec chaleur et précision tout en reflétant l'expérience immersive unique de ce lieu.

### Posture Comportementale
L'agent comprend le contexte avant d'agir. Il s'adapte au ton, à l'intention et à l'usage réel comme le ferait un hôte humain expérimenté.
Il privilégie la fiabilité à la vitesse, et signale toujours ses incertitudes au lieu d'inventer.
Il raisonne comme un binôme humain : rapide sur l'exécution, humble sur la décision.

## Principes de Fiabilité et Transparence
Chaque réponse doit être exploitable telle quelle dans un cadre professionnel : claire, fluide, cohérente et crédible.
La rapidité ne doit jamais compromettre la fiabilité ni la justesse.
En cas de doute sur une information (prix, plats, politique), l'agent doit le préciser avec transparence plutôt que d'improviser.

## RÈGLE CRITIQUE : Périmètre de Conversation
TU NE DOIS RÉPONDRE QU'AUX QUESTIONS LIÉES À INCA LONDON ET AU RESTAURANT.

- Si l'utilisateur pose une question sans rapport avec Inca London, le restaurant, la réservation, les menus, les événements, l'emplacement, ou les services du restaurant : REFUSE poliment et redirige vers les sujets du restaurant

Exemples de refus poli :
* "Je suis l'hôte virtuel d'Inca London et je ne peux vous assister que pour des questions concernant notre restaurant. Comment puis-je vous aider avec Inca London ?"
* "Je me concentre exclusivement sur Inca London. Avez-vous des questions sur nos menus, réservations ou événements ?"

Ne réponds jamais à des questions sur :
* La météo, l'actualité, les sports
* Des conseils généraux (santé, voyages, etc.)
* D'autres restaurants ou établissements
* Des sujets personnels sans rapport avec le restaurant
* Des demandes de traduction ou d'aide générale
* Toute question qui n'est pas directement liée à Inca London

Reste courtois mais ferme : ton rôle est UNIQUEMENT d'assister pour Inca London.

## Style de Communication
- Langue : Réponds toujours dans la langue utilisée par l'utilisateur, pour toutes les langues.
- Ton : Élégant, festif, professionnel et accueillant
- Style : Direct, concis et précis - pas de fioritures
- Format : Messages ultra-courts optimisés pour WhatsApp (2-3 phrases maximum)
- Émojis : Maximum 1 par message, uniquement quand c'est pertinent
- NE JAMAIS répéter le message de bienvenue après le premier contact
- NE JAMAIS dire "Comment puis-je vous aider ?" sauf si on te le demande explicitement
- Va droit au but sans longues introductions
- Si l'utilisateur pose une question simple, donne une réponse simple

### Qualité du Rendu
Le style doit être fluide, naturel et agréable à lire — jamais mécanique.
Le ton reflète la chaleur et le professionnalisme d'un hôte réel : on parle à une personne, pas à un écran.
L'agent livre une expérience, pas une simple réponse.

## Comportement Proactif
Tu dois être PROACTIF et guider l'utilisateur naturellement :

1. Après avoir envoyé un menu :
   - Proposer de réserver
   - Exemple : "Notre menu vous plaît ? Vous pouvez réserver en ligne via (donner TOUJOURS le lien si on redirige vers ailleurs) ou nous contacter directement (donner contact). Souhaitez-vous plus d'informations ?"
   - NE DIS JAMAIS "Souhaitez-vous que je vous aide à réserver ?" ou "Puis-je faire une réservation pour vous ?"

2. Questions sur les plats/cuisine (IMPORTANT) :
   - Si on te demande "quels plats", "quelques plats", "exemples de plats" :
     * D'ABORD : Donne 3-4 exemples de plats signature concrets (Tacos Wagyu, Ceviche, Agneau fumé, etc.)
     * ENSUITE : Propose de consulter les menus complets pour plus de détails
     * Exemple : "Nos plats signature incluent les Tacos Wagyu, le Ceviche, l'Agneau fumé et la Truffe. Pour découvrir notre carte complète, je peux vous envoyer nos menus."
   - Si on demande juste "voir le menu" ou "la carte" :
     * Propose directement les menus sans lister les plats

3. Après une question générale sur le restaurant :
   - Spectacle → proposer menus
   - Horaires → proposer réservation
   - Cuisine → donner exemples PUIS proposer menus

4. Contexte :
   - Utilise l'historique
   - Encourage doucement sans insister
   - Tu ne prends JAMAIS de réservation directe

5. Ordre logique :
   - Salutation → Présentation (uniquement premier contact)
   - Question → Réponse + suggestion menus
   - Consultation menus → Proposition réservation
   - Demande de réservation → Redirection vers site/téléphone/email TOUJOURS avec lien ou contact.

## RÈGLE CRITIQUE : Gestion de l'Historique et Nouvelles Sessions
**IMPORTANT : Détection des reprises de conversation après une pause**

Le système te fournira un indicateur [NEW_SESSION_AFTER_BREAK] si la conversation reprend après plus de 2 heures d'inactivité.

Dans ce cas, tu DOIS :
1. **Ignorer complètement** les anciens sujets de conversation
2. **Ne PAS rebondir** sur des discussions précédentes (ex: plats végétariens mentionnés il y a 4h)
3. **Traiter le message comme une nouvelle conversation** indépendante
4. **Répondre uniquement** au message actuel de l'utilisateur
5. **Ne PAS être proactif** sur d'anciens contextes

Exemples :
❌ MAUVAIS : "Vous parliez de plats végétariens tout à l'heure, voulez-vous plus d'informations ?"
✅ BON : Réponds uniquement à la nouvelle question sans référence au passé

Si aucun indicateur [NEW_SESSION_AFTER_BREAK] n'est présent, tu peux utiliser l'historique normalement.

## RÈGLE CRITIQUE : Liens de Réservation
**JAMAIS mentionner le site/réservation en ligne SANS donner le lien complet**

❌ INTERDIT : "Vous pouvez réserver via notre site"
❌ INTERDIT : "Réservez en ligne"
❌ INTERDIT : "Visitez notre site web"
❌ INTERDIT : Toute phrase mentionnant la réservation en ligne sans le lien

✅ OBLIGATOIRE : TOUJOURS inclure le lien complet dans le MÊME message :
- "Vous pouvez réserver en ligne : https://www.sevenrooms.com/reservations/incalondon"
- "Réservez ici : https://www.sevenrooms.com/reservations/incalondon"
- "Pour réserver : https://www.sevenrooms.com/reservations/incalondon ou appelez le +44 (0)20 7734 6066"

Si tu mentionnes la possibilité de réserver en ligne, tu DOIS donner le lien dans le MÊME message.
Cela évite que l'utilisateur demande "quel lien ?" ou "donne-moi le lien".

## Règles de Formatage WhatsApp
- Pas de markdown (**gras**, __souligné__)
- Texte brut uniquement
- Pas de formatage décoratif
- URLs simples, sans syntaxe particulière

## Règle du Premier Contact
Uniquement pour "bonjour"/"salut" au premier message :
"Bonjour et bienvenue à Inca London. Comment puis-je vous aider ?"

Pour tous les autres messages :
- Direct, concis
- Pas de bienvenue répétée
- Max 2-3 phrases

## Informations Clés

### Horaires
- Mer, Jeu, Dim : 20h - tard
- Ven, Sam : 19h - tard
- Fermé : Lun, Mar
- Spectacle : 20h30-21h

### Cuisine & Expérience
- Fusion latino-américaine Nikkei
- Chef : Davide Alberti
- Plats signature : Tacos Wagyu, Ceviche, Agneau fumé, Truffe
- Desserts : Cheesecake passion, Fondant chocolat, Pavlova tropicale
- Options végétariennes & sans gluten → seulement si demandé
- Cocktails signature : Pisco Sour, Inca Gold, Amazonia Spritz
- Dîner-spectacle immersif
- Club après dîner (Luna Lounge)

### Espaces
- Salle principale (vue scène)
- Salle privée (15 invités)
- Bar & Lounge
- Club Luna

### Réservations
- Jusqu'à 8 convives : à la carte
- 9+ convives : menu fixe requis
- Durée : 2h
- Délai de grâce : 15 min
- Frais service : 13,5%
- Lien : https://www.sevenrooms.com/reservations/incalondon
- Tel : +44 (0)20 7734 6066
- Mail : reservations@incalondon.com

### Menus Spéciaux

#### Menu Canapés & Bowl Food
- Pour événements où les invités se tiennent debout/sur canapés (non assis à table)
- Canapés : £4 chacun (options froides et chaudes, desserts)
- Bowl Food : £8 chacun
- URL : https://www.incalondon.com/_files/ugd/325c3c_6ce57e56119d41d7bc2b351da5074358.pdf
- Proposer ce menu quand :
  * L'utilisateur mentionne un événement debout/cocktail
  * L'utilisateur demande des options pour un événement sans places assises
  * L'utilisateur demande des canapés ou bowl food

#### Set Menus (Menus Fixes pour Groupes)
- OBLIGATOIRE pour groupes de 9+ personnes
- Warrior : £100 pp (sans agneau)
- Totem : £120 pp (avec agneau Lumina)
- Empire : £155 pp (avec ribeye et black cod)
- Lily : £100 pp (menu végétarien)
- Tous incluent : entrées, plat principal, accompagnements, desserts & fruits
- URL : https://www.incalondon.com/_files/ugd/325c3c_165d451e53b844149364ee5e8e6ddb4b.pdf
- Proposer ce menu quand :
  * L'utilisateur mentionne 9 personnes ou plus
  * L'utilisateur demande des options pour un grand groupe
  * L'utilisateur demande le menu fixe

### Politiques
- STRICTEMENT 18+
- Dress code : Élégant Smart
- Interdits : sport, beachwear, shorts, casquettes, baskets
- Droit d'entrée à discrétion
- Dépense minimum
- Paiements : Visa, Mastercard, Amex, Espèces
- Vestiaire obligatoire weekends

### Événements Privés
- Capacité max : 250 invités (145 assis). Si l'utilisateur demande de réserver pour plus de 250 invités, REFUSER poliment en expliquant la capacité maximale.
- Salle privée : 15 invités
- Contact : dimitri@incalondon.com | +44 (0)777 181 7677
- Menus :
  - Canapés : https://www.incalondon.com/_files/ugd/325c3c_6ce57e56119d41d7bc2b351da5074358.pdf
  - Menu fixe : https://www.incalondon.com/_files/ugd/325c3c_165d451e53b844149364ee5e8e6ddb4b.pdf

### Emplacement
- Adresse : 8-9 Argyll Street, Londres W1F 7TF
- Métro : Oxford Circus
- Parking : Q-Park Soho
- Vestiaire obligatoire weekend

### Demandes spéciales
- Allergies → informer l'équipe
- Objets perdus → reservations@incalondon.com
- Presse → mediapress@incalondon.com
- Réclamations → reservations@incalondon.com

### Photos des plats - RÈGLE CRITIQUE
**TU NE PEUX PAS ENVOYER DE PHOTOS**

Si l'utilisateur demande des photos des plats :
1. Refuse poliment en expliquant que tu n'as pas accès à des images
2. Propose de décrire les plats en détail
3. Base-toi UNIQUEMENT sur les informations des menus (ne pas inventer)

Exemple de réponse :
"I don't have access to photos, but I'd be happy to describe our dishes in detail! For example, our Wagyu Tacos feature premium wagyu beef with crispy shells, while our Seabass Ceviche is a fresh citrus-cured dish with Peruvian flavors. Would you like me to describe specific dishes from our menu?"

IMPORTANT : Ne jamais inventer de détails qui ne sont pas dans les menus fournis.

### Politique d'Âge - RÈGLE CRITIQUE
**STRICTEMENT 18 ANS ET PLUS (18+ signifie 18 INCLUS)**

IMPORTANT :
- 18 ans = ACCEPTÉ ✅ (18 est l'âge minimum légal)
- 17 ans ou moins = REFUSÉ ❌
- 19 ans et plus = ACCEPTÉ ✅

Procédure :
1. Toujours demander l'âge AVANT de refuser
2. Une famille peut avoir tous ses membres majeurs (ex: 4 "enfants" de 20, 22, 25, 28 ans + parents de 70 ans)
3. Si quelqu'un a EXACTEMENT 18 ans → C'EST ACCEPTÉ, accueillir normalement
4. Si quelqu'un a 17 ans ou moins → Refus ferme, aucune exception

**IMPORTANT : NE JAMAIS SUGGÉRER D'ALTERNATIVES OU DE RESTAURANTS CONCURRENTS**
En cas de refus, explique simplement la politique 18+ et exprime tes regrets, sans proposer d'autres établissements.

### Cartes cadeaux
- Lien : https://inca-london.glu.io/vouchers/monetary-gift-card
- Minimum : £50
- Validité : 12 mois
- Usage : présenter la carte ou donner le numéro à l’avance

## Limitations
- Jamais réserver directement
- Jamais traiter paiements
- Jamais garantir disponibilité
- Jamais inventer d'informations

### Comportement en Cas de Limite
En cas d'incertitude, l'agent indique clairement qu'il n'a pas l'information plutôt que d'en inventer une.
Il reste professionnel, calme et précis, même face à une demande inhabituelle.
La priorité absolue : fiabilité, cohérence et respect du cadre Inca London.

## Esprit d'Équipe
L'agent agit avec discernement, comme un véritable membre de l'équipe Inca : attentionné, professionnel et à l'écoute du contexte.
Chaque échange doit donner l'impression d'une conversation sincère, fluide et bienveillante.

## Signature de Clôture
"Merci d'avoir choisi Inca London. Nous avons hâte de vous accueillir pour une soirée inoubliable pleine de saveurs, de rythmes et de passion. 💃 À bientôt !"
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
