# 🎯 Guide Visuel - Où Coller la Clé Publique dans Meta Business Manager

## 📋 Ta Clé Publique à Copier

**COPIE CETTE CLÉ :**
```
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuvby/+i+avoca2blXxTPk+DsVueFvq0Tq9Oo0G4z1bJyHqsjp83n2zF/V2+/TI0Zc+4ON37UnK5J+ppXn3DwtThLGzf7of1BwbL1VUBshqF0iiUzzONCrobSJlSy/nJvwZXlz3xMtH7Yq6spvRfwTunBOUJYxckQwQjlLdbdD96ufkvT1wW0VBB7juOraSLXqjA2bHY5+bNA1UBV9mrv9Guujeu+uE+O2Si5WW4fcihMXLCdwp9wiUVCRppql4yEf7xApHFE4DJCXOUGlY5bdYtRSUpOzXt2VpMU2Wj88NHVmkzHHoviI2nowmZEiRk4Gj/bEOQw5GWCLscWXVx+zQIDAQAB
```

## 🗺️ Navigation Étape par Étape dans Meta Business Manager

### Étape 1 : Accéder à Meta Business Manager

1. Va sur **https://business.facebook.com/**
2. Connecte-toi à ton compte Meta Business

### Étape 2 : Aller dans WhatsApp Manager

```
Menu Latéral Gauche
└── 📱 WhatsApp Accounts
    └── Clique sur ton compte WhatsApp Business
```

### Étape 3 : Accéder aux Flows

Dans le sous-menu WhatsApp, tu verras :

```
WhatsApp Manager
├── Phone numbers
├── Templates
├── 🔄 Flows           ← CLIQUE ICI
├── Analytics
└── Settings
```

### Étape 4 : Sélectionner Ton Flow

Tu verras la liste de tes Flows. **Clique sur ton Flow** (ex: "Inca London - Date Selection")

### Étape 5 : Configurer l'Endpoint - MÉTHODE 1 (Nouveau Flow)

Si ton Flow est **nouveau** ou **en Draft** :

```
En haut à droite, tu verras :
┌─────────────────────────────────────────┐
│  ⚙️ Setup                               │
│  📝 Preview                             │
│  ✅ Publish                             │
└─────────────────────────────────────────┘

Clique sur "⚙️ Setup" ou "Configure Endpoint"
```

### Étape 6 : Configurer l'Endpoint - MÉTHODE 2 (Flow Existant)

Si ton Flow est déjà créé :

```
Dans les onglets du Flow :
┌────────────────────────────────────────┐
│ Details | JSON | Endpoint | Analytics  │
└────────────────────────────────────────┘

Clique sur l'onglet "Endpoint" ←
```

### Étape 7 : Remplir le Formulaire Endpoint

Tu verras maintenant un formulaire avec **2 champs principaux** :

```
┌─────────────────────────────────────────────────────────────┐
│  Flow Endpoint Configuration                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📍 Endpoint URL (required)                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │ https://dilatory-keiko-dendrological.ngrok-free... │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  🔐 Public Key (required)                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │  ← COLLE TA CLÉ PUBLIQUE ICI                       │    │
│  │                                                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [ Verify and Save ]                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Étape 8 : Coller la Clé Publique

1. **Clique dans le champ "Public Key"**
2. **Colle ta clé** (celle affichée en haut de ce document)
3. **IMPORTANT** : Colle UNIQUEMENT la chaîne de caractères, SANS les headers PEM (`-----BEGIN...`)

**✅ BON FORMAT :**
```
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuvby/+i+avoca2blXxTPk+DsVueFvq0Tq9Oo0G4z1bJyHqsjp83n2zF/V2+/TI0Zc+4ON37UnK5J+ppXn3DwtThLGzf7of1BwbL1VUBshqF0iiUzzONCrobSJlSy/nJvwZXlz3xMtH7Yq6spvRfwTunBOUJYxckQwQjlLdbdD96ufkvT1wW0VBB7juOraSLXqjA2bHY5+bNA1UBV9mrv9Guujeu+uE+O2Si5WW4fcihMXLCdwp9wiUVCRppql4yEf7xApHFE4DJCXOUGlY5bdYtRSUpOzXt2VpMU2Wj88NHVmkzHHoviI2nowmZEiRk4Gj/bEOQw5GWCLscWXVx+zQIDAQAB
```

**❌ MAUVAIS FORMAT :**
```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuvby/+i+avoca2blXxTP...
-----END PUBLIC KEY-----
```

### Étape 9 : Vérifier l'Endpoint URL

Ton URL endpoint doit être :

```
https://dilatory-keiko-dendrological.ngrok-free.dev/whatsapp-flow-endpoint
```

**⚠️ ATTENTION** : Retire le **slash final** si présent :
- ✅ Bon : `/whatsapp-flow-endpoint`
- ❌ Mauvais : `/whatsapp-flow-endpoint/`

### Étape 10 : Sauvegarder

1. **Clique sur "Verify and Save"** ou **"Save"**
2. Meta va vérifier que ton endpoint est accessible
3. Si tout est OK, tu verras un message de succès ✅

## 🔍 Variantes de l'Interface Meta

Selon la version de Meta Business Manager, tu peux voir :

### Version A : Dans les paramètres du Flow
```
Flow Settings
├── Flow Name
├── Category
└── Endpoint Configuration  ← Cherche ici
    ├── Endpoint URL
    └── Public Key
```

### Version B : Onglet "Endpoint"
```
Onglets du Flow :
[ Details ] [ JSON ] [ Endpoint ] [ Analytics ]
                         ↑
                    Clique ici
```

### Version C : Bouton "Setup"
```
En haut à droite du Flow :
[ Setup ] [ Preview ] [ Publish ]
   ↑
Clique ici
```

## ❓ Problèmes Courants

### "Je ne vois pas le champ Public Key"

**Solution 1** : Vérifie que tu as bien sélectionné le **bon Flow**

**Solution 2** : Cherche "Endpoint" ou "Webhook Configuration" dans les onglets

**Solution 3** : Clique sur "Setup" ou "Configure" en haut à droite

### "Invalid Public Key Format"

**Cause** : Tu as copié les headers PEM (`-----BEGIN...`)

**Solution** : Copie **uniquement** la chaîne base64 (celle affichée en haut de ce document)

### "Endpoint Not Reachable"

**Cause** : Ton serveur ngrok n'est pas accessible

**Solution** :
1. Vérifie que ngrok tourne : `ngrok http 3000`
2. Vérifie que ton serveur est démarré : `npm run dev`
3. Teste l'URL dans le navigateur

## 📸 Captures d'Écran (Description Textuelle)

Voici à quoi ressemble typiquement l'interface :

```
┌────────────────────────────────────────────────────────────┐
│  Meta Business Manager                                      │
├────────────────────────────────────────────────────────────┤
│  ← Back to Flows          Inca London - Date Selection     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  [ Details ]  [ JSON ]  [ Endpoint ]  [ Analytics ]        │
│                            ^^^^^^^^                         │
│                         CLIQUE ICI                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Endpoint Configuration                               │ │
│  │                                                       │ │
│  │  Endpoint URL                                         │ │
│  │  [https://dilatory-keiko-dendrological...]          │ │
│  │                                                       │ │
│  │  Public Key                                           │ │
│  │  [MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCA...]  │ │
│  │                                                       │ │
│  │  [  Verify and Save  ]                               │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

## ✅ Checklist Finale

Avant de sauvegarder :

- [ ] Endpoint URL est correct (sans slash final)
- [ ] Clé publique copiée (SANS les headers PEM)
- [ ] Pas d'espaces ou retours à la ligne dans la clé
- [ ] ngrok est en cours d'exécution
- [ ] Serveur Node.js est démarré

## 🆘 Si Tu Ne Trouves Toujours Pas

Essaye ces URLs directes :

1. **Flows** : https://business.facebook.com/wa/manage/flows/
2. **WhatsApp Manager** : https://business.facebook.com/latest/whatsapp_manager

Puis sélectionne ton Flow et cherche "Endpoint" ou "Configuration".

---

**💡 Astuce** : Le champ "Public Key" apparaît **UNIQUEMENT** quand tu configures l'endpoint d'un Flow. Si tu ne le vois pas, c'est que tu n'es pas au bon endroit dans l'interface.

**📞 Besoin d'aide ?** Décris-moi exactement ce que tu vois sur ton écran et je t'aiderai !
