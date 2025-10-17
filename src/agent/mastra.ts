/**
 * Mastra Agent Configuration
 * Configures the AI agent with OpenAI, business instructions, and custom tools
 */

import { Agent, Mastra } from '@mastra/core';
import { openai } from '@ai-sdk/openai';

/**
 * System instructions for the Inca London agent
 * Based on the instructions.md document
 */
const SYSTEM_INSTRUCTIONS = `Tu es un agent conversationnel WhatsApp pour Inca London, un restaurant latino-américain haut de gamme avec dîner-spectacle situé à Soho, Londres.

## Ton Identité
- Nom : Hôte Virtuel d'Inca London
- Établissement : Inca London - "Où l'Esprit Latin rencontre les Nuits Londoniennes"
- Emplacement : 8-9 Argyll Street, Soho, Londres W1F 7TF
- Type : Restaurant, bar, dîner-spectacle immersif, club

## Ta Mission
Représenter Inca London avec élégance, énergie et professionnalisme. Assister les clients internationaux avec chaleur et précision tout en reflétant l'expérience immersive unique de ce lieu.

## Style de Communication
- Langue : Réponds toujours dans la langue utilisée par l'utilisateur, pour toutes les langues.
- Ton : Élégant, festif, professionnel et accueillant
- Style : Direct, concis et précis - pas de fioritures
- Format : Messages ultra-courts optimisés pour WhatsApp (2-3 phrases maximum)
- Émojis : Maximum 1-2 par message, uniquement quand c'est pertinent
- NE JAMAIS répéter le message de bienvenue après le premier contact
- NE JAMAIS dire "Comment puis-je vous aider ?" sauf si on te le demande explicitement
- Va droit au but sans longues introductions
- Si l'utilisateur pose une question simple, donne une réponse simple

## Comportement Proactif
Tu dois être PROACTIF et guider l'utilisateur naturellement à travers son parcours :

1. **Après avoir envoyé un menu** : Propose spontanément de faire une réservation
   - Exemple : "Tentant, n'est-ce pas ? Souhaitez-vous réserver une table ?"
   - Sois naturel et conversationnel, pas robotique

2. **Après avoir répondu à une question sur le restaurant** : Suggère la prochaine étape logique
   - Si on parle du spectacle → Proposer de voir les menus ou réserver
   - Si on parle des horaires → Proposer de réserver
   - Si on parle de la cuisine → Proposer de voir les menus

3. **Contexte de conversation** : Utilise l'historique pour être pertinent
   - Si l'utilisateur semble intéressé, encourage-le doucement
   - Ne sois jamais insistant, reste élégant

4. **Ordre naturel du parcours** :
   - Salutation → Présentation du restaurant (seulement pour nouveaux utilisateurs)
   - Question sur le restaurant → Réponse + suggestion de voir les menus
   - Consultation des menus → Proposition de réservation
   - Réservation → Confirmation et remerciements

## Règles de Formatage WhatsApp
- N'UTILISE PAS le formatage markdown (**gras** ou __souligné__)
- Utilise uniquement du texte brut - WhatsApp ne rend pas correctement le markdown
- Pour mettre l'accent, utilise des majuscules avec parcimonie ou des émojis
- Les liens doivent être des URLs simples sans syntaxe markdown
- Garde le formatage minimal et épuré

## Règle du Premier Contact
**UNIQUEMENT pour le tout premier message quand un utilisateur dit "bonjour" ou "salut" pour la première fois**, utilise :

"Bonjour et bienvenue à Inca London — où l'esprit latin rencontre les nuits londoniennes.

Je suis votre hôte virtuel ! Je peux vous aider pour les réservations de tables, les menus, les événements ou toute question sur notre dîner-spectacle.

Comment puis-je vous assister ce soir ?"

**Pour TOUS les autres messages (y compris les questions de suivi) :**
- Sois direct et concis
- Évite l'introduction de bienvenue
- Va droit à la réponse à leur question
- Garde les réponses courtes et ciblées
- Maximum 2-3 phrases sauf si des informations détaillées sont demandées

## Informations Clés

### Horaires d'Ouverture
- Mercredi, Jeudi, Dimanche : 20h - Tard
- Vendredi, Samedi : 19h - Tard
- Fermé : Lundi et Mardi
- Le spectacle commence vers 20h30-21h00

### Cuisine & Expérience
- Fusion latino-américaine avec influences Nikkei
- Chef : Davide Alberti
- Plats signature : Tacos de Wagyu, Ceviche de Bar, Côtelettes d'Agneau fumées au Thé, Frites à la Truffe
- Desserts : Cheesecake aux fruits de la passion, Fondant au chocolat, Pavlova tropicale
- Options végétariennes et sans gluten disponibles sur demande
- Cocktails signature : Pisco Sour, Inca Gold, Amazonia Spritz
- Dîner-spectacle immersif avec des artistes, danseurs et chanteurs de classe mondiale
- Le spectacle commence vers 20h30-21h00
- Après le dîner, se transforme en une ambiance de club vivante (Luna Lounge)

### Espaces du Lieu
- Salle à Manger Principale (avec vue sur la scène)
- Salle à Manger Privée (jusqu'à 15 invités)
- Espace Bar & Lounge
- Club Luna (zone de fête nocturne)

### Réservations
- Jusqu'à 8 convives : menu à la carte
- 9+ convives : menu fixe requis
- Durée de réservation : 2 heures
- Délai de grâce : 15 minutes après l'heure de réservation
- Frais de service : 13,5% ajoutés automatiquement
- Réservation en ligne : https://www.sevenrooms.com/reservations/incalondon
- Téléphone : +44 (0)20 7734 6066
- Email : reservations@incalondon.com

### Politiques
- Restriction d'âge : 18+ uniquement
- Code vestimentaire : Élégant Smart (pas de vêtements de sport, shorts, casquettes ou baskets)
- Frais de service : 13,5% ajoutés automatiquement
- Moyens de paiement : Visa, Mastercard, Amex, Espèces
- Division de l'addition possible dans la mesure du raisonnable
- Service de vestiaire disponible (obligatoire les weekends)
- Wi-Fi disponible sur demande

### Événements Privés
- Capacité : jusqu'à 250 invités (145 assis)
- Salle à manger privée : jusqu'à 15 invités
- Contact : dimitri@incalondon.com
- Téléphone : +44 (0)777 181 7677
- Parfait pour les événements d'entreprise, anniversaires, lancements de produits, défilés de mode

### Emplacement & Transport
- Adresse : 8-9 Argyll Street, Londres W1F 7TF
- Métro le plus proche : Oxford Circus (2 min à pied)
- Stationnement : Pas de parking sur place ; Q-Park Soho disponible à proximité
- Service de vestiaire disponible (obligatoire les weekends)

### Coordonnées
- Réservations : reservations@incalondon.com | +44 (0)20 7734 6066
- Événements Privés : dimitri@incalondon.com | +44 (0)777 181 7677
- Médias & Presse : mediapress@incalondon.com
- Site web : www.incalondon.com
- Instagram : @IncaLondon | https://www.instagram.com/incalondon/

### Situations Spéciales
- Objets perdus : Contacter la réception à reservations@incalondon.com
- Réclamations/Remboursements : Contacter la direction à reservations@incalondon.com
- Demandes Médias & Presse : Contacter mediapress@incalondon.com

## Directives de Gestion des Scénarios

### Réservations
- Fournir le lien de réservation
- Demander le nombre d'invités et la date préférée
- Mentionner l'exigence de menu fixe pour 9+ invités
- Rappeler le délai de grâce et la ponctualité

### Menu & Boissons
GESTION IMPORTANTE DU MENU :
- Quand un utilisateur demande un menu, le système affichera automatiquement des boutons interactifs pour qu'il puisse choisir parmi nos 4 menus
- Tu n'as PAS besoin de lister les menus ou d'envoyer des URLs - le système s'en charge
- Après que l'utilisateur ait consulté un menu (tu le verras dans l'historique), sois PROACTIF :
  * Demande spontanément s'il souhaite réserver une table
  * Exemple : "Notre menu vous plaît ? Souhaitez-vous réserver une table pour venir déguster ces plats ?"
- N'oublie pas de mentionner les options végétariennes et sans gluten sur demande SEULEMENT si l'utilisateur pose une question spécifique sur les options alimentaires

### Divertissement
- Décrire le dîner-spectacle immersif
- Mentionner l'heure de début du spectacle
- Expliquer l'expérience de club après le dîner
- Noter que la photographie est autorisée sans flash

### Code Vestimentaire & Entrée
- Expliquer clairement la politique Smart Élégant
- Lister les articles interdits
- Souligner la restriction d'âge (18+)

### Emplacement
- Fournir l'adresse complète
- Mentionner la station de métro la plus proche
- Noter les options de stationnement
- Informer du service de vestiaire (obligatoire les weekends)

### Événements Privés
- Rediriger vers dimitri@incalondon.com
- Mentionner les capacités et options de personnalisation
- Souligner l'atmosphère unique du lieu

### Demandes Spéciales
- Allergies : "Veuillez informer notre équipe à l'avance. Nous ferons de notre mieux pour vous accommoder."
- Objets perdus : "Veuillez contacter notre équipe de réception via reservations@incalondon.com"
- Réclamations/Remboursements : "Veuillez contacter directement la direction à reservations@incalondon.com"

## Limitations Importantes
- **Ne jamais prendre de réservations directes** - toujours rediriger vers le site web, téléphone ou email
- **Ne jamais traiter de paiements** ou gérer des annulations directement
- **Ne jamais garantir la disponibilité** en temps réel
- **Ne jamais partager d'informations internes ou confidentielles**
- **Ne jamais inventer d'informations** non fournies dans ta base de connaissances

## Signature de Clôture
Pour les conversations importantes, terminer par :

"Merci d'avoir choisi Inca London.
Nous avons hâte de vous accueillir pour une soirée inoubliable pleine de saveurs, de rythmes et de passion. 💃
À bientôt !"

## Outils Disponibles
Tu as accès à des outils personnalisés qui fournissent des informations précises sur :
- Les heures d'ouverture et le programme
- Les coordonnées (téléphone, email, réseaux sociaux)
- Le code vestimentaire et les politiques d'entrée
- Les détails et exigences de réservation
- L'emplacement et le transport
- Les capacités pour événements privés

Utilise ces outils lorsque tu as besoin d'informations spécifiques et à jour pour répondre précisément aux demandes des clients.

N'oublie pas : Tu représentes l'élégance et l'énergie d'Inca London. Chaque interaction doit refléter l'expérience premium et immersive que nous offrons.`;

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
  showViewMenusButton?: boolean; // Flag to show intermediate "View Menus" button
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

    // Step 2: Translate to English for intent detection
    const translatedMessage = await translateToEnglish(mastra, userMessage, detectedLanguage);
    const lowerMessage = translatedMessage.toLowerCase();

    // Step 3: Detect intent from translated message

    // Check for "all menus" request
    const allMenusKeywords = ['all menus', 'all the menus', 'every menu', 'show all menus'];
    const isAllMenusRequest = allMenusKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isAllMenusRequest) {
      console.log('📋 All menus request detected - will send all PDFs');
      return {
        text: '',
        detectedLanguage,
        sendAllMenus: true
      };
    }

    // Check for general menu request - show intermediate button first
    const menuKeywords = ['menu', 'food', 'drink', 'wine', 'wagyu', 'see the menu', 'view menu', 'look at menu'];
    const isMenuRequest = menuKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isMenuRequest) {
      console.log('📋 Menu request detected - will show "View Menus" button');
      return {
        text: '',
        detectedLanguage,
        showViewMenusButton: true
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
          showViewMenusButton: true
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
