# 🔐 WhatsApp Flow - Génération de Clé Publique

## 🎯 Résumé Rapide

Pour publier votre WhatsApp Flow, vous devez uploader une **clé publique** sur Meta Business Manager.

### Commande Magique ✨

```bash
npm run generate-flow-keys
```

Cette commande va :
1. ✅ Générer une paire de clés RSA (publique + privée)
2. ✅ Sauvegarder les clés dans `/keys/`
3. ✅ Afficher la clé publique à copier
4. ✅ Protéger les clés avec `.gitignore`

## 📋 Instructions en 3 Étapes

### Étape 1 : Générer les Clés

```bash
npm run generate-flow-keys
```

**Output attendu :**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ KEY GENERATION COMPLETE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Copy the public key below:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**👉 Copiez la longue chaîne de caractères affichée**

### Étape 2 : Uploader sur Meta

1. Allez sur https://business.facebook.com/
2. **WhatsApp** → **Flows** → **Votre Flow**
3. Cliquez **"Set up endpoint"**
4. **Endpoint URL** : `https://votre-serveur.com/whatsapp-flow-endpoint`
5. **Public Key** : Collez la clé copiée
6. **Save**

### Étape 3 : Configurer `.env`

```env
META_WHATSAPP_FLOW_ID=votre_flow_id_ici
FLOW_PRIVATE_KEY_PATH=./keys/flow-private-key.pem
```

## 📁 Fichiers Générés

```
Inca_London/
├── keys/                          # 🔒 PROTÉGÉ PAR .gitignore
│   ├── flow-private-key.pem      # Clé privée (décryptage)
│   └── flow-public-key.pem       # Clé publique (pour Meta)
```

## 🔒 Sécurité

### ✅ Ce qui est SÉCURISÉ

- ✅ `/keys/` est automatiquement ajouté au `.gitignore`
- ✅ `*.pem` est exclu du versioning
- ✅ La clé privée reste sur votre serveur
- ✅ Seule la clé publique est uploadée sur Meta

### ⚠️ IMPORTANT

- ❌ **NE COMMITEZ JAMAIS** la clé privée
- ❌ **NE PARTAGEZ JAMAIS** `flow-private-key.pem`
- ✅ **SAUVEGARDEZ** la clé privée dans un coffre-fort sécurisé
- ✅ **VÉRIFIEZ** que `/keys/` est bien dans `.gitignore`

## 🧪 Vérification

Pour vérifier que tout est OK :

```bash
# 1. Vérifier que les clés existent
ls -la keys/

# 2. Vérifier que .gitignore contient /keys/
grep "keys" .gitignore

# 3. Vérifier que les clés ne sont pas trackées
git status
# Les fichiers dans /keys/ ne doivent PAS apparaître
```

## 🔄 Regénérer les Clés

Si vous avez besoin de regénérer :

```bash
# 1. Sauvegarder l'ancienne clé (optionnel)
cp keys/flow-private-key.pem keys/flow-private-key.backup.pem

# 2. Supprimer les anciennes clés
rm -rf keys/

# 3. Regénérer
npm run generate-flow-keys

# 4. Re-uploader la NOUVELLE clé publique sur Meta
```

## 📚 Documentation Complète

- **Setup complet :** `FLOW_PUBLIC_KEY_SETUP.md` (guide détaillé)
- **Checklist de publication :** `FLOW_PUBLISH_CHECKLIST.md` (étapes complètes)
- **Dépannage :** `FLOW_INVESTIGATION.md` (erreurs courantes)

## ❓ FAQ

### Q: Pourquoi ai-je besoin d'une clé publique ?

**R:** WhatsApp Flow utilise le chiffrement RSA pour sécuriser les données. La clé publique permet à Meta de chiffrer les données, et votre clé privée permet de les déchiffrer.

### Q: Où trouver le Flow ID ?

**R:** Meta Business Manager → WhatsApp → Flows → (sélectionnez votre Flow) → L'ID est dans l'URL ou dans les paramètres du Flow.

### Q: Le script fonctionne sur Windows ?

**R:** Oui ! Le script utilise Node.js natif et fonctionne sur Windows, Mac et Linux.

### Q: Que faire si j'ai perdu la clé privée ?

**R:** Regénérez une nouvelle paire de clés avec `npm run generate-flow-keys` et re-uploadez la nouvelle clé publique sur Meta.

## 🆘 Support

En cas de problème :

1. **Vérifiez les logs** du script de génération
2. **Consultez** `FLOW_PUBLIC_KEY_SETUP.md` pour plus de détails
3. **Vérifiez** que Node.js est installé (`node --version`)

---

**✨ C'est tout ! Vous êtes prêt à publier votre Flow.**

**Commande unique :** `npm run generate-flow-keys` → Copier la clé → Coller sur Meta → Done! 🚀
