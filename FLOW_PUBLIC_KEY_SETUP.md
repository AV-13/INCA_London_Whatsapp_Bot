# WhatsApp Flow - Configuration de la Clé Publique 🔐

Guide complet pour générer et configurer la clé publique requise pour publier votre WhatsApp Flow.

## 📋 Pourquoi une Clé Publique ?

WhatsApp Flow utilise le chiffrement RSA pour sécuriser les données échangées entre :
- **Votre serveur** (endpoint Flow)
- **WhatsApp** (qui envoie les données du Flow)

La clé publique est uploadée sur Meta Business Manager, et la clé privée reste sur votre serveur pour déchiffrer les données.

## 🚀 Génération de la Paire de Clés

### Étape 1 : Exécuter le Script

```bash
npm run generate-flow-keys
```

**Ce script va :**
1. ✅ Générer une paire de clés RSA (2048-bit)
2. ✅ Sauvegarder la clé privée dans `keys/flow-private-key.pem`
3. ✅ Sauvegarder la clé publique dans `keys/flow-public-key.pem`
4. ✅ Ajouter `/keys/` au `.gitignore` (sécurité)
5. ✅ Afficher la clé publique formatée pour Meta

### Étape 2 : Copier la Clé Publique

Le script affichera quelque chose comme :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ KEY GENERATION COMPLETE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 NEXT STEPS:

1️⃣  Copy the public key below:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Copiez** la longue chaîne de caractères affichée entre les lignes.

### Étape 3 : Upload sur Meta Business Manager

1. Allez sur [Meta Business Manager](https://business.facebook.com/)
2. **WhatsApp Manager** > **Flows**
3. Sélectionnez votre Flow (ex: "Inca London - Date Selection")
4. Cliquez sur **"Set up endpoint"** ou **"Configure endpoint"**
5. Dans le champ **"Public Key"** :
   - Collez la clé publique copiée
6. **Sauvegardez** la configuration

### Étape 4 : Configurer le `.env`

Ajoutez la clé privée à votre fichier `.env` :

```env
# WhatsApp Flow Encryption
FLOW_PRIVATE_KEY_PATH=./keys/flow-private-key.pem
```

## 📁 Structure des Fichiers

Après génération, vous aurez :

```
Inca_London/
├── keys/                          # 🔒 NEVER commit this folder!
│   ├── flow-private-key.pem      # Clé privée (déchiffrement)
│   └── flow-public-key.pem       # Clé publique (pour Meta)
├── scripts/
│   └── generate-flow-keys.js     # Script de génération
└── .gitignore                     # Contient /keys/
```

## 🔒 Sécurité - TRÈS IMPORTANT

### ⚠️ À FAIRE

- ✅ **Sauvegardez** la clé privée dans un endroit sûr (gestionnaire de mots de passe, coffre-fort cloud chiffré)
- ✅ **Restreignez** les permissions du fichier : `chmod 600 keys/flow-private-key.pem` (Linux/Mac)
- ✅ **Vérifiez** que `/keys/` est bien dans `.gitignore`
- ✅ **Utilisez** des variables d'environnement pour le chemin de la clé

### ❌ À NE JAMAIS FAIRE

- ❌ **NE COMMITEZ JAMAIS** la clé privée sur Git
- ❌ **NE PARTAGEZ JAMAIS** la clé privée publiquement
- ❌ **NE L'ENVOYEZ JAMAIS** par email ou Slack non chiffré
- ❌ **NE LA COPIEZ PAS** dans le code source

## 🛠️ Utilisation de la Clé Privée (Déchiffrement)

### Créer le Endpoint de Déchiffrement

Créez un endpoint qui déchiffre les données entrantes du Flow :

```typescript
import crypto from 'crypto';
import fs from 'fs';

// Charger la clé privée
const privateKeyPath = process.env.FLOW_PRIVATE_KEY_PATH || './keys/flow-private-key.pem';
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

// Déchiffrer les données du Flow
function decryptFlowData(encryptedData: string): any {
  const buffer = Buffer.from(encryptedData, 'base64');

  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    buffer
  );

  return JSON.parse(decrypted.toString('utf8'));
}

// Endpoint pour recevoir les données du Flow
app.post('/whatsapp-flow-endpoint', (req, res) => {
  try {
    const { encrypted_flow_data } = req.body;
    const decryptedData = decryptFlowData(encrypted_flow_data);

    console.log('Decrypted Flow Data:', decryptedData);

    // Traiter les données déchiffrées
    // ...

    res.json({ success: true });
  } catch (error) {
    console.error('Error decrypting flow data:', error);
    res.status(400).json({ error: 'Decryption failed' });
  }
});
```

## 🔄 Régénérer les Clés

Si vous devez régénérer les clés :

1. **Sauvegardez** l'ancienne clé privée (au cas où)
2. **Supprimez** le dossier `keys/`
3. **Exécutez** `npm run generate-flow-keys`
4. **Re-uploadez** la nouvelle clé publique sur Meta
5. **Mettez à jour** le `.env` si nécessaire

## 📚 Ressources

- [Meta Docs - Implementing Your Flow Endpoint](https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint)
- [Meta Docs - Upload Public Key](https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint#upload_public_key)
- [RSA Encryption Best Practices](https://www.rfc-editor.org/rfc/rfc8017)

## ❓ Dépannage

### Erreur : "Invalid Public Key Format"

**Cause :** Le format de la clé publique est incorrect

**Solution :**
1. Assurez-vous de copier **uniquement** la chaîne base64 (sans `-----BEGIN/END-----`)
2. Pas d'espaces ni de retours à la ligne
3. La clé doit être en une seule ligne

### Erreur : "Private Key Not Found"

**Cause :** Le chemin vers la clé privée est incorrect

**Solution :**
1. Vérifiez que `FLOW_PRIVATE_KEY_PATH` est correct dans `.env`
2. Vérifiez que le fichier existe : `ls -la keys/flow-private-key.pem`
3. Vérifiez les permissions du fichier

### Erreur : "Decryption Failed"

**Cause :** La clé privée ne correspond pas à la clé publique uploadée

**Solution :**
1. Régénérez les clés avec `npm run generate-flow-keys`
2. Re-uploadez la **nouvelle** clé publique sur Meta
3. Assurez-vous d'utiliser la **même paire** de clés

## ✅ Checklist Finale

Avant de publier votre Flow :

- [ ] Clés RSA générées (`npm run generate-flow-keys`)
- [ ] Clé publique copiée et uploadée sur Meta Business Manager
- [ ] `/keys/` ajouté au `.gitignore`
- [ ] `FLOW_PRIVATE_KEY_PATH` configuré dans `.env`
- [ ] Clé privée sauvegardée en lieu sûr
- [ ] Endpoint de déchiffrement implémenté (si nécessaire)
- [ ] Testé le Flow en mode Draft
- [ ] Publié le Flow

---

**🎉 Félicitations !** Votre Flow est maintenant sécurisé avec le chiffrement RSA.
