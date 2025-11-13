# Flow Audio - Inca London WhatsApp Bot

## Vue d'ensemble

Le bot gère les messages audio WhatsApp en les transcrivant, détectant la langue, et répondant dans la langue de l'utilisateur via Mastra.

## Flow Complet

```
Audio WhatsApp → Transcription (Whisper) → Détection langue → Mastra Agent → Réponse texte
```

## Étapes Détaillées

### 1. Réception Audio (webhook.ts:388-424)
```typescript
// WhatsApp envoie l'audio via webhook
mediaId = message.audio?.id || message.voice?.id
```

### 2. Transcription Audio (audio/whisper.ts)
```typescript
processAudioMessage(mediaId, accessToken)
  ├─ getMediaUrl() → Récupère l'URL média WhatsApp
  ├─ downloadAudioFile() → Télécharge en .ogg dans /temp
  └─ transcribeAudio() → OpenAI Whisper API → Texte transcrit
```

**Cleanup automatique** : Fichier temporaire supprimé après transcription

### 3. Détection de Langue (agent/mastra.ts:521-562)
```typescript
detectLanguageWithMastra(transcribedText)
  → Retourne code ISO 639-1 (ex: 'en', 'fr', 'es')
```

**Logique** :
- Nettoie les dates/heures ISO
- Utilise Mastra pour détecter la langue
- Défaut : 'en' si échec ou texte < 3 caractères

### 4. Traitement Mastra (agent/mastra.ts:613-769)
```typescript
processUserMessage(mastra, transcribedText, userId)
  ├─ Récupère l'historique conversation
  ├─ Ajoute contexte: "[User is speaking in {language}...]"
  └─ Agent.generate() → Réponse dans la langue détectée
```

**Instructions système** : L'agent DOIT répondre dans la même langue que l'utilisateur

### 5. Envoi Réponse (whatsapp/client.ts)
```typescript
sendTextMessage(userId, agentResponse.text)
  + Menus PDF si mentionnés
  + Localisation si adresse mentionnée
```

## Fichiers Clés

| Fichier | Rôle |
|---------|------|
| `src/audio/whisper.ts` | Transcription audio (Whisper) |
| `src/whatsapp/webhook.ts` | Réception & routing messages |
| `src/agent/mastra.ts` | Agent IA & détection langue |
| `src/whatsapp/client.ts` | Envoi messages WhatsApp |

## Variables d'Environnement

```env
OPENAI_API_KEY              # Whisper transcription
META_WHATSAPP_TOKEN         # WhatsApp API
META_WHATSAPP_PHONE_NUMBER_ID
META_WEBHOOK_VERIFY_TOKEN
```

## Langues Supportées

Toutes les langues supportées par :
- Whisper (100+ langues)
- OpenAI GPT (réponses multilingues)

## Fonctionnalités

- Auto-cleanup des fichiers temporaires
- Indicateur "typing..." pendant le traitement
- Détection automatique de menus & envoi PDF
- Partage automatique de localisation
- Prévention duplicatas (cache 5 min)
- Contexte de session (ignore messages > 2h)

## Flow Visuel

```
┌─────────────────┐
│  Audio WhatsApp │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Webhook Handler │ (webhook.ts)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Whisper API     │ (whisper.ts)
│ Transcription   │ → "Texte transcrit"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Détection       │ (mastra.ts)
│ Langue          │ → "fr", "en", "es"...
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Mastra Agent    │ (mastra.ts)
│ + Contexte      │ → Réponse en langue user
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Réponse Texte   │ (client.ts)
│ WhatsApp        │
└─────────────────┘
```

## Note Importante

**L'audio n'est jamais envoyé en réponse** - Seul le texte est renvoyé à l'utilisateur, toujours dans sa langue d'origine.
