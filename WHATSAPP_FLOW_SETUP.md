# WhatsApp Flow CalendarPicker Setup Guide

Ce guide explique comment configurer le WhatsApp Flow avec CalendarPicker pour permettre aux utilisateurs de sélectionner une date via une interface de calendrier interactive.

## Prérequis

- Un compte Meta Business Manager
- Une application WhatsApp Business configurée
- Accès à Meta Business Manager > WhatsApp > Flows

## Étapes de Configuration

### 1. Créer un Flow WhatsApp dans Meta Business Manager

1. Connectez-vous à [Meta Business Manager](https://business.facebook.com/)
2. Allez dans **WhatsApp** > **Flows**
3. Cliquez sur **Create Flow**
4. Donnez un nom à votre Flow : "Inca London - Date Selection"

### 2. Configurer le Flow avec JSON

Dans l'éditeur de Flow, utilisez le mode JSON et collez la configuration suivante :

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

**Note:** Les paramètres dynamiques (`min-date`, `max-date`, `unavailable-dates`, `include-days`) sont automatiquement injectés par notre application au moment de l'envoi du Flow.

### 3. Publier le Flow

1. Cliquez sur **Publish** pour publier votre Flow
2. Copiez l'**Flow ID** qui apparaît (format: `1234567890123456`)

### 4. Configurer les Variables d'Environnement

Ajoutez le Flow ID à votre fichier `.env` :

```env
# WhatsApp Flow Configuration
META_WHATSAPP_FLOW_ID=votre_flow_id_ici
```

### 5. Configuration du Webhook

Le webhook est déjà configuré pour gérer les réponses du Flow. Quand l'utilisateur sélectionne une date, le webhook reçoit un message de type `nfm_reply` avec le format suivant :

```json
{
  "type": "interactive",
  "interactive": {
    "type": "nfm_reply",
    "nfm_reply": {
      "name": "flow",
      "response_json": "{\"calendar\":\"2025-10-21\"}",
      "body": "Date selected"
    }
  }
}
```

Notre code dans `webhook.ts` parse automatiquement cette réponse et continue le flux de réservation.

## Flux de Réservation Complet

Voici le flux complet tel qu'implémenté :

1. **Nombre de personnes** (Liste interactive)
   - L'utilisateur sélectionne le nombre de convives (1-8 ou 9+)

2. **Date** (WhatsApp Flow avec CalendarPicker)
   - L'utilisateur voit un calendrier interactif
   - Les lundis et mardis sont automatiquement désactivés (restaurant fermé)
   - Les dates sont limitées aux 90 prochains jours

3. **Heure** (Liste interactive)
   - L'utilisateur sélectionne l'heure de réservation (19:00 - 22:30)

4. **Durée** (Boutons)
   - L'utilisateur choisit la durée du repas (1h30, 2h, 2h30)

5. **Confirmation** (Message avec lien)
   - L'utilisateur reçoit un lien vers SevenRooms avec tous les paramètres pré-remplis

## Fallback

Si le Flow ID n'est pas configuré ou si une erreur se produit, le système bascule automatiquement sur une liste interactive simple avec les dates des 30 prochains jours organisées par semaine.

## Détection de Langue

Le système détecte automatiquement la langue de l'utilisateur et génère tous les textes du Flow dans cette langue via l'agent Mastra. Les formats ISO (YYYY-MM-DD, HH:MM) sont ignorés lors de la détection de langue pour éviter les fausses détections d'anglais.

## Dépannage

### Le calendrier ne s'affiche pas
- Vérifiez que `META_WHATSAPP_FLOW_ID` est bien configuré dans `.env`
- Vérifiez que le Flow est publié dans Meta Business Manager
- Consultez les logs du serveur pour voir si une erreur se produit

### Les dates ne sont pas filtrées correctement
- Vérifiez la fonction `calculateAvailableDateRange()` dans `webhook.ts`
- Les lundis (dayOfWeek === 1) et mardis (dayOfWeek === 2) doivent être dans `unavailableDates`

### Le webhook ne reçoit pas les réponses du Flow
- Vérifiez que le webhook est bien configuré dans Meta Business Manager
- Vérifiez que le type `nfm_reply` est bien géré dans `WhatsAppWebhookMessage` interface
- Consultez les logs pour voir si le message est bien parsé

## Références

- [WhatsApp Flows Documentation](https://developers.facebook.com/docs/whatsapp/flows)
- [CalendarPicker Component](https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson/components/calendarpicker)
