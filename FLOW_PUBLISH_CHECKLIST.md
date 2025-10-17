# ✅ WhatsApp Flow - Checklist de Publication

Guide étape par étape pour publier votre WhatsApp Flow.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :

- [ ] Un compte Meta Business Manager
- [ ] WhatsApp Business API configuré
- [ ] Le Flow JSON créé (voir `whatsapp-flow-calendar.json`)
- [ ] Un endpoint serveur accessible publiquement (ngrok, serveur prod, etc.)

## 🚀 Étapes de Publication

### 1️⃣ Générer les Clés de Chiffrement

```bash
npm run generate-flow-keys
```

**Ce qui va se passer :**
- ✅ Génération d'une paire de clés RSA (2048-bit)
- ✅ Sauvegarde de `flow-private-key.pem` dans `/keys/`
- ✅ Sauvegarde de `flow-public-key.pem` dans `/keys/`
- ✅ Affichage de la clé publique à copier

**⚠️ Important :** Copiez la clé publique affichée (la longue chaîne de caractères)

### 2️⃣ Uploader la Clé Publique sur Meta

1. Allez sur [Meta Business Manager](https://business.facebook.com/)
2. **WhatsApp Manager** → **Flows**
3. Sélectionnez votre Flow (ex: "Inca London - Date Selection")
4. Cliquez sur **"Set up endpoint"** ou **"Configure"**
5. **Endpoint URL** : Entrez l'URL de votre serveur
   ```
   https://votre-serveur.com/whatsapp-flow-endpoint
   ```
   ou avec ngrok :
   ```
   https://xxxx.ngrok.io/whatsapp-flow-endpoint
   ```
6. **Public Key** : Collez la clé publique copiée à l'étape 1
7. **Verify & Save**

### 3️⃣ Configurer les Variables d'Environnement

Ajoutez ces lignes à votre `.env` :

```env
# WhatsApp Flow Configuration
META_WHATSAPP_FLOW_ID=755446887663203  # Votre Flow ID
FLOW_PRIVATE_KEY_PATH=./keys/flow-private-key.pem
```

### 4️⃣ Implémenter l'Endpoint de Décryptage (Optionnel)

Si votre Flow envoie des données chiffrées, créez l'endpoint de déchiffrement :

```typescript
// src/whatsapp/flow-endpoint.ts
import express from 'express';
import crypto from 'crypto';
import fs from 'fs';

const router = express.Router();

// Charger la clé privée
const privateKey = fs.readFileSync(
  process.env.FLOW_PRIVATE_KEY_PATH || './keys/flow-private-key.pem',
  'utf8'
);

router.post('/whatsapp-flow-endpoint', (req, res) => {
  try {
    const { encrypted_flow_data, aes_key, initial_vector } = req.body;

    // Déchiffrer la clé AES avec la clé privée RSA
    const decryptedAesKey = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(aes_key, 'base64')
    );

    // Déchiffrer les données avec AES
    const decipher = crypto.createDecipheriv(
      'aes-128-gcm',
      decryptedAesKey,
      Buffer.from(initial_vector, 'base64')
    );

    let decrypted = decipher.update(encrypted_flow_data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    const flowData = JSON.parse(decrypted);
    console.log('Flow Data:', flowData);

    // Traiter les données...
    res.json({ success: true });
  } catch (error) {
    console.error('Decryption error:', error);
    res.status(400).json({ error: 'Decryption failed' });
  }
});

export default router;
```

**Note :** Pour le CalendarPicker simple, cette étape n'est **pas nécessaire** car les données sont déjà envoyées via `nfm_reply` dans le webhook standard.

### 5️⃣ Tester le Flow en Mode Draft

Avant de publier :

1. **Meta Business Manager** → **Flows** → Votre Flow
2. Cliquez sur **"Preview"** ou **"Test"**
3. Scannez le QR code avec WhatsApp
4. Testez le Flow complet
5. Vérifiez que :
   - [ ] Le calendrier s'affiche correctement
   - [ ] Les dates sont sélectionnables
   - [ ] Les données sont bien reçues
   - [ ] Aucune erreur "Integrity" n'apparaît

### 6️⃣ Publier le Flow

Une fois les tests OK :

1. **Meta Business Manager** → **Flows** → Votre Flow
2. Cliquez sur **"Publish"**
3. Confirmez la publication

**Le Flow est maintenant LIVE ! 🎉**

### 7️⃣ Décommenter le Code du Flow (Optionnel)

Si vous voulez réactiver le Flow (actuellement commenté) :

**Dans `src/whatsapp/client.ts` :**
```typescript
// Décommenter la méthode sendCalendarFlow() (lignes 310-354)
```

**Dans `src/whatsapp/webhook.ts` :**
```typescript
// Décommenter le code du Flow dans sendCalendarPicker() (lignes 623-646)
// Commenter le fallback manuel (lignes 648-656)
```

Puis rebuild :
```bash
npm run build
```

## 🔒 Sécurité - Checklist Finale

Avant de mettre en production :

- [ ] `/keys/` est bien dans `.gitignore`
- [ ] La clé privée n'est **jamais** commitée
- [ ] `FLOW_PRIVATE_KEY_PATH` est dans `.env` (pas `.env.example`)
- [ ] La clé privée a des permissions restrictives (600 sur Linux/Mac)
- [ ] Une sauvegarde de la clé privée est stockée en lieu sûr
- [ ] L'endpoint utilise HTTPS (pas HTTP)

## 🧪 Tests de Validation

### Test 1 : Flow s'affiche
```
Utilisateur : "Je voudrais réserver"
Bot : "Combien de personnes ?" [Liste]
Utilisateur : Sélectionne "2 personnes"
Bot : [Affiche le Flow Calendrier] ✅
```

### Test 2 : Sélection de date
```
Utilisateur : Clique sur une date dans le calendrier
Bot : "Quelle heure ?" [Liste d'heures] ✅
```

### Test 3 : Flux complet
```
Personnes → Calendrier → Heure → Durée → Lien SevenRooms ✅
```

## ❓ Dépannage Rapide

### Erreur : "Invalid Public Key"
**Solution :** Regénérez les clés avec `npm run generate-flow-keys` et re-uploadez

### Erreur : "Endpoint Not Reachable"
**Solution :** Vérifiez que votre serveur/ngrok est bien accessible publiquement

### Erreur : "Blocked by Integrity"
**Solution :** Vérifiez que la clé publique uploadée correspond bien à la clé privée utilisée

### Le calendrier ne s'affiche pas
**Solution :**
1. Vérifiez que `META_WHATSAPP_FLOW_ID` est dans `.env`
2. Vérifiez que le Flow est **publié** (pas en draft)
3. Vérifiez les logs serveur pour des erreurs

## 📚 Documentation Complète

- **Configuration des clés :** `FLOW_PUBLIC_KEY_SETUP.md`
- **Configuration du Flow :** `WHATSAPP_FLOW_SETUP.md`
- **Investigation des erreurs :** `FLOW_INVESTIGATION.md`
- **Guide rapide :** `QUICK_START.md`

## ✅ Checklist Finale de Publication

- [ ] 1. Clés RSA générées (`npm run generate-flow-keys`)
- [ ] 2. Clé publique uploadée sur Meta Business Manager
- [ ] 3. Endpoint URL configuré dans Meta
- [ ] 4. `META_WHATSAPP_FLOW_ID` dans `.env`
- [ ] 5. `FLOW_PRIVATE_KEY_PATH` dans `.env`
- [ ] 6. Flow testé en mode Preview
- [ ] 7. Flow publié
- [ ] 8. Test complet du flux de réservation
- [ ] 9. Clé privée sauvegardée en lieu sûr
- [ ] 10. Code déployé en production

---

**🎉 Félicitations ! Votre WhatsApp Flow est maintenant publié et opérationnel !**

**Prochaines étapes :**
- Surveillez les logs pour détecter d'éventuelles erreurs
- Testez avec de vrais utilisateurs
- Collectez les retours et améliorez l'expérience
