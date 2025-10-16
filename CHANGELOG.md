# Changelog - Inca London WhatsApp Bot

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
