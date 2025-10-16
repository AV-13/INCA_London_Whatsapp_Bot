# Guide de Test - Inca London WhatsApp Bot

## 🚀 Démarrage Rapide

```bash
# 1. Compiler le projet
npm run build

# 2. Démarrer le serveur
npm start

# 3. (Dans un autre terminal) Démarrer ngrok
ngrok http 3000
```

---

## 📋 Scénarios de Test

### 1. Test Multilingue 🌍

#### Test 1.1 : Français
1. Envoyer : `Bonjour`
2. ✅ Vérifier : Réponse en français
3. Envoyer : `Je voudrais voir le menu`
4. ✅ Vérifier : Bouton "Voir les Menus" en français
5. Cliquer sur le bouton
6. ✅ Vérifier : Liste des menus en français

#### Test 1.2 : Changement de Langue
1. Envoyer : `Bonjour` (français)
2. ✅ Vérifier : Réponse en français
3. Envoyer : `Show me the wine menu` (anglais)
4. ✅ Vérifier : Réponse en anglais
5. Envoyer : `Gracias` (espagnol)
6. ✅ Vérifier : Réponse en espagnol

#### Test 1.3 : Langues Exotiques
1. Envoyer : `こんにちは` (japonais : "Bonjour")
2. ✅ Vérifier : Réponse en japonais
3. Envoyer : `你好` (chinois : "Bonjour")
4. ✅ Vérifier : Réponse en chinois
5. Envoyer : `مرحبا` (arabe : "Bonjour")
6. ✅ Vérifier : Réponse en arabe

### 2. Test Réservation avec Multilingue 🍽️

#### Test 2.1 : Réservation en Français
1. Envoyer : `Je voudrais réserver une table`
2. ✅ Vérifier : Prompt "Pour combien de personnes" en français
3. Cliquer sur "2 personnes"
4. ✅ Vérifier : Demande de date en français
5. Envoyer : `2025-10-25`
6. ✅ Vérifier : Sélection d'heure en français
7. Cliquer sur `20:00`
8. ✅ Vérifier : Sélection de durée en français
9. Cliquer sur `2h00`
10. ✅ Vérifier : Confirmation avec lien SevenRooms en français

#### Test 2.2 : Les Boutons Préservent la Langue
1. Envoyer : `Hola` (espagnol)
2. ✅ Vérifier : Réponse en espagnol
3. Envoyer : `Quiero hacer una reserva`
4. Cliquer sur plusieurs boutons (taille du groupe, heure, etc.)
5. ✅ Vérifier : TOUS les messages restent en espagnol (pas de retour à l'anglais)

### 3. Test Whisper (Messages Vocaux) 🎤

#### Test 3.1 : Note Vocale Simple
1. Enregistrer une note vocale : "Bonjour, je voudrais voir le menu"
2. Envoyer via WhatsApp
3. ✅ Vérifier :
   - Log console : `🎤 Audio/Voice message received`
   - Log console : `✅ Transcription: "Bonjour, je voudrais voir le menu"`
   - Message bot : `🎤 J'ai entendu : "Bonjour, je voudrais voir le menu"`
   - Bouton "Voir les Menus" envoyé

#### Test 3.2 : Note Vocale en Anglais
1. Enregistrer : "Hello, I would like to make a reservation for 4 people"
2. Envoyer
3. ✅ Vérifier :
   - Transcription correcte
   - Confirmation en anglais
   - Début du processus de réservation en anglais

#### Test 3.3 : Note Vocale avec Accent
1. Enregistrer avec un fort accent français : "I want to book a table"
2. Envoyer
3. ✅ Vérifier : Transcription fonctionnelle (peut avoir des variations)

### 4. Test Location (Google Maps) 📍

#### Test 4.1 : Partage de Location
1. Dans WhatsApp, cliquer sur le bouton 📍
2. Partager votre localisation actuelle
3. ✅ Vérifier :
   - Log console : `📍 Location received: lat, lon`
   - Calcul de distance affiché
   - Adresse du restaurant fournie
   - Lien Google Maps pour directions
   - Format : `https://www.google.com/maps/dir/?api=1&origin=...&destination=...`

#### Test 4.2 : Location Proche vs Lointaine
1. Partager une location à < 1km du restaurant
2. ✅ Vérifier : Message mentionne "très proche"
3. Partager une location à > 5km
4. ✅ Vérifier : Message mentionne la distance exacte

#### Test 4.3 : Multilingue avec Location
1. Envoyer : `¿Dónde está el restaurante?` (espagnol)
2. Partager votre location
3. ✅ Vérifier : Réponse avec directions en espagnol

### 5. Test Menus (Flux Complet) 📋

#### Test 5.1 : Demande de Menu Simple
1. Envoyer : `Show me the wine menu`
2. ✅ Vérifier : Bouton "View Menus"
3. Cliquer sur le bouton
4. ✅ Vérifier : Liste avec 4 menus
5. Cliquer sur "Wine"
6. ✅ Vérifier : PDF du menu vin envoyé avec message d'accompagnement

#### Test 5.2 : Tous les Menus
1. Envoyer : `I want to see all menus`
2. ✅ Vérifier : 4 PDFs envoyés (À la carte, Wagyu, Wine, Drinks)

### 6. Test Gestion d'Erreurs ❌

#### Test 6.1 : Erreur Transcription Audio
1. Envoyer un fichier audio corrompu ou très bruyant
2. ✅ Vérifier : Message d'erreur poli dans la langue de l'utilisateur

#### Test 6.2 : Erreur Base de Données
1. Arrêter Supabase temporairement
2. Envoyer un message
3. ✅ Vérifier : Message d'erreur technique avec contact info
4. Redémarrer Supabase
5. ✅ Vérifier : Retour à la normale

---

## 🔍 Logs à Surveiller

### Logs Normaux (Succès)
```
🌍 Detecting language from history: "Bonjour"
🌍 Detected language: fr
🎤 Audio/Voice message received
✅ Transcription: "Je voudrais voir le menu"
📍 Location received: 51.5137, -0.1410
✅ Sent "View Menus" button to 33649712311 in language: fr
```

### Logs d'Erreur à Investiguer
```
❌ Error transcribing audio: [error]
❌ Error processing location: [error]
❌ Error getting/creating conversation: [error]
🌍 Button click detected, no valid history - defaulting to English
```

---

## 🐛 Problèmes Connus et Solutions

### Problème : Les boutons reviennent à l'anglais
**Cause** : L'historique ne contient que des IDs de boutons, pas de texte réel

**Solution** : Déjà implémentée - le système ignore les IDs de boutons et cherche le dernier message texte

**Test** :
1. Envoyer : `Bonjour` (français)
2. Cliquer sur 5 boutons différents
3. ✅ Vérifier : Tous les messages restent en français

### Problème : Whisper ne transcrit pas bien
**Cause** : Audio de mauvaise qualité ou langue mal détectée

**Solution** :
- Le système fournit un hint de langue basé sur l'historique
- Améliorer la qualité de l'audio
- Parler plus clairement

### Problème : Location ne fonctionne pas
**Cause** : Permissions WhatsApp ou problème réseau

**Test** :
1. Vérifier que l'utilisateur a autorisé WhatsApp à accéder à la localisation
2. Vérifier les logs console pour détails de l'erreur

---

## 📊 Métriques de Réussite

### Performance
- ⏱️ Temps de réponse : < 3 secondes pour messages texte
- ⏱️ Temps de transcription Whisper : 3-7 secondes
- ⏱️ Temps de traitement location : < 2 secondes

### Qualité
- 🎯 Précision détection langue : > 95%
- 🎯 Précision transcription Whisper : > 90% (audio clair)
- 🎯 Précision calcul distance : ± 0.1km

### Robustesse
- 💪 Gestion d'erreurs : 100% des cas ont un fallback
- 💪 Messages d'erreur : Toujours dans la langue de l'utilisateur
- 💪 Pas de crash même si APIs externes échouent

---

## ✅ Checklist de Test Complète

### Fonctionnalités de Base
- [ ] Message texte simple en français
- [ ] Message texte simple en anglais
- [ ] Message texte simple en espagnol
- [ ] Changement de langue au milieu de la conversation
- [ ] Réservation complète en français
- [ ] Les boutons préservent la langue
- [ ] Menu PDF envoyé avec message d'accompagnement

### Fonctionnalités Avancées
- [ ] Note vocale en français → transcription correcte
- [ ] Note vocale en anglais → transcription correcte
- [ ] Partage de location → directions fournies
- [ ] Location proche → message personnalisé
- [ ] Tous les menus envoyés en une fois
- [ ] Langue exotique (japonais, chinois, arabe)

### Gestion d'Erreurs
- [ ] Audio corrompu → message d'erreur poli
- [ ] Base de données down → message d'erreur technique
- [ ] Pas d'historique de conversation → fallback vers anglais
- [ ] Location invalide → message d'erreur

### Performance
- [ ] Temps de réponse acceptable (< 3s)
- [ ] Pas de crash même avec charge élevée
- [ ] Fichiers temporaires nettoyés après transcription

---

## 🎉 Test de Démonstration Complet

Voici un scénario complet pour démontrer toutes les fonctionnalités :

1. **Début** : `Bonjour` → Réponse en français
2. **Menu** : `Je voudrais voir les menus` → Boutons interactifs en français
3. **Clic** : Cliquer sur "À la Carte" → PDF envoyé avec message en français
4. **Vocal** : Note vocale "Je voudrais réserver pour 4 personnes" → Transcription + début réservation
5. **Réservation** : Compléter via boutons → Confirmation en français
6. **Location** : Partager localisation → Directions en français
7. **Changement** : `Thank you!` → Réponse en anglais
8. **Validation** : Toute la conversation s'est déroulée dans la langue correcte

**Durée totale** : ~3 minutes
**Résultat attendu** : ✅ Toutes les fonctionnalités fonctionnent parfaitement
