# Guide de Démarrage Rapide - Nouvelle Feature CalendarPicker

## 🚀 Pour Démarrer Immédiatement

### 1. Configuration Minimale (Sans CalendarPicker)

Le système fonctionne **immédiatement** sans configuration supplémentaire. Il utilisera automatiquement une liste de dates au lieu du calendrier interactif.

```bash
# Aucune modification nécessaire !
npm run dev
```

### 2. Configuration Complète (Avec CalendarPicker)

Pour activer le calendrier interactif, suivez ces 3 étapes :

#### Étape 1: Créer le Flow WhatsApp

1. Allez sur [Meta Business Manager](https://business.facebook.com/)
2. **WhatsApp** > **Flows** > **Create Flow**
3. Nom : "Inca London - Date Selection"
4. Mode **JSON** et collez :

```json
{
  "version": "7.2",
  "data_api_version": "3.0",
  "routing_model": {},
  "screens": [
    {
      "id": "CALENDAR_SCREEN",
      "terminal": true,
      "title": "Select a Date",
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "CalendarPicker",
            "name": "calendar",
            "label": "Select your reservation date",
            "helper-text": "Choose a date for your table",
            "required": true,
            "mode": "single",
            "min-date": "2025-01-01",
            "max-date": "2026-12-31",
            "unavailable-dates": [],
            "include-days": ["Wed", "Thu", "Fri", "Sat", "Sun"],
            "on-select-action": {
              "name": "data_exchange",
              "payload": {
                "calendar": "${form.calendar}"
              }
            }
          },
          {
            "type": "Footer",
            "label": "Continue",
            "on-click-action": {
              "name": "complete",
              "payload": {}
            }
          }
        ]
      }
    }
  ]
}
```

**IMPORTANT :** Les contraintes de dates sont maintenant **dans le Flow JSON** (`min-date`, `max-date`, `include-days`) pour éviter l'erreur "Blocked by Integrity".

5. **Publish** le Flow
6. Copiez le **Flow ID** (nombre à 16 chiffres)

#### Étape 2: Configurer l'Environnement

Ajoutez dans votre `.env` :

```env
META_WHATSAPP_FLOW_ID=votre_flow_id_ici
```

#### Étape 3: Redémarrer

```bash
# Arrêter le serveur (Ctrl+C)
# Relancer
npm run dev
```

---

## 🧪 Tests Rapides

### Test 1: Vérification du Flux de Réservation

```
Vous: "Je voudrais réserver"
Bot: [Liste] Combien de personnes ?
Vous: Sélectionnez "2 personnes"
Bot: [Calendrier ou Liste] Quelle date ?
Vous: Sélectionnez une date
Bot: [Liste] Quelle heure ?
Vous: Sélectionnez "20:00"
Bot: [Boutons] Durée ?
Vous: Sélectionnez "2h"
Bot: [Message] Voici votre lien de réservation...
```

### Test 2: Vérification Détection de Langue

```
Vous: "Je veux réserver pour le 2025-10-21"
Bot: Répond en FRANÇAIS (et non en anglais)
```

**Avant la correction**, le bot détectait "2025-10-21" comme de l'anglais.
**Maintenant**, il ignore les dates/heures ISO et détecte correctement le français.

### Test 3: Vérification du Fallback

1. Retirez `META_WHATSAPP_FLOW_ID` de `.env`
2. Testez le flux de réservation
3. Vous verrez une **liste de dates** au lieu du calendrier
4. Le flux fonctionne quand même !

---

## 📊 Vérifier que Tout Fonctionne

### Dans les Logs du Serveur

**Bon signe** :
```
✅ Sent CalendarPicker Flow to 44... in language: fr
✅ Calendar date selected: 2025-10-21
🌍 Detected language: fr for message: "..." (cleaned: "...")
```

**Fallback (normal si pas de Flow ID)** :
```
❌ META_WHATSAPP_FLOW_ID not configured in .env
   Falling back to date request list
✅ Sent date selector list to 44... in language: fr
```

---

## 🎯 Checklist de Validation

- [ ] Le serveur démarre sans erreur
- [ ] Flux de réservation fonctionne (avec liste ou calendrier)
- [ ] Les lundis et mardis sont désactivés/non affichés
- [ ] La détection de langue fonctionne avec des dates dans le message
- [ ] Le lien final SevenRooms contient tous les paramètres
- [ ] Le système fonctionne en français, anglais, espagnol, etc.

---

## ❓ Problèmes Courants

### Le calendrier ne s'affiche pas

**Cause:** Flow ID manquant ou incorrect
**Solution:** Vérifiez `.env` et que le Flow est publié dans Meta Business Manager

### Erreur "Flow not found"

**Cause:** Flow ID invalide
**Solution:** Copiez à nouveau le Flow ID depuis Meta Business Manager

### Le bot répond en anglais alors que j'écris en français

**Cause:** Ancienne version du code
**Solution:** Vérifiez que `mastra.ts:268-317` contient le nettoyage des formats ISO

---

## 📚 Documentation Complète

- **Setup détaillé:** `WHATSAPP_FLOW_SETUP.md`
- **Résumé des modifications:** `IMPLEMENTATION_SUMMARY.md`
- **Code source:** `src/whatsapp/client.ts` et `src/whatsapp/webhook.ts`

---

## 🆘 Support

En cas de problème :

1. **Vérifier les logs serveur** (`npm run dev`)
2. **Consulter** `IMPLEMENTATION_SUMMARY.md` section "Support et Dépannage"
3. **Tester le fallback** (retirer Flow ID) pour isoler le problème

---

**Bon courage avec vos tests ! 🎉**
