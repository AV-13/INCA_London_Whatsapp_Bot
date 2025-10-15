/**
 * Message handler with intent detection for Inca London bot
 * Analyzes user messages and provides appropriate responses
 */

import { RESPONSES } from './responses';

export interface IntentResult {
  intent: string;
  confidence: number;
  response: string;
  menuType?: 'alacarte' | 'wagyu' | 'wine' | 'drinks' | 'all';
}

/**
 * Analyzes user message and determines intent
 */
export function detectIntent(message: string): IntentResult {
  const normalizedMessage = message.toLowerCase().trim();

  // Intent patterns with keywords
  const intentPatterns = {
    // Reservations
    reservation: [
      'book', 'booking', 'reserve', 'reservation', 'table',
      'availability', 'available', 'seats', 'party of'
    ],

    // Specific menu requests
    menuWine: [
      'wine menu', 'wine list', 'wines', 'vin', 'carta de vinos'
    ],

    menuWagyu: [
      'wagyu menu', 'wagyu platter', 'wagyu', 'beef menu'
    ],

    menuAlaCarte: [
      'a la carte', 'alacarte', 'food menu', 'dinner menu', 'dining menu', 'main menu'
    ],

    menuDrinks: [
      'drinks menu', 'cocktail menu', 'bar menu', 'drink list', 'cocktails'
    ],

    // General menu (will also check for specific menu keywords)
    menu: [
      'menu', 'food', 'dish', 'cuisine', 'eat', 'dishes',
      'signature', 'specialties', 'chef', 'cooking'
    ],

    // Drinks
    drinks: [
      'drink', 'cocktail', 'bar', 'pisco', 'alcohol',
      'beverage', 'spirits'
    ],

    // Dietary requirements
    dietary: [
      'vegetarian', 'vegan', 'gluten', 'allergy', 'allergies',
      'dietary', 'celiac', 'intolerant', 'halal', 'kosher'
    ],

    // Show and entertainment
    show: [
      'show', 'performance', 'entertainment', 'dancer', 'music',
      'live', 'spectacle', 'performers', 'stage'
    ],

    // Club
    club: [
      'club', 'dj', 'dancing', 'party', 'late night', 'luna',
      'nightclub', 'dance floor'
    ],

    // Dress code
    dressCode: [
      'dress', 'attire', 'wear', 'outfit', 'clothes', 'dress code',
      'sneakers', 'formal', 'smart', 'casual'
    ],

    // Age policy
    age: [
      'age', 'old', 'years', 'id', 'minor', 'under 18', 'kids',
      'children'
    ],

    // Location
    location: [
      'where', 'address', 'location', 'find', 'directions',
      'tube', 'metro', 'parking', 'map'
    ],

    // Hours
    hours: [
      'hours', 'open', 'opening', 'close', 'closing', 'when',
      'time', 'schedule', 'monday', 'tuesday', 'wednesday',
      'thursday', 'friday', 'saturday', 'sunday'
    ],

    // Private events
    privateEvents: [
      'private', 'event', 'corporate', 'birthday', 'party',
      'group', 'celebration', 'hire', 'venue hire'
    ],

    // Payment
    payment: [
      'pay', 'payment', 'card', 'cash', 'bill', 'split',
      'amex', 'visa', 'mastercard', 'service charge'
    ],

    // Contact
    contact: [
      'contact', 'phone', 'email', 'call', 'reach',
      'get in touch', 'speak to'
    ],

    // Social media
    social: [
      'instagram', 'facebook', 'social', 'follow', 'tag',
      'website', 'online'
    ],

    // Lost items
    lostItems: [
      'lost', 'left behind', 'forgot', 'missing', 'found'
    ],

    // Complaints
    complaints: [
      'complaint', 'issue', 'problem', 'refund', 'disappointed',
      'unhappy', 'manager', 'management'
    ],

    // Media
    media: [
      'press', 'media', 'journalist', 'interview', 'collaboration',
      'partnership'
    ],

    // Greeting
    greeting: [
      'hello', 'hi', 'hey', 'good morning', 'good evening',
      'good afternoon', 'greetings', 'hola', 'bonjour'
    ],

    // Thanks
    thanks: [
      'thank', 'thanks', 'appreciate', 'grateful', 'cheers'
    ],

    // Goodbye
    goodbye: [
      'bye', 'goodbye', 'see you', 'later', 'farewell', 'ciao'
    ],
  };

  // Check for exact matches first
  let bestMatch: { intent: string; confidence: number } = {
    intent: 'notUnderstood',
    confidence: 0,
  };

  for (const [intent, keywords] of Object.entries(intentPatterns)) {
    const matchCount = keywords.filter(keyword =>
      normalizedMessage.includes(keyword)
    ).length;

    if (matchCount > 0) {
      const confidence = matchCount / keywords.length;
      if (confidence > bestMatch.confidence) {
        bestMatch = { intent, confidence };
      }
    }
  }

  // Get appropriate response based on intent
  const { response, menuType } = getResponseForIntent(bestMatch.intent);

  return {
    intent: bestMatch.intent,
    confidence: bestMatch.confidence,
    response,
    menuType,
  };
}

/**
 * Returns the appropriate response for a given intent
 */
function getResponseForIntent(intent: string): { response: string; menuType?: 'alacarte' | 'wagyu' | 'wine' | 'drinks' | 'all' } {
  switch (intent) {
    case 'reservation':
      return { response: RESPONSES.reservations.howToBook };

    case 'menuWine':
      return { response: RESPONSES.menu.wineMenu, menuType: 'wine' };

    case 'menuWagyu':
      return { response: RESPONSES.menu.wagyu, menuType: 'wagyu' };

    case 'menuAlaCarte':
      return { response: RESPONSES.menu.alacarte, menuType: 'alacarte' };

    case 'menuDrinks':
      return { response: RESPONSES.menu.drinksMenu, menuType: 'drinks' };

    case 'menu':
      return { response: RESPONSES.menu.overview };

    case 'drinks':
      return { response: RESPONSES.menu.drinks };

    case 'dietary':
      return { response: RESPONSES.menu.dietary };

    case 'show':
      return { response: RESPONSES.experience.show };

    case 'club':
      return { response: RESPONSES.experience.club };

    case 'dressCode':
      return { response: RESPONSES.entry.dressCode };

    case 'age':
      return { response: RESPONSES.entry.agePolicy };

    case 'location':
      return { response: RESPONSES.location.address };

    case 'hours':
      return { response: RESPONSES.hours.schedule };

    case 'privateEvents':
      return { response: RESPONSES.privateEvents.overview };

    case 'payment':
      return { response: RESPONSES.payment.methods };

    case 'contact':
      return { response: RESPONSES.contact.details };

    case 'social':
      return { response: RESPONSES.contact.social };

    case 'lostItems':
      return { response: RESPONSES.special.lostItems };

    case 'complaints':
      return { response: RESPONSES.special.complaints };

    case 'media':
      return { response: RESPONSES.special.mediaPress };

    case 'greeting':
      return { response: RESPONSES.welcome };

    case 'thanks':
      return { response: RESPONSES.generic.thankYou };

    case 'goodbye':
      return { response: RESPONSES.generic.goodbye };

    default:
      return { response: RESPONSES.generic.notUnderstood };
  }
}

/**
 * Handles follow-up questions based on conversation context
 */
export function handleFollowUp(message: string, previousIntent?: string): string {
  const normalizedMessage = message.toLowerCase().trim();

  // Handle yes/no responses
  if (['yes', 'yeah', 'sure', 'ok', 'please', 'yep', 'definitely'].includes(normalizedMessage)) {
    if (previousIntent === 'club') {
      return `To book a club table, please contact us:

📞 ${RESPONSES.contact.details}

Our team will arrange the perfect spot for your night!`;
    }
    return RESPONSES.generic.notUnderstood;
  }

  // Handle number of guests
  const guestMatch = normalizedMessage.match(/(\d+)\s*(people|guests|persons|pax)?/);
  if (guestMatch) {
    const guestCount = parseInt(guestMatch[1]);
    if (guestCount >= 9) {
      return RESPONSES.reservations.largeGroup;
    } else {
      return RESPONSES.reservations.howToBook;
    }
  }

  // Default to intent detection
  const intentResult = detectIntent(message);
  return intentResult.response;
}

/**
 * Checks if message is from a first-time user (simple heuristic)
 */
export function isFirstTimeMessage(message: string): boolean {
  const greetingPatterns = [
    'hello', 'hi', 'hey', 'good morning', 'good evening',
    'good afternoon', 'greetings', 'hola', 'bonjour'
  ];

  const normalizedMessage = message.toLowerCase().trim();
  return greetingPatterns.some(pattern =>
    normalizedMessage.startsWith(pattern) || normalizedMessage === pattern
  );
}