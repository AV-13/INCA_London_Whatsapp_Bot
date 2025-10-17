# Investigation du Problème WhatsApp Flow

## 🔍 Erreur Rencontrée

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

## 🐛 Problème Identifié

### Ce que nous faisons actuellement (INCORRECT) ❌

```typescript
const payload = {
  messaging_product: 'whatsapp',
  to: '33649712311',
  type: 'interactive',
  interactive: {
    type: 'flow',
    header: { type: 'text', text: 'Quelle date...' },
    body: { text: 'Veuillez sélectionner...' },
    action: {
      name: 'flow',
      parameters: {
        flow_message_version: '3',
        flow_token: 'reservation_1729180000',
        flow_id: '755446887663203',
        flow_cta: 'Sélectionner la date',
        flow_action: 'navigate',
        flow_action_payload: {
          screen: 'CALENDAR_SCREEN',
          data: {                           // ❌ PROBLÈME ICI
            calendar_label: '...',
            helper_text: '...',
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

**Pourquoi ça échoue :**
1. WhatsApp Flow n'accepte PAS de données dynamiques dans `flow_action_payload.data`
2. Les paramètres `min_date`, `max_date`, etc. doivent être **dans le Flow JSON lui-même**
3. Ou bien, ils doivent être fournis via un **Data Endpoint** (webhook) que WhatsApp appelle

## ✅ Solutions Possibles

### Solution 1 : Simplifier le Payload (RECOMMANDÉ)

Envoyer uniquement le Flow sans données dynamiques :

```typescript
const payload = {
  messaging_product: 'whatsapp',
  recipient_type: 'individual',
  to: '33649712311',
  type: 'interactive',
  interactive: {
    type: 'flow',
    body: {
      text: 'Veuillez sélectionner votre date préférée'
    },
    action: {
      name: 'flow',
      parameters: {
        flow_message_version: '3',
        flow_token: 'reservation_1729180000',
        flow_id: '755446887663203',
        flow_cta: 'Sélectionner la date'
        // ❌ PAS de flow_action
        // ❌ PAS de flow_action_payload
      }
    }
  }
};
```

### Solution 2 : Utiliser un Data Endpoint

1. **Créer un endpoint webhook** qui retourne les données dynamiques
2. **Configurer le Flow** pour appeler cet endpoint
3. **L'endpoint retourne** :

```json
{
  "version": "3.0",
  "screen": "CALENDAR_SCREEN",
  "data": {
    "min_date": "2025-10-17",
    "max_date": "2026-01-15",
    "unavailable_dates": ["2025-10-20", "2025-10-21"],
    "include_days": ["Wed", "Thu", "Fri", "Sat", "Sun"]
  }
}
```

### Solution 3 : Dates Statiques dans le Flow JSON

Modifier le Flow dans Meta Business Manager pour avoir des dates hardcodées :

```json
{
  "type": "CalendarPicker",
  "name": "calendar",
  "min-date": "2025-01-01",
  "max-date": "2026-12-31",
  "unavailable-dates": [],
  "include-days": ["Wed", "Thu", "Fri", "Sat", "Sun"]
}
```

## 🎯 Solution Immédiate Recommandée

**Simplifier le payload** pour ne PAS envoyer de données dynamiques.

### Modifications à Apporter

#### 1. Mettre à jour `sendCalendarFlow()` dans `client.ts`

```typescript
async sendCalendarFlow(
  to: string,
  options: {
    flowId: string;
    flowCta: string;
    bodyText: string;
  }
): Promise<WhatsAppResponse> {
  try {
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
          },
        },
      },
    };

    console.log(`📤 Sending WhatsApp Flow to ${to}`);
    console.log(`   Flow ID: ${options.flowId}`);

    const response = await this.client.post('/messages', payload);

    console.log('✅ Flow sent successfully');
    return response.data;
  } catch (error: any) {
    console.error('❌ Error sending WhatsApp Flow:', error.response?.data || error.message);
    throw new Error(`Failed to send WhatsApp Flow: ${error.message}`);
  }
}
```

#### 2. Mettre à jour `sendCalendarPicker()` dans `webhook.ts`

```typescript
async function sendCalendarPicker(
  userId: string,
  whatsappClient: WhatsAppClient,
  language: string,
  mastra: Mastra
): Promise<void> {
  const flowId = process.env.META_WHATSAPP_FLOW_ID;

  if (!flowId) {
    console.error('❌ META_WHATSAPP_FLOW_ID not configured in .env');
    await sendDateRequest(userId, whatsappClient, language, mastra);
    return;
  }

  // Generate dynamic texts
  const flowCta = await generateText(mastra, 'Select Date', language);
  const bodyText = await generateText(mastra, 'Please select your preferred date for the reservation', language);

  try {
    await whatsappClient.sendCalendarFlow(userId, {
      flowId,
      flowCta,
      bodyText,
    });

    console.log(`✅ Sent Flow to ${userId} in language: ${language}`);
  } catch (error) {
    console.error('❌ Error sending Flow:', error);
    console.log('   Falling back to date request list');
    await sendDateRequest(userId, whatsappClient, language, mastra);
  }
}
```

#### 3. Mettre à jour le Flow JSON dans Meta Business Manager

Le Flow doit avoir des dates **hardcodées** :

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
              "name": "complete",
              "payload": {
                "calendar": "${form.calendar}"
              }
            }
          }
        ]
      }
    }
  ]
}
```

**Note :** Les lundis/mardis seront toujours affichés mais désactivés grâce à `include-days`.

## 🔄 Alternative : Data Endpoint (Plus Complexe)

Si vous voulez des dates vraiment dynamiques, il faut :

1. **Créer un endpoint** : `POST /whatsapp-flow-data`
2. **Configurer dans le Flow** : `data_endpoint_url: "https://your-server.com/whatsapp-flow-data"`
3. **WhatsApp appelle votre endpoint** avant d'afficher le Flow
4. **Vous retournez** les données dynamiques

### Exemple d'Endpoint

```typescript
app.post('/whatsapp-flow-data', (req, res) => {
  const { minDate, maxDate, unavailableDates } = calculateAvailableDateRange();

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

## 📊 Comparaison des Solutions

| Solution | Complexité | Dates Dynamiques | Temps d'Implémentation |
|----------|-----------|------------------|------------------------|
| **Solution 1 : Payload Simplifié** | ⭐ Faible | ❌ Non | 🚀 15 minutes |
| **Solution 2 : Data Endpoint** | ⭐⭐⭐ Élevée | ✅ Oui | 🕐 2 heures |
| **Solution 3 : Dates Hardcodées** | ⭐ Faible | ❌ Non | 🚀 10 minutes |

## 🎯 Recommandation Finale

**Pour l'instant : Solution 1 (Payload Simplifié)**

1. Dates hardcodées dans le Flow : `2025-01-01` à `2026-12-31`
2. `include-days` désactive lundis/mardis
3. Payload minimal sans `flow_action_payload`

**Plus tard (optionnel) : Solution 2 (Data Endpoint)**

Si vous voulez vraiment des dates dynamiques (par exemple, bloquer les jours fériés spécifiques).

## 🔧 Prochaines Étapes

1. ✅ Simplifier `sendCalendarFlow()` pour retirer `flow_action_payload` - **FAIT**
2. ✅ Mettre à jour le Flow JSON dans Meta Business Manager - **JSON prêt**
3. ⏳ Re-publier le Flow dans Meta Business Manager
4. ⏳ Tester avec le nouveau payload simplifié

## ✅ Changements Appliqués

### 1. `src/whatsapp/client.ts` (lines 300-352)

Simplifié la méthode `sendCalendarFlow()` :

```typescript
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
      body: { text: options.bodyText },
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_token: `reservation_${Date.now()}`,
          flow_id: options.flowId,
          flow_cta: options.flowCta,
          // ✅ NO flow_action or flow_action_payload
        }
      }
    }
  };
  // ... send logic
}
```

### 2. `src/whatsapp/webhook.ts` (lines 619-653)

Simplifié `sendCalendarPicker()` :

```typescript
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

  const flowCta = await generateText(mastra, 'Select Date', language);
  const bodyText = await generateText(mastra, 'Please select your preferred date', language);

  await whatsappClient.sendCalendarFlow(userId, {
    flowId,
    flowCta,
    bodyText,
  });
}
```

### 3. `whatsapp-flow-calendar.json`

Ajouté les contraintes de dates **dans le Flow JSON** :

```json
{
  "type": "CalendarPicker",
  "name": "calendar",
  "min-date": "2025-01-01",
  "max-date": "2026-12-31",
  "unavailable-dates": [],
  "include-days": ["Wed", "Thu", "Fri", "Sat", "Sun"]
}
```

**Note :** Les lundis/mardis ne seront pas affichés grâce à `include-days`.
