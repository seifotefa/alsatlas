export function elevenConfigured() {
  return Boolean(process.env.ELEVENLABS_API_KEY?.trim());
}

function voiceId(preferred?: string | null) {
  return preferred || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
}

export async function transcribeSpeech(audio: Buffer, mime = 'audio/webm') {
  const form = new FormData();
  form.set('model_id', 'scribe_v1');
  form.set('file', new Blob([new Uint8Array(audio)], { type: mime }), 'speech.webm');
  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '' },
    body: form,
  });
  if (!response.ok) throw new Error(`ElevenLabs speech-to-text failed (${response.status}).`);
  const payload = await response.json() as { text?: string };
  return String(payload.text || '').trim();
}

export async function synthesizeSpeech(text: string, preferredVoice?: string | null) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId(preferredVoice)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'xi-api-key': process.env.ELEVENLABS_API_KEY || '' },
    body: JSON.stringify({ text: text.slice(0, 1200), model_id: 'eleven_multilingual_v2' }),
  });
  if (!response.ok) throw new Error(`ElevenLabs speech synthesis failed (${response.status}).`);
  return Buffer.from(await response.arrayBuffer());
}

export async function convertSpeech(audio: Buffer, mime = 'audio/webm', preferredVoice?: string | null) {
  const form = new FormData();
  form.set('model_id', 'eleven_multilingual_sts_v2');
  form.set('audio', new Blob([new Uint8Array(audio)], { type: mime }), 'speech.webm');
  const response = await fetch(`https://api.elevenlabs.io/v1/speech-to-speech/${voiceId(preferredVoice)}`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '' },
    body: form,
  });
  if (!response.ok) throw new Error(`ElevenLabs speech-to-speech failed (${response.status}).`);
  return Buffer.from(await response.arrayBuffer());
}
