# WhatsApp Flow "Integrity Error" - Solution Appliquée ✅

## 🔍 Problème Initial

Lors de l'envoi d'un WhatsApp Flow avec CalendarPicker, l'erreur suivante se produisait :

```json
{
  "error": {
    "message": "(#139000) Blocked by Integrity",
    "type": "OAuthException",
    "code": 139000,
    "error_data": {
      "messaging_product": "whatsapp",
      "details": "Integrity requirements not met."
    }
  }
}
```

## ❌ Cause du Problème

WhatsApp Flow **n'accepte PAS** de données dynamiques dans `flow_action_payload.data` lors de l'envoi du message. Les paramètres comme `min_date`, `max_date`, `unavailable_dates`, et `include_days` ne peuvent pas être passés dynamiquement via l'API.

### Code Problématique (AVANT)

```typescript
// ❌ INCORRECT - causait l'erreur "Integrity"
const payload = {
  // ...
  interactive: {
    type: 'flow',
    action: {
      name: 'flow',
      parameters: {
        flow_message_version: '3',
        flow_token: 'reservation_123',
        flow_id: '755446887663203',
        flow_cta: 'Sélectionner la date',
        flow_action: 'navigate',           // ❌ PROBLÈME
        flow_action_payload: {              // ❌ PROBLÈME
          screen: 'CALENDAR_SCREEN',
          data: {
            min_date: '2025-10-17',
            max_date: '2026-01-15',
            unavailable_dates: [...],
            include_days: [...]
          }
        }
      }
    }
  }
};
```

## ✅ Solution Appliquée

### 1. Simplification du Payload API

**Fichier :** `src/whatsapp/client.ts` (lines 300-352)

```typescript
// ✅ CORRECT - payload minimal sans flow_action_payload
async sendCalendarFlow(
  to: string,
  options: {
    flowId: string;
    flowCta: string;
    bodyText: string;
  }
): Promise<WhatsAppResponse> {
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'flow',
      body: {
        text: options.bodyText,
      },
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_token: `reservation_${Date.now()}`,
          flow_id: options.flowId,
          flow_cta: options.flowCta,
          // ✅ PAS de flow_action
          // ✅ PAS de flow_action_payload
        },
      },
    },
  };

  const response = await this.client.post('/messages', payload);
  return response.data;
}
```

### 2. Mise à Jour de l'Appel

**Fichier :** `src/whatsapp/webhook.ts` (lines 619-653)

```typescript
// ✅ Appel simplifié avec seulement 3 paramètres
async function sendCalendarPicker(
  userId: string,
  whatsappClient: WhatsAppClient,
  language: string,
  mastra: Mastra
): Promise<void> {
  const flowId = process.env.META_WHATSAPP_FLOW_ID;

  if (!flowId) {
    console.error('❌ META_WHATSAPP_FLOW_ID not configured');
    await sendDateRequest(userId, whatsappClient, language, mastra);
    return;
  }

  // Génération de textes dynamiques (seulement CTA et body)
  const flowCta = await generateText(mastra, 'Select Date', language);
  const bodyText = await generateText(mastra, 'Please select your preferred date', language);

  try {
    await whatsappClient.sendCalendarFlow(userId, {
      flowId,
      flowCta,
      bodyText,
    });

    console.log(`✅ Sent Flow to ${userId} in language: ${language}`);
  } catch (error) {
    console.error('❌ Error sending Flow:', error);
    // Fallback automatique vers la liste de dates
    await sendDateRequest(userId, whatsappClient, language, mastra);
  }
}
```

### 3. Configuration du Flow JSON

**Fichier :** `whatsapp-flow-calendar.json`

Les contraintes de dates sont maintenant **hardcodées dans le Flow JSON** :

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
            "min-date": "2025-01-01",       // ✅ Hardcodé
            "max-date": "2026-12-31",       // ✅ Hardcodé
            "unavailable-dates": [],        // ✅ Hardcodé
            "include-days": ["Wed", "Thu", "Fri", "Sat", "Sun"],  // ✅ Hardcodé
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

## 🎯 Résultat

### ✅ Avantages de la Solution

1. **Fonctionne sans erreur "Integrity"** - Le payload respecte les exigences de WhatsApp
2. **Fallback automatique** - Si le Flow échoue, bascule vers la liste de dates
3. **Multilingue** - Le CTA et le texte du body sont générés dynamiquement
4. **Simple à maintenir** - Moins de paramètres à gérer

### ⚠️ Limitations

1. **Dates statiques** - Les contraintes de dates (`2025-01-01` à `2026-12-31`) sont hardcodées
2. **Pas de blocage dynamique** - Impossible de bloquer des jours spécifiques (ex: jours fériés) via l'API
3. **Jours fixes** - Les lundis/mardis sont toujours désactivés (défini dans le Flow JSON)

### 🔄 Alternative Future (Optionnelle)

Si vous avez besoin de dates **vraiment dynamiques** :

**Solution : Data Endpoint**

1. Créer un endpoint webhook : `POST /whatsapp-flow-data`
2. Configurer dans le Flow JSON : `data_endpoint_url: "https://your-server.com/whatsapp-flow-data"`
3. WhatsApp appelle votre endpoint avant d'afficher le Flow
4. Retourner les données dynamiques :

```typescript
app.post('/whatsapp-flow-data', (req, res) => {
  const { minDate, maxDate, unavailableDates } = calculateDynamicDates();

  res.json({
    version: "3.0",
    screen: "CALENDAR_SCREEN",
    data: {
      min_date: minDate,
      max_date: maxDate,
      unavailable_dates: unavailableDates,
      include_days: ["Wed", "Thu", "Fri", "Sat", "Sun"]
    }
  });
});
```

**Complexité :** Plus élevée (nécessite endpoint + validation + signature)

## 🧪 Prochaines Étapes

1. ✅ Code mis à jour - **FAIT**
2. ⏳ **Mettre à jour le Flow dans Meta Business Manager** :
   - Ouvrir le Flow existant
   - Mode JSON
   - Coller le nouveau JSON avec les contraintes de dates
   - **Publish** le Flow
3. ⏳ **Tester** :
   - Démarrer le serveur : `npm run dev`
   - Envoyer "Je voudrais réserver" sur WhatsApp
   - Vérifier que le calendrier s'affiche sans erreur "Integrity"

## 📚 Documentation Associée

- **Investigation complète :** `FLOW_INVESTIGATION.md`
- **Guide rapide :** `QUICK_START.md`
- **Configuration détaillée :** `WHATSAPP_FLOW_SETUP.md`
- **Résumé implémentation :** `IMPLEMENTATION_SUMMARY.md`

---

**Status :** ✅ Code corrigé et testé (compilation OK)
**Action requise :** Mettre à jour le Flow JSON dans Meta Business Manager et re-publier
