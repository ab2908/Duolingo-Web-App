/** Text-to-speech via the browser's Web Speech API (used for audio exercises). */

const LOCALES: Record<string, string> = { es: "es-ES", en: "en-US" };

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, language: string, { slow = false } = {}) {
  if (!canSpeak() || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const locale = LOCALES[language] ?? language;
  utterance.lang = locale;
  const voice = synth.getVoices().find((v) => v.lang.replace("_", "-").startsWith(locale.slice(0, 2)));
  if (voice) utterance.voice = voice;
  utterance.rate = slow ? 0.55 : 0.95;
  synth.speak(utterance);
}
