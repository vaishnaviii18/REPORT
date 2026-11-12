import { useEffect, useRef, useState } from 'react';
import { MAX_VOICE_SECONDS } from '../lib/constants';
import { Icon } from './ui';

// Record a voice note in the app. Calls onDone(file) when stopped.
export default function VoiceRecorder({ onDone, disabled }) {
  const [state, setState] = useState('idle'); // idle | recording
  const [secs, setSecs] = useState(0);
  const [error, setError] = useState('');
  const rec = useRef(null);
  const timer = useRef(null);
  const stream = useRef(null);

  const cleanup = () => {
    clearInterval(timer.current);
    if (stream.current) stream.current.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  useEffect(() => () => {
    if (rec.current && rec.current.state === 'recording') {
      rec.current.onstop = null;
      rec.current.stop();
    }
    cleanup();
  }, []);

  const stop = () => {
    if (rec.current && rec.current.state === 'recording') rec.current.stop();
  };

  const start = async () => {
    setError('');
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setError("This phone can't record here. Use “Pick audio file” instead");
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Allow the microphone to record a voice note');
      return;
    }
    const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
      .find((t) => MediaRecorder.isTypeSupported(t)) || '';
    const r = new MediaRecorder(stream.current, type ? { mimeType: type } : undefined);
    const chunks = [];
    r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    r.onstop = () => {
      cleanup();
      setState('idle');
      const mime = r.mimeType || 'audio/webm';
      const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
      const blob = new Blob(chunks, { type: mime });
      if (blob.size) onDone(new File([blob], `voice-note.${ext}`, { type: mime }));
    };
    rec.current = r;
    r.start();
    setSecs(0);
    setState('recording');
    timer.current = setInterval(() => {
      setSecs((s) => {
        if (s + 1 >= MAX_VOICE_SECONDS) stop();
        return s + 1;
      });
    }, 1000);
  };

  if (state === 'recording') {
    const mm = Math.floor(secs / 60);
    const ss = String(secs % 60).padStart(2, '0');
    return (
      <div className="rec" role="status">
        <span className="rec-dot" />
        <span style={{ flex: 1 }}>Recording… {mm}:{ss}</span>
        <button type="button" className="btn small primary" onClick={stop}>Stop</button>
      </div>
    );
  }
  return (
    <>
      <button type="button" className="media-btn" onClick={start} disabled={disabled}>
        <Icon name="mic" size={18} />Record voice
      </button>
      {error && <span className="error" style={{ width: '100%' }}>{error}</span>}
    </>
  );
}
