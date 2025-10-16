# Changelog - Inca London WhatsApp Bot

## [3.0.0] - 2025-10-16

### 🎉 Major Features - Complete Overhaul

#### 1. 🌍 Complete Multilingual System (AI-Powered)
- **REMOVED** Hardcoded translation dictionary (130+ lines deleted)
- **ADDED** Dynamic AI-powered translation system (`src/i18n/dynamicTranslation.ts`)
- **UPGRADED** Language support from 6 languages → Unlimited (100+ languages)
- **FIXED** Language detection for button clicks (no longer breaks context)
- **ADDED** Smart language detection from conversation history
- **REMOVED** Language caching (allows mid-conversation language switching)

#### 2. 🎤 Whisper Speech-to-Text Integration
- **ADDED** Full audio message transcription via OpenAI Whisper (`src/audio/whisper.ts`)
- **ADDED** Support for voice notes and audio files
- **ADDED** Automatic language hint for better transcription
- **ADDED** User-friendly transcription confirmation messages
- **ADDED** Automatic cleanup of temporary audio files
- **ADDED** Multilingual error handling for transcription failures

#### 3. 📍 Google Maps Location Integration
- **ADDED** Location message handling (`src/location/maps.ts`)
- **ADDED** Distance calculation using Haversine formula
- **ADDED** Google Maps directions URL generation
- **ADDED** Personalized messages based on distance
- **ADDED** Multilingual location responses
- **ADDED** Restaurant location sharing capability

### 🔄 Breaking Changes

#### webhook.ts - Complete Refactor
- **REMOVED** `TRANSLATIONS` dictionary (lines 26-123)
- **REMOVED** `translate()` function
- **REMOVED** `getMenuMessage()` function
- **REMOVED** Static language cache
- **ADDED** `detectUserLanguage()` with conversation history support
- **ADDED** Audio/voice message type handling
- **ADDED** Location message type handling
- **UPDATED** All UI generation functions to use AI
- **FIXED** Button clicks preserving user's language

#### New Message Types Supported
```typescript
// Added to WhatsAppWebhookMessage interface
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
```

### 📦 New Files Created

#### Core Modules
- `src/i18n/dynamicTranslation.ts` (243 lines)
  - `generateText()` - Generate any text in any language
  - `generateMenuMessage()` - Menu PDF accompaniment messages
  - `generatePrompt()` - Interactive button/list prompts
  - `generateReservationConfirmation()` - Booking confirmations
  - `generateErrorMessage()` - Error messages
  - `generateListLabels()` - Translate list items

- `src/audio/whisper.ts` (180 lines)
  - `processAudioMessage()` - Complete audio processing pipeline
  - `downloadAudioFile()` - Download from WhatsApp
  - `transcribeAudio()` - Whisper transcription
  - `getMediaUrl()` - Fetch media URL from ID

- `src/location/maps.ts` (165 lines)
  - `generateLocationResponse()` - Personalized location responses
  - `calculateDistance()` - Haversine distance calculation
  - `getDirectionsUrl()` - Google Maps directions
  - `getStaticMapUrl()` - Static map images (optional)
  - `getRestaurantLocationMessage()` - Share restaurant location

#### Documentation
- `MULTILINGUAL_REFACTOR.md` - Technical refactoring documentation
- `FEATURE_SUMMARY.md` - Complete feature overview
- `TESTING_GUIDE.md` - Comprehensive testing scenarios
- `CHANGELOG.md` - This file (updated)

### 🛠️ Technical Improvements

#### Language Detection
**Before:**
```typescript
// Detected from button IDs → broke language context
const lang = await detectLanguageWithMastra(mastra, 'reservation_party_2');
// Returns: 'en' (wrong!)
```

**After:**
```typescript
// Intelligent detection from conversation history
const lang = await detectUserLanguage(userId, buttonId, mastra, history);
// Finds last real text message, ignores button IDs
// Returns: 'fr' (correct!)
```

#### Audio Processing Flow
```
1. User sends voice note
2. Bot receives audio message ID
3. Fetch media URL from WhatsApp
4. Download audio file to temp directory
5. Detect user's language from history
6. Transcribe with Whisper (with language hint)
7. Send confirmation: "🎤 J'ai entendu : [text]"
8. Process transcribed text as normal message
9. Cleanup temp file
```

#### Location Processing Flow
```
1. User shares location (lat, lon)
2. Bot detects user's language
3. Calculate distance to restaurant
4. Generate personalized message based on distance
5. Create Google Maps directions URL
6. Send response with address + directions
```

### 📊 Performance Metrics

#### Language Support
- **Before**: 6 languages (hardcoded)
- **After**: Unlimited (all languages supported by AI)

#### Code Reduction
- **Removed**: 130+ lines of hardcoded translations
- **Added**: 591 lines of dynamic, reusable code

#### Message Types
- **Before**: `text`, `interactive`
- **After**: `text`, `interactive`, `audio`, `voice`, `location`

### 🔧 Configuration Changes

#### New Environment Variables
```env
# Optional - for static maps only
# Bot works WITHOUT this using public Google Maps links
GOOGLE_MAPS_API_KEY=your_api_key_here
```

#### New Dependencies
```json
{
  "openai": "^4.x.x"  // For Whisper API
}
```

### 🐛 Bug Fixes

- **FIXED** Language detection breaking on button clicks
- **FIXED** Hardcoded English fallbacks throughout codebase
- **FIXED** Limited language support (6 → unlimited)
- **FIXED** Language cache preventing mid-conversation language changes
- **FIXED** Button interactions resetting conversation language

### 🎯 Examples

#### Example 1: Multilingual Button Flow (FIXED)
```
User: "Bonjour" (French)
Bot: [Response in French]
User: "Je voudrais réserver" (French)
Bot: [Shows party size buttons in French]
User: [Clicks "2 personnes"] ← Button ID in French
Bot: [Continues in French] ← FIXED! No longer switches to English
```

#### Example 2: Voice Note Transcription
```
User: [Sends voice note in Spanish]
      "Hola, quiero hacer una reserva para cuatro personas"
Bot: "🎤 Escuché: Hola, quiero hacer una reserva para cuatro personas"
Bot: [Starts reservation flow in Spanish]
```

#### Example 3: Location Sharing
```
User: [Shares location 2.5km away]
Bot: "¡Gracias por compartir tu ubicación! Estás a 2.5km de Inca London.

      Nuestra dirección: 8-9 Argyll Street, Soho, London W1F 7TF
      Metro más cercano: Oxford Circus (2 min a pie)

      📍 Direcciones:
      https://www.google.com/maps/dir/?api=1&origin=..."
```

### 🧪 Testing

#### Compilation
- ✅ All TypeScript compilation errors resolved
- ✅ No type errors
- ✅ Build successful

#### Integration Tests Needed
- [ ] Voice note in multiple languages
- [ ] Location sharing with various distances
- [ ] Button clicks preserving language
- [ ] Mid-conversation language switching
- [ ] Error handling for failed transcriptions

### 📚 Documentation Updates

- **ADDED** `MULTILINGUAL_REFACTOR.md` - Technical deep-dive
- **ADDED** `FEATURE_SUMMARY.md` - Feature showcase
- **ADDED** `TESTING_GUIDE.md` - Test scenarios and checklists
- **UPDATED** `.env.example` - Added Google Maps API key
- **UPDATED** `CHANGELOG.md` - This comprehensive changelog

### 🚀 Migration from v2.x

No breaking changes for end users. To upgrade:

```bash
# 1. Pull latest code
git pull

# 2. Install new dependencies
npm install

# 3. Rebuild
npm run build

# 4. Optional: Add Google Maps API key to .env
# GOOGLE_MAPS_API_KEY=your_key_here

# 5. Restart server
npm start
```

### 🎉 What's Next

Potential future enhancements:
- [ ] Image recognition for food photos
- [ ] Video message support
- [ ] Real-time translation for staff communication
- [ ] Voice response generation (TTS)
- [ ] Sentiment analysis for customer satisfaction
- [ ] Advanced reservation availability checking

---

## [2.0.0] - 2025-01-16

### 🎉 Nouvelles Fonctionnalités Majeures

#### 💾 Intégration Supabase
- **Base de données persistante** : Toutes les conversations et messages sont maintenant sauvegardés dans Supabase
- **Historique conversationnel** : Mastra a accès aux messages précédents pour des réponses contextuelles
- **Détection utilisateurs nouveaux/récurrents** : Le bot adapte son message de bienvenue
- **Tracking complet** : Messages entrants/sortants, statuts de livraison et de lecture

#### 🌍 Support Multilingue Avancé
- **Détection automatique de langue** : Utilise Mastra pour détecter la langue de n'importe quel message
- **Traduction intelligente** : Traduit automatiquement vers l'anglais pour la détection d'intention
- **Réponses multilingues** : Le bot répond toujours dans la langue de l'utilisateur
- **Langues supportées** : Toutes les langues via Mastra AI (fr, en, es, de, it, pt, zh, ja, ar, etc.)

#### 📋 Nouveau Workflow de Menus
- **Bouton intermédiaire "Voir les Menus"** : Améliore l'UX avec un workflow en deux étapes
  1. Utilisateur demande un menu → Bouton "Voir les Menus"
  2. Utilisateur clique → Liste des 4 menus disponibles
- **Messages traduits** : "Voici le menu..." apparaît dans la langue de l'utilisateur
- **Dictionnaire de traductions** : Tous les messages UI sont traduits (boutons, prompts, etc.)

#### 🤖 Agent Mastra Proactif
- **Guidance naturelle** : Le bot guide spontanément l'utilisateur dans son parcours
- **Suggestions contextuelles** :
  - Après l'envoi d'un menu → Propose de réserver une table
  - Après une question sur le spectacle → Propose de voir les menus ou réserver
  - Après une question sur les horaires → Propose de réserver
- **Contextualisation avancée** : Utilise l'historique pour des réponses pertinentes

### 🏗️ Améliorations Techniques

#### Architecture
- **Nouveau module** : `src/database/supabase.ts` pour la gestion de la BDD
- **Refactorisation** : `src/agent/mastra.ts` avec détection de langue et traduction
- **Mise à jour** : `src/whatsapp/webhook.ts` avec intégration complète

#### Code Quality
- **Documentation JSDoc** : Toutes les fonctions sont documentées
- **TypeScript strict** : Types complets pour la base de données
- **Gestion d'erreurs** : Meilleure gestion des erreurs Supabase et OpenAI
- **Logs détaillés** : Logs améliorés pour le debugging

### 📊 Schéma de Base de Données

#### Table `conversations`
```sql
- id (uuid, PK)
- user_phone (text, NOT NULL)
- status (text, 'open' | 'closed')
- started_at (timestamptz)
- last_message_at (timestamptz)
```

#### Table `messages`
```sql
- id (uuid, PK)
- conversation_id (uuid, FK)
- wa_message_id (text, nullable)
- direction ('in' | 'out')
- sender ('user' | 'bot')
- message_type (text)
- text_content (text, nullable)
- created_at (timestamptz)
- delivered_at (timestamptz, nullable)
- read_at (timestamptz, nullable)
```

### 🔄 Flux Amélioré

#### Traitement des Messages
```
1. Message entrant → Webhook
2. Sauvegarde en BDD (message utilisateur)
3. Récupération historique (10 derniers messages)
4. Détection de langue (Mastra)
5. Traduction vers anglais (si nécessaire)
6. Détection d'intention
7. Génération réponse (Mastra avec contexte)
8. Sauvegarde en BDD (réponse bot)
9. Envoi réponse → WhatsApp
```

### 📝 Workflow des Menus

```
Utilisateur: "menu"
   ↓
Bot: [Bouton "Voir les Menus"] (traduit)
   ↓
Utilisateur: [Clique]
   ↓
Bot: [Liste des 4 menus] (titres traduits)
   ↓
Utilisateur: [Sélectionne "À la Carte"]
   ↓
Bot: [Envoie PDF] + "Voici le menu à la carte" (traduit)
   ↓
Bot: "Notre menu vous plaît ? Souhaitez-vous réserver ?" (proactif)
```

### 🌟 Exemples de Conversations

#### Exemple 1 : Utilisateur Français
```
Utilisateur: Bonjour
Bot: Bienvenue à Inca London — où l'esprit latin rencontre les nuits londoniennes.
     Je suis votre hôte virtuel ! Je peux vous aider pour les réservations...

Utilisateur: Je voudrais voir le menu
Bot: [Bouton "Voir les Menus"]

Utilisateur: [Clique]
Bot: Nous proposons 4 menus différents. Lequel souhaitez-vous consulter ?
     [Liste: À la Carte, Wagyu, Vins, Boissons]

Utilisateur: [Sélectionne "À la Carte"]
Bot: [PDF] "Voici le menu à la carte"
Bot: "Notre menu vous plaît ? Souhaitez-vous réserver une table ?"
```

#### Exemple 2 : Utilisateur Anglais
```
User: Hi
Bot: Welcome to Inca London — where Latin spirit meets London nights.
     I'm your virtual host! I can help with reservations...

User: Can I see the menu?
Bot: [Button "View Menus"]

User: [Clicks]
Bot: We offer 4 different menus. Which one would you like to view?
     [List: À la Carte, Wagyu, Wine, Drinks]

User: [Selects "À la Carte"]
Bot: [PDF] "Here is the à la carte menu"
Bot: "Tempting, isn't it? Would you like to make a reservation?"
```

#### Exemple 3 : Utilisateur Récurrent
```
Utilisateur: Salut !
Bot: Content de vous revoir ! 😊
     [Pas de long message de bienvenue car reconnu dans la BDD]
```

### 🔧 Variables d'Environnement

#### Nouvelles Variables Requises
```env
# Supabase (nouveau)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_PROJECT_ID=xxx
SUPABASE_DB_PORT=5432
SUPABASE_DB_HOST=db.xxx.supabase.co
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=xxx
```

### 📦 Nouvelles Dépendances

```json
{
  "@supabase/supabase-js": "^2.75.0",
  "supabase": "^2.51.0" // DevDependency pour CLI
}
```

### 🚀 Migration depuis v1.x

#### Étape 1 : Mettre à jour les dépendances
```bash
npm install
```

#### Étape 2 : Configurer Supabase
1. Créer un projet sur [Supabase](https://supabase.com)
2. Exécuter la migration SQL : `supabase/migrations/20250116000000_create_conversations_and_messages.sql`
3. Ajouter les variables d'environnement Supabase au `.env`

#### Étape 3 : Compiler et démarrer
```bash
npm run build
npm start
```

### 🐛 Corrections de Bugs

- **Détection de langue** : Suppression de l'ancienne méthode basée sur des mots-clés (non scalable)
- **Formatage markdown** : Les réponses n'utilisent plus de markdown (**gras**, etc.) pour une meilleure compatibilité WhatsApp
- **Gestion des erreurs** : Meilleure gestion des erreurs OpenAI et Meta API

### ⚠️ Breaking Changes

1. **Variables d'environnement** : Les variables Supabase sont maintenant **requises**
2. **Détection de langue** : L'ancienne fonction `detectLanguage()` a été remplacée par `detectLanguageWithMastra()`
3. **Workflow des menus** : Nouveau workflow en deux étapes (peut affecter les tests)

### 📚 Documentation

- **README.md** : Complètement réécrit avec des instructions détaillées
- **CHANGELOG.md** : Ce fichier (nouveau)
- **Migration SQL** : `supabase/migrations/20250116000000_create_conversations_and_messages.sql`
- **JSDoc** : Documentation complète du code

### 🔮 Prochaines Étapes Possibles

- [ ] Dashboard d'analytics des conversations (Supabase + Recharts)
- [ ] Export CSV des conversations
- [ ] Notifications admin pour nouveaux messages
- [ ] Support des images et documents dans l'historique
- [ ] Recherche full-text dans les conversations
- [ ] Auto-fermeture des conversations inactives après X jours
- [ ] Intégration avec CRM (HubSpot, Salesforce, etc.)

---

## [1.0.0] - 2025-01-10

### 🎉 Version Initiale

- Agent Mastra avec OpenAI GPT-4
- Intégration Meta WhatsApp Business API
- Gestion des réservations interactives
- Envoi de menus PDF
- Webhook Express
- Custom tools pour informations restaurant

---

**Pour toute question sur cette version, contactez l'équipe de développement.**
