/**
 * Script de test local pour tester le nouveau prompt sans WhatsApp
 * Usage: npx tsx test-prompt-local.ts
 */

import { createMastraInstance, processUserMessage } from './src/agent/mastra.js';

async function testPrompt() {
  console.log('🧪 Test du nouveau prompt fusionné\n');

  const mastra = createMastraInstance();

  // Test 1: Question sur les horaires
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Test 1: Question sur les horaires');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const test1 = await processUserMessage(
    mastra,
    "Vous ouvrez à quelle heure ?",
    "test_user_1",
    undefined,
    false
  );

  console.log('👤 User: "Vous ouvrez à quelle heure ?"');
  console.log(`🤖 Bot (${test1.detectedLanguage}): "${test1.text}"\n`);

  // Test 2: Demande de menu
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Test 2: Demande de menu');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const test2 = await processUserMessage(
    mastra,
    "Je voudrais voir la carte",
    "test_user_2",
    undefined,
    false
  );

  console.log('👤 User: "Je voudrais voir la carte"');
  console.log(`🤖 Bot (${test2.detectedLanguage}): "${test2.text}"`);
  console.log(`📋 Menu Buttons: ${test2.showMenuButtons ? 'OUI ✅' : 'NON'}\n`);

  // Test 3: Question implicite de réservation
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Test 3: Intention implicite (végétarien = veut venir)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const test3 = await processUserMessage(
    mastra,
    "Vous avez des options végétariennes ?",
    "test_user_3",
    undefined,
    false
  );

  console.log('👤 User: "Vous avez des options végétariennes ?"');
  console.log(`🤖 Bot (${test3.detectedLanguage}): "${test3.text}"\n`);

  // Test 4: En anglais
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Test 4: Test en anglais');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const test4 = await processUserMessage(
    mastra,
    "What time do you open?",
    "test_user_4",
    undefined,
    false
  );

  console.log('👤 User: "What time do you open?"');
  console.log(`🤖 Bot (${test4.detectedLanguage}): "${test4.text}"\n`);

  // Test 5: Réservation directe
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Test 5: Demande de réservation directe');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const test5 = await processUserMessage(
    mastra,
    "Je voudrais réserver pour samedi soir, on sera 4",
    "test_user_5",
    undefined,
    false
  );

  console.log('👤 User: "Je voudrais réserver pour samedi soir, on sera 4"');
  console.log(`🤖 Bot (${test5.detectedLanguage}): "${test5.text}"\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Tests terminés !');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testPrompt().catch(console.error);
