import { useEffect, useRef, useState } from 'react';
import { blobToDataUrl, playMpeg, recordUntilSilence, stopPlayback } from './record-audio';

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking';

const greeting = "I'm here. Tell me how today feels.";
const quiet = Array.from({ length: 16 }, () => 0.15);
let activeSession: AbortController | null = null;

export function VoiceCheckin({ onDone }: { onDone: () => void }) {
  void onDone;
  const [phase, setPhase] = useState<Phase>('idle');
  const [level, setLevel] = useState(0);
  const [bands, setBands] = useState<number[]>(quiet);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const session = useRef<AbortController | null>(null);

  const end = () => {
    activeSession?.abort();
    session.current?.abort();
    stopPlayback();
  };

  useEffect(() => () => end(), []);

  const speak = async (text: string, signal: AbortSignal, audioBase64?: string) => {
    setPhase('thinking');
    setCaption(text);
    const base64 = audioBase64 || await (async () => {
      const spoken = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!spoken.ok) {
        const err = await spoken.json().catch(() => ({}));
        throw new Error(err.error || 'That reply could not be spoken.');
      }
      return (await blobToDataUrl(await spoken.blob())).split(',')[1] || '';
    })();
    if (signal.aborted) return;
    setPhase('speaking');
    await playMpeg(base64, next => { if (!signal.aborted) setBands(next); });
    setBands(quiet);
  };

  const begin = async () => {
    end();
    const controller = new AbortController();
    activeSession = controller;
    session.current = controller;
    setError('');
    setCaption('');
    setPhase('thinking');
    let threadId: string | undefined;
    try {
      await speak(greeting, controller.signal);
      while (!controller.signal.aborted) {
        setPhase('listening');
        setCaption('Listening');
        setLevel(0);
        const blob = await recordUntilSilence(controller.signal, {
          onLevel: value => { if (!controller.signal.aborted) setLevel(value); },
        });
        if (controller.signal.aborted) break;
        if (blob.size < 800) continue;
        setLevel(0);
        setPhase('thinking');
        setCaption('');
        const dataUrl = await blobToDataUrl(blob);
        const response = await fetch('/api/voice/sts', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ purpose: 'checkin', dataUrl, threadId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'That recording could not be used.');
        if (data.threadId) threadId = data.threadId;
        if (controller.signal.aborted) break;
        await speak(data.say || '', controller.signal, data.audioBase64);
        if (data.escalation === 'urgent') break;
      }
    } catch (caught) {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'The microphone could not be used.');
    } finally {
      stopPlayback();
      setPhase('idle');
      setLevel(0);
      setCaption('');
      if (session.current === controller) session.current = null;
      if (activeSession === controller) activeSession = null;
    }
  };

  const active = phase !== 'idle';

  return <div className="op-page checkin-page voice-checkin">
    <header className="op-page-header"><div><h2>Daily check-in</h2></div></header>
    <section className={`voice-stage ${phase}`} style={{ '--level': level } as { '--level': number }}>
      {active
        ? <button className="voice-orb" type="button" onClick={end} aria-label="End daily check-in">
          {phase === 'speaking'
            ? <span className="voice-bars" aria-hidden="true">{bands.map((band, index) => <i key={index} style={{ height: `${22 + band * 78}px` }}/>)}</span>
            : <span className="voice-core" aria-hidden="true"/>}
        </button>
        : <button className="op-button primary" type="button" onClick={() => void begin()}>Begin daily check-in</button>}
      <p className="voice-caption" role="status">{error || (active ? caption : '')}</p>
    </section>
  </div>;
}
