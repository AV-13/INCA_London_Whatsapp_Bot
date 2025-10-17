# Résumé de l'Implémentation - CalendarPicker & Améliorations

## Vue d'ensemble

Ce document récapitule toutes les modifications apportées au projet Inca London WhatsApp Bot pour implémenter :

1. ✅ **CalendarPicker WhatsApp Flow** - Interface calendrier interactive pour la sélection de date
2. ✅ **Détection de langue améliorée** - Ignore les formats ISO (YYYY-MM-DD, HH:MM)
3. ✅ **Flux de réservation complet** - Personnes → Calendrier → Heure → Durée → Confirmation

## Modifications Apportées

### 1. `src/agent/mastra.ts`

**Fonction modifiée: `detectLanguageWithMastra()`**

- Nettoie les messages avant détection de langue
- Supprime les dates ISO (YYYY-MM-DD) et heures (HH:MM) pour éviter les fausses détections
- Améliore la précision de la détection de langue

```typescript
// Avant: Mastra détectait "2024-10-21" comme de l'anglais
// Après: Mastra ignore les formats ISO et se concentre sur le texte réel
```

**Lignes modifiées:** 268-317

---

### 2. `src/whatsapp/client.ts`

**Nouvelle méthode: `sendCalendarFlow()`**

- Envoie un WhatsApp Flow avec composant CalendarPicker
- Gère la configuration dynamique des dates disponibles
- Prend en charge les textes multilingues

```typescript
await whatsappClient.sendCalendarFlow(userId, {
  calendarLabel: "Sélectionnez une date",
  helperText: "Choisissez la date de votre réservation",
  footerLabel: "Continuer",
  minDate: "2025-10-17",
  maxDate: "2026-01-15",
  unavailableDates: ["2025-10-20", "2025-10-21"], // Lun & Mar
  includeDays: ['Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  flowId: process.env.META_WHATSAPP_FLOW_ID,
  flowCta: "Sélectionner",
  bodyText: "Veuillez sélectionner votre date préférée"
});
```

**Lignes ajoutées:** 300-374

---

### 3. `src/whatsapp/webhook.ts`

#### 3.1 Interface `WhatsAppWebhookMessage` étendue

**Ajout du type `nfm_reply`** pour gérer les réponses des Flows

```typescript
interface WhatsAppWebhookMessage {
  // ... autres propriétés
  interactive?: {
    type: 'button_reply' | 'list_reply' | 'nfm_reply'; // ← Nouveau type
    nfm_reply?: {
      name: string;
      body: string;
      response_json: string; // Contient la date sélectionnée
    };
  };
}
```

**Lignes modifiées:** 90-129

#### 3.2 Nouvelle fonction: `calculateAvailableDateRange()`

- Calcule automatiquement les dates disponibles (aujourd'hui + 90 jours)
- Exclut les lundis et mardis (restaurant fermé)
- Retourne `minDate`, `maxDate`, et `unavailableDates`

**Lignes ajoutées:** 495-521

#### 3.3 Nouvelle fonction: `sendCalendarPicker()`

- Envoie le Flow CalendarPicker avec configuration dynamique
- Génère les textes dans la langue de l'utilisateur via Mastra
- Fallback automatique vers une liste de dates si le Flow ID n'est pas configuré

**Lignes ajoutées:** 523-579

#### 3.4 Fonction mise à jour: `sendTimeButtons()`

- Affiche une liste de créneaux horaires (19:00 - 22:30)
- Génère les labels dans la langue de l'utilisateur
- Format 24h avec équivalent 12h entre parenthèses

**Lignes ajoutées:** 581-626

#### 3.5 Fonction mise à jour: `handleReservationButtonClick()`

- Appelle `sendCalendarPicker()` au lieu de `sendDateRequest()` après la sélection du nombre de personnes
- Gère les réponses du Flow (`reservation_flow_date_`)
- Conserve le fallback pour les sélections de liste (`reservation_date_`)

**Lignes modifiées:** 694-749

#### 3.6 Handler des réponses Flow dans `processIncomingMessage()`

- Parse les réponses du Flow WhatsApp (`nfm_reply`)
- Extrait la date sélectionnée du JSON
- Crée un ID de bouton simulé pour le traiter avec le flux existant

```typescript
// Exemple de réponse Flow parsée:
{
  "calendar": "2025-10-21"
}
// → Converti en: "reservation_flow_date_2025-10-21"
```

**Lignes modifiées:** 864-897

---

### 4. Fichiers de Configuration

#### 4.1 `.env.example`

**Nouvelle variable ajoutée:**

```env
# WhatsApp Flow ID for CalendarPicker (optional - falls back to date list if not set)
META_WHATSAPP_FLOW_ID=your_whatsapp_flow_id_here
```

#### 4.2 `WHATSAPP_FLOW_SETUP.md` (nouveau fichier)

Guide complet pour :
- Créer un WhatsApp Flow dans Meta Business Manager
- Configurer le CalendarPicker avec le JSON approprié
- Récupérer et configurer le Flow ID
- Dépanner les problèmes courants

---

## Flux de Réservation Final

```
Utilisateur: "Je voudrais réserver"
    ↓
Bot: Liste → "Combien de personnes ?" (1-8, 9+)
    ↓
Utilisateur: Sélectionne "2 personnes"
    ↓
Bot: WhatsApp Flow → Calendrier interactif
    • Lundis/Mardis désactivés
    • 90 jours disponibles
    • Interface native WhatsApp
    ↓
Utilisateur: Sélectionne "2025-10-21"
    ↓
Bot: Liste → "Quelle heure ?" (19:00-22:30 par tranches de 30min)
    ↓
Utilisateur: Sélectionne "20:00"
    ↓
Bot: Boutons → "Durée du repas ?" (1h30, 2h, 2h30)
    ↓
Utilisateur: Sélectionne "2h"
    ↓
Bot: Message texte → Lien SevenRooms pré-rempli
    "Voici votre lien de réservation pour 2 personnes
     le 21 octobre 2025 à 20:00 (durée: 2h)
     https://www.sevenrooms.com/...?date=2025-10-21&party_size=2&..."
```

---

## Avantages de l'Implémentation

### ✅ CalendarPicker

- **Interface native WhatsApp** : Expérience utilisateur fluide et professionnelle
- **Visualisation claire** : L'utilisateur voit le mois complet avec jours disponibles/indisponibles
- **Réduction des erreurs** : Impossible de sélectionner un lundi/mardi ou une date invalide
- **Multi-langue** : Tous les textes sont générés dans la langue de l'utilisateur

### ✅ Détection de Langue Améliorée

- **Précision accrue** : Les dates et heures n'influencent plus la détection
- **Support multilingue** : Fonctionne correctement en français, espagnol, etc.
- **Robustesse** : Fallback intelligent en cas d'échec

### ✅ Fallback Automatique

- **Pas de dépendance stricte** : Si le Flow ID n'est pas configuré, le système utilise une liste
- **Résilience** : En cas d'erreur avec le Flow, bascule automatiquement sur la liste
- **Aucune interruption** : L'utilisateur peut toujours compléter sa réservation

---

## Configuration Requise

### Variables d'Environnement

```env
# Obligatoires (déjà existantes)
OPENAI_API_KEY=sk-...
META_WHATSAPP_TOKEN=...
META_WHATSAPP_PHONE_NUMBER_ID=...

# Nouvelle (optionnelle)
META_WHATSAPP_FLOW_ID=1234567890123456
```

### Prérequis WhatsApp Business

1. **Compte Meta Business Manager** avec accès à WhatsApp
2. **WhatsApp Business API** activé
3. **WhatsApp Flow** créé et publié (voir `WHATSAPP_FLOW_SETUP.md`)
4. **Webhook** configuré pour recevoir les messages

---

## Tests à Effectuer

### Test 1: Flux de Réservation Complet avec CalendarPicker

1. Envoyer : "Je voudrais réserver une table"
2. Vérifier : Liste des nombres de personnes s'affiche
3. Sélectionner : "2 personnes"
4. Vérifier : CalendarPicker s'affiche avec :
   - Dates disponibles en vert
   - Lundis/Mardis en gris (désactivés)
   - Minimum aujourd'hui, maximum dans 90 jours
5. Sélectionner : Une date (ex: mercredi prochain)
6. Vérifier : Liste des heures s'affiche (19:00-22:30)
7. Sélectionner : Une heure (ex: 20:00)
8. Vérifier : Boutons de durée s'affichent (1h30, 2h, 2h30)
9. Sélectionner : Une durée (ex: 2h)
10. Vérifier : Message de confirmation avec lien SevenRooms pré-rempli

### Test 2: Détection de Langue avec Formats ISO

1. Envoyer en français : "Je veux réserver pour le 2025-10-21 à 19:00"
2. Vérifier : Le bot répond en français (pas en anglais)
3. Vérifier dans les logs : La date et l'heure ont été nettoyées avant détection

### Test 3: Fallback vers Liste de Dates

1. Retirer `META_WHATSAPP_FLOW_ID` du `.env`
2. Redémarrer le serveur
3. Démarrer un flux de réservation
4. Vérifier : Une liste de dates s'affiche au lieu du calendrier
5. Vérifier : Le flux continue normalement jusqu'au lien final

### Test 4: Gestion d'Erreur du Flow

1. Configurer un Flow ID invalide dans `.env`
2. Démarrer un flux de réservation
3. Vérifier : Le système bascule automatiquement sur la liste de dates
4. Vérifier dans les logs : Message d'erreur puis "Falling back to date request list"

---

## Prochaines Étapes (Optionnelles)

### Améliorations Possibles

1. **Ajout d'un Flow pour l'heure**
   - Remplacer la liste d'heures par un TimePicker
   - Meilleure expérience utilisateur

2. **Intégration SevenRooms API**
   - Vérifier la disponibilité en temps réel
   - Confirmer la réservation directement
   - Plus besoin de rediriger vers le site

3. **Notifications de rappel**
   - Envoyer un message 24h avant la réservation
   - Demander confirmation ou permettre modification

4. **Analytics et Reporting**
   - Suivre le taux de complétion du flux
   - Identifier les points de friction
   - Optimiser l'expérience utilisateur

---

## Support et Dépannage

### Problème : Le calendrier ne s'affiche pas

**Vérifications:**
- ✅ `META_WHATSAPP_FLOW_ID` est configuré dans `.env`
- ✅ Le Flow est publié dans Meta Business Manager
- ✅ Consulter les logs serveur pour voir les erreurs

### Problème : Les dates ne sont pas filtrées

**Solution:**
- Vérifier `calculateAvailableDateRange()` dans `webhook.ts:495-521`
- Vérifier que `dayOfWeek === 1` (lundi) et `dayOfWeek === 2` (mardi)

### Problème : Le webhook ne reçoit pas les réponses

**Vérifications:**
- ✅ Webhook configuré dans Meta Business Manager
- ✅ URL publique accessible (ngrok actif)
- ✅ Type `nfm_reply` bien géré dans le code

### Logs Utiles

```bash
# Voir les logs du serveur
npm run dev

# Rechercher les logs spécifiques
grep "Flow response received" logs/*
grep "Calendar date selected" logs/*
grep "Detected language" logs/*
```

---

## Références

- **Documentation WhatsApp Flows:** https://developers.facebook.com/docs/whatsapp/flows
- **CalendarPicker Component:** https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson/components/calendarpicker
- **Meta Business Manager:** https://business.facebook.com/
- **Guide de Configuration:** `WHATSAPP_FLOW_SETUP.md`

---

**Date d'implémentation:** 17 octobre 2025
**Statut:** ✅ Prêt pour tests et déploiement
