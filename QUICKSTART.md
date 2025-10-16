# 🚀 Guide de Démarrage Rapide - Inca London WhatsApp Bot

Ce guide vous permet de configurer et lancer le bot en **moins de 15 minutes**.

## ✅ Checklist Prérequis

Avant de commencer, vérifiez que vous avez :

- [ ] Node.js v18+ installé ([Télécharger](https://nodejs.org/))
- [ ] Un compte OpenAI avec une clé API ([Créer](https://platform.openai.com/api-keys))
- [ ] Un compte Meta Developer ([Créer](https://developers.facebook.com/))
- [ ] Un projet Supabase ([Créer](https://supabase.com))
- [ ] ngrok installé ([Télécharger](https://ngrok.com/download))

## 📝 Configuration en 5 Étapes

### 1️⃣ Installation du Projet (2 min)

```bash
# Cloner le repo
git clone <repository-url>
cd Inca_London

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env
```

### 2️⃣ Configuration Supabase (5 min)

1. **Créer un projet sur [Supabase](https://supabase.com)**
   - Cliquez sur "New Project"
   - Notez l'URL et les clés API

2. **Créer les tables**
   ```bash
   # Option A : Via Supabase CLI (recommandé)
   npm install -g supabase
   supabase link --project-ref VOTRE_PROJECT_ID
   supabase db push

   # Option B : Via l'interface web
   # - Allez dans SQL Editor sur Supabase
   # - Copiez-collez le contenu de supabase/migrations/20250116000000_create_conversations_and_messages.sql
   # - Exécutez
   ```

3. **Récupérer les credentials**
   - Allez dans Settings > API
   - Copiez :
     - Project URL
     - API Key (anon public)
     - Service Role Key (secret)
   - Allez dans Settings > Database
   - Copiez les credentials de connexion

4. **Ajouter au `.env`**
   ```env
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_API_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   SUPABASE_PROJECT_ID=xxx
   SUPABASE_DB_PORT=5432
   SUPABASE_DB_HOST=db.xxx.supabase.co
   SUPABASE_DB_USER=postgres
   SUPABASE_DB_PASSWORD=xxx
   ```

### 3️⃣ Configuration OpenAI (1 min)

1. Obtenez votre clé sur [OpenAI Platform](https://platform.openai.com/api-keys)
2. Ajoutez-la au `.env` :
   ```env
   OPENAI_API_KEY=sk-proj-xxxxx
   ```

### 4️⃣ Configuration Meta WhatsApp (5 min)

1. **Créer une app Meta**
   - Allez sur [Meta for Developers](https://developers.facebook.com/apps/)
   - Créez une app de type "Business"

2. **Activer WhatsApp**
   - Ajoutez le produit "WhatsApp"
   - Allez dans WhatsApp > API Setup

3. **Récupérer les identifiants**
   - Copiez le Phone Number ID
   - Générez un Access Token (permanent si possible)
   - Ajoutez au `.env` :
   ```env
   META_WHATSAPP_TOKEN=EAAxxxxx
   META_WHATSAPP_PHONE_NUMBER_ID=123456789
   META_WEBHOOK_VERIFY_TOKEN=choisissez_un_token_secret_aleatoire
   ```

4. **Configurer le webhook** (après avoir lancé le serveur, voir étape 5)

### 5️⃣ Lancement (2 min)

1. **Démarrer ngrok**
   ```bash
   ngrok http 3000
   ```
   - Copiez l'URL HTTPS (ex: `https://abc123.ngrok.io`)
   - Ajoutez au `.env` :
   ```env
   NGROK_URL=https://abc123.ngrok.io
   ```

2. **Compiler et lancer le bot**
   ```bash
   npm run build
   npm start
   ```

3. **Configurer le webhook dans Meta**
   - Allez dans WhatsApp > Configuration > Webhook
   - URL : `https://abc123.ngrok.io/webhook`
   - Verify Token : Le token du `.env`
   - Cliquez sur "Verify and Save"
   - Abonnez-vous au champ **messages**

## ✅ Test du Bot

1. **Envoyez un message WhatsApp** à votre numéro de test
2. **Testez ces commandes** :
   - "Bonjour" → Message de bienvenue
   - "Menu" → Boutons interactifs
   - "Réservation" → Flux de réservation

## 🔍 Vérifications

### Le webhook fonctionne ?
```bash
curl https://votre-url.ngrok.io/health
```
Devrait retourner : `{"status":"healthy",...}`

### Supabase est connecté ?
Vérifiez les logs du serveur :
```
✅ Supabase client initialized
```

### Les conversations sont sauvegardées ?
Dans Supabase > Table Editor > conversations :
```sql
SELECT * FROM conversations ORDER BY last_message_at DESC LIMIT 10;
```

## 🐛 Problèmes Courants

### "Error: Missing required environment variables"
→ Vérifiez que toutes les variables du `.env` sont remplies

### "Error: Invalid API key"
→ Vérifiez votre clé OpenAI sur https://platform.openai.com/api-keys

### "Webhook verification failed"
→ Le `META_WEBHOOK_VERIFY_TOKEN` doit être identique dans `.env` et Meta Console

### "Cannot connect to Supabase"
→ Vérifiez les credentials Supabase dans `.env`
→ Vérifiez que les tables existent

### Le bot ne répond pas
→ Vérifiez les logs du serveur
→ Testez l'endpoint : `curl https://votre-url.ngrok.io/webhook`

## 📊 Monitorer les Conversations

### Via Supabase Dashboard
```sql
-- Nombre total de conversations
SELECT COUNT(*) FROM conversations;

-- Conversations actives
SELECT * FROM conversations WHERE status = 'open';

-- Nombre de messages par utilisateur
SELECT
  c.user_phone,
  COUNT(m.id) as message_count
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.user_phone
ORDER BY message_count DESC;

-- Derniers messages reçus
SELECT
  c.user_phone,
  m.text_content,
  m.created_at
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE m.direction = 'in'
ORDER BY m.created_at DESC
LIMIT 20;
```

### Via Logs du Serveur
Les logs affichent :
- 📨 Messages entrants
- 🤖 Réponses générées
- 🌍 Langue détectée
- 💾 Opérations BDD
- 📋 Actions sur les boutons

## 🎯 Prochaines Étapes

1. **Personnalisez le bot**
   - Éditez `src/agent/mastra.ts` pour modifier le comportement
   - Éditez `src/config.ts` pour les informations du restaurant

2. **Testez en profondeur**
   - Testez dans différentes langues
   - Testez le flux de réservation complet
   - Testez avec plusieurs utilisateurs

3. **Déploiement en production**
   - Voir [README.md](README.md#production-deployment) pour les instructions
   - Utilisez un domaine permanent au lieu de ngrok
   - Configurez des backups Supabase

## 📞 Support

Besoin d'aide ?
- 📖 Documentation complète : [README.md](README.md)
- 📝 Changelog : [CHANGELOG.md](CHANGELOG.md)
- 🐛 Problèmes : Créez une issue sur GitHub

---

**Temps total : ~15 minutes** ⏱️

**Bonne chance ! 🚀**
