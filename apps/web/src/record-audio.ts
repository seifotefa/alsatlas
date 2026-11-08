export function recordUntilSilence(signal?: AbortSignal, options?: { maxMs?: number; silenceMs?: number; onLevel?: (level: number) => void }) {
  const maxMs = options?.maxMs ?? 20000;
  const silenceMs = options?.silenceMs ?? 900;
  return new Promise<Blob>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Stopped', 'AbortError'));
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      if (signal?.aborted) {
        stream.getTracks().forEach(track => track.stop());
        reject(new DOMException('Stopped', 'AbortError'));
        return;
      }
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      let heard = false;
      let silentFor = 0;
      let last = performance.now();
      const started = last;
      const stop = () => { if (recorder.state === 'recording') recorder.stop(); };
      const onAbort = () => stop();
      signal?.addEventListener('abort', onAbort, { once: true });
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => reject(new Error('Recording failed.'));
      recorder.onstop = () => {
        signal?.removeEventListener('abort', onAbort);
        stream.getTracks().forEach(track => track.stop());
        void context.close();
        if (signal?.aborted) reject(new DOMException('Stopped', 'AbortError'));
        else resolve(heard ? new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }) : new Blob());
      };
      const tick = () => {
        if (recorder.state !== 'recording') return;
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (let index = 0; index < samples.length; index += 1) {
          const value = (samples[index] - 128) / 128;
          sum += value * value;
        }
        const now = performance.now();
        const level = Math.min(1, Math.sqrt(sum / samples.length) * 8);
        options?.onLevel?.(level);
        if (Math.sqrt(sum / samples.length) > 0.02) {
          heard = true;
          silentFor = 0;
        } else if (heard) silentFor += now - last;
        last = now;
        if ((heard && silentFor >= silenceMs) || now - started >= maxMs) {
          stop();
          return;
        }
        window.requestAnimationFrame(tick);
      };
      recorder.start();
      window.requestAnimationFrame(tick);
    }).catch(() => reject(new Error('Microphone permission is needed to talk.')));
  });
}

export function recordClip(ms = 7000) {
  return new Promise<Blob>(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => reject(new Error('Recording failed.'));
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
      };
      recorder.start();
      window.setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, ms);
    } catch {
      reject(new Error('Microphone permission is needed to talk.'));
    }
  });
}

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the recording.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

let playing: HTMLAudioElement | null = null;

export function stopPlayback() {
  playing?.pause();
  playing = null;
}

export function playMpeg(base64: string, onBands?: (bands: number[]) => void) {
  stopPlayback();
  const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
  playing = audio;
  const context = new AudioContext();
  const source = context.createMediaElementSource(audio);
  const analyser = context.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  analyser.connect(context.destination);
  const freq = new Uint8Array(analyser.frequencyBinCount);
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (playing === audio) playing = null;
      void context.close();
      resolve();
    };
    const paint = () => {
      if (settled) return;
      analyser.getByteFrequencyData(freq);
      const bands = Array.from({ length: 16 }, (_, index) => {
        const start = Math.floor((index * freq.length) / 16);
        const end = Math.floor(((index + 1) * freq.length) / 16);
        let total = 0;
        for (let bin = start; bin < end; bin += 1) total += freq[bin];
        return Math.min(1, (total / Math.max(1, end - start) / 255) * 1.8);
      });
      onBands?.(bands);
      window.requestAnimationFrame(paint);
    };
    audio.onended = finish;
    audio.onpause = finish;
    audio.onerror = () => reject(new Error('Could not play the reply.'));
    void audio.play().then(() => { void context.resume(); paint(); }).catch(reject);
  });
}
