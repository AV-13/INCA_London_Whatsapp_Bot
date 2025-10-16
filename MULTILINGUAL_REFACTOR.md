# Refactoring Multilingue - Inca London WhatsApp Bot

## Résumé

Le bot WhatsApp d'Inca London a été complètement refactorisé pour être **entièrement multilingue** en utilisant l'IA pour générer dynamiquement tous les textes dans n'importe quelle langue, éliminant ainsi les limitations du dictionnaire de traductions hardcodé.

## Changements Majeurs

### 1. Nouveau Module de Traduction Dynamique (`src/i18n/dynamicTranslation.ts`)

Ce nouveau module remplace complètement le dictionnaire de traductions statique. Il utilise l'IA (via Mastra) pour générer du texte dans n'importe quelle langue en temps réel.

**Fonctions principales:**
- `generateText()` : Génère n'importe quel texte dans n'importe quelle langue
- `generateMenuMessage()` : Génère des messages d'accompagnement pour les PDFs de menus
- `generatePrompt()` : Génère les prompts pour les boutons et listes interactives
- `generateReservationConfirmation()` : Génère les confirmations de réservation complètes
- `generateErrorMessage()` : Génère les messages d'erreur dans la langue de l'utilisateur
- `generateListLabels()` : Traduit les labels de listes (menus, tailles de groupes, etc.)

### 2. Détection Automatique de Langue

**Nouvelle fonction `detectUserLanguage()` dans `webhook.ts`:**
- Détecte automatiquement la langue de l'utilisateur via l'IA
- Met en cache la langue détectée pour éviter des détections répétées (expire après 1h)
- Utilise la fonction existante `detectLanguageWithMastra()` de mastra.ts

### 3. Suppression du Dictionnaire de Traductions

**Avant** (`webhook.ts` lignes 26-160):
```typescript
const TRANSLATIONS: Record<string, Record<string, string>> = {
  viewMenusPrompt: {
    en: 'Would you like to view our menus?',
    fr: 'Souhaitez-vous consulter nos menus ?',
    es: '¿Le gustaría ver nuestros menús?',
    // ... seulement 6 langues supportées
  },
  // ... 100+ lignes de traductions hardcodées
};
```

**Après:**
- Tout le dictionnaire `TRANSLATIONS` a été supprimé
- Les fonctions `translate()` et `getMenuMessage()` ont été supprimées
- Remplacé par des appels dynamiques à l'IA

### 4. Mise à Jour de Toutes les Fonctions

Toutes les fonctions ont été mises à jour pour accepter `mastra` comme paramètre et utiliser la génération dynamique:

- `sendViewMenusButton()` : Génère le prompt et le bouton dans la langue de l'utilisateur
- `sendMenuButtons()` : Génère tous les labels de menus dynamiquement
- `handleMenuButtonClick()` : Génère les messages d'accompagnement des PDFs
- `sendPartySizeButtons()` : Génère les labels de taille de groupe (1-9+ personnes)
- `sendDateRequest()` : Génère la demande de date
- `sendTimeButtons()` : Génère les prompts pour la sélection d'heure
- `sendDurationButtons()` : Génère les prompts pour la durée du repas
- `sendReservationLink()` : Génère la confirmation complète avec URL
- `handleReservationFlow()` : Gère le flux de réservation multilingue
- `handleReservationButtonClick()` : Gère les clics de boutons de réservation

### 5. Gestion des Erreurs Multilingue

Les messages d'erreur sont maintenant générés dans la langue de l'utilisateur:

**Avant:**
```typescript
"I apologize, but I'm experiencing a technical issue..."
```

**Après:**
```typescript
const errorMessage = await generateErrorMessage(mastra, errorLanguage, 'technical');
```

## Avantages

### 1. Support Illimité de Langues
- **Avant**: 6 langues (en, fr, es, de, it, pt)
- **Après**: Toutes les langues supportées par l'IA (100+ langues)

### 2. Flexibilité
- Pas besoin de maintenir un dictionnaire de traductions
- Les traductions sont contextuelles et naturelles
- Facile d'ajouter de nouveaux textes sans modification de code

### 3. Cohérence
- Tous les textes passent par l'IA
- Style de traduction cohérent
- Contexte pris en compte pour chaque génération

### 4. Maintenabilité
- Code plus simple et modulaire
- Un seul endroit pour gérer les traductions (`dynamicTranslation.ts`)
- Pas de duplication de code

## Performance

### Cache de Langue
- La langue de l'utilisateur est détectée une seule fois et mise en cache pour 1 heure
- Réduit les appels à l'IA pour la détection de langue

### Fallbacks
- Chaque fonction a un fallback en anglais en cas d'échec de l'IA
- Assure que le bot fonctionne toujours même si l'IA est temporairement indisponible

## Utilisation

### Exemple: Ajouter un Nouveau Type de Message

```typescript
// 1. Ajouter une description dans dynamicTranslation.ts
const promptDescriptions = {
  'new_message_type': 'Description of what to generate',
  // ...
};

// 2. Utiliser dans webhook.ts
const message = await generatePrompt(mastra, 'new_message_type', language);
await whatsappClient.sendTextMessage(userId, message);
```

### Exemple: Générer un Texte Personnalisé

```typescript
const text = await generateText(
  mastra,
  'A friendly greeting for a returning customer',
  userLanguage,
  'Use a warm and welcoming tone'
);
```

## Tests Recommandés

1. **Test de langues diverses:**
   - Anglais, Français, Espagnol (déjà testés)
   - Chinois, Japonais, Arabe
   - Langues moins courantes

2. **Test des flows:**
   - Demande de menu
   - Réservation complète
   - Gestion des erreurs

3. **Test du cache:**
   - Vérifier que la langue est mise en cache
   - Vérifier l'expiration du cache après 1h

## Prochaines Étapes

### 1. Support Whisper (Speech-to-Text)
- Ajouter le support des messages vocaux
- Transcrire automatiquement avec Whisper
- Traiter le texte transcrit comme un message normal

### 2. Google Maps API (Gestion de Location)
- Ajouter le support des demandes de localisation
- Afficher une carte interactive
- Aider l'utilisateur à fournir son adresse précise

### 3. WhatsApp Flows Multilingues
- Adapter les formulaires WhatsApp Flows
- Générer dynamiquement les labels et descriptions
- Support des menus déroulants multilingues

## Notes Techniques

### Structure des Fichiers
```
src/
├── i18n/
│   └── dynamicTranslation.ts (NOUVEAU)
├── whatsapp/
│   ├── webhook.ts (REFACTORISÉ)
│   └── client.ts
├── agent/
│   └── mastra.ts
└── database/
    └── supabase.ts
```

### Dépendances
- `@mastra/core` : Framework IA utilisé pour la génération de texte
- `@ai-sdk/openai` : Modèle OpenAI (gpt-4o-mini) pour la génération

### Configuration
Aucune configuration supplémentaire requise. Le système utilise les mêmes variables d'environnement que le bot existant:
- `OPENAI_API_KEY` : Clé API OpenAI (déjà configurée)

## Conclusion

Le bot Inca London est maintenant **complètement multilingue** et peut communiquer avec les clients dans n'importe quelle langue. Le code est plus propre, plus maintenable et beaucoup plus flexible qu'avant.

**Nombre de langues supportées:**
- Avant: 6 langues
- Après: Illimité (toutes les langues supportées par l'IA)

**Lignes de code de traductions:**
- Avant: ~130 lignes de dictionnaires hardcodés
- Après: 0 lignes hardcodées, tout est dynamique
