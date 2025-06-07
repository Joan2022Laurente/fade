import { useEffect, useState, useRef } from 'react';
import * as Tone from 'tone';

function App() {
  const [started, setStarted] = useState(false);
  const playerA = useRef<Tone.Player | null>(null);
  const playerB = useRef<Tone.Player | null>(null);
  const reverb = useRef<Tone.Reverb | null>(null);
  const [current, setCurrent] = useState<'A' | 'B' | null>(null);

  // Parámetros
  const [rate, setRate] = useState(0.8);
  const [volume, setVolume] = useState(-6);
  const [decay, setDecay] = useState(3.5);
  const [wet, setWet] = useState(0.5);

  const fadeTime = 4; // segundos para crossfade

  // Para archivos cargados dinámicamente
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);

  // Para guardar URLs temporales
  const urlA = useRef<string | null>(null);
  const urlB = useRef<string | null>(null);

  const logEvent = (msg: string) => {
    console.log(`[LOG]: ${msg}`);
  };

  const handleStart = async () => {
    await Tone.start();

    const rev = new Tone.Reverb({
      decay,
      preDelay: 0.01,
      wet,
    }).toDestination();

    await rev.generate();
    reverb.current = rev;

    if (fileA) {
      if (urlA.current) URL.revokeObjectURL(urlA.current);
      urlA.current = URL.createObjectURL(fileA);
      playerA.current = new Tone.Player({
        url: urlA.current,
        playbackRate: rate,
        volume: -Infinity,
        autostart: false,
      }).connect(rev);
    }

    if (fileB) {
      if (urlB.current) URL.revokeObjectURL(urlB.current);
      urlB.current = URL.createObjectURL(fileB);
      playerB.current = new Tone.Player({
        url: urlB.current,
        playbackRate: rate,
        volume: -Infinity,
        autostart: false,
      }).connect(rev);
    }

    setStarted(true);
    logEvent('Sonido iniciado');
  };

  const crossfadeTo = (target: 'A' | 'B') => {
    if (!playerA.current || !playerB.current || !reverb.current) return;

    const fadeOutPlayer = current === 'A' ? playerA.current : playerB.current;
    const fadeInPlayer = target === 'A' ? playerA.current : playerB.current;

    if (fadeInPlayer.state !== 'started') {
      fadeInPlayer.start();
    }

    fadeInPlayer.playbackRate = rate;

    fadeInPlayer.volume.cancelScheduledValues(Tone.now());
    fadeInPlayer.volume.setValueAtTime(fadeInPlayer.volume.value, Tone.now());
    fadeInPlayer.volume.linearRampToValueAtTime(volume, Tone.now() + fadeTime);

    if (fadeOutPlayer.state === 'started') {
      fadeOutPlayer.volume.cancelScheduledValues(Tone.now());
      fadeOutPlayer.volume.setValueAtTime(fadeOutPlayer.volume.value, Tone.now());
      fadeOutPlayer.volume.linearRampToValueAtTime(-Infinity, Tone.now() + fadeTime);

      setTimeout(() => {
        fadeOutPlayer.stop();
      }, fadeTime * 1000);
    }

    setCurrent(target);
    logEvent(`Crossfade a pista ${target}`);
  };

  useEffect(() => {
    if (!started) return;

    if (playerA.current) {
      playerA.current.playbackRate = rate;
      if (current === 'A') {
        playerA.current.volume.value = volume;
      }
    }

    if (playerB.current) {
      playerB.current.playbackRate = rate;
      if (current === 'B') {
        playerB.current.volume.value = volume;
      }
    }
  }, [rate, volume, current, started]);

  useEffect(() => {
    if (reverb.current) {
      reverb.current.decay = decay;
      reverb.current.wet.value = wet;
    }
  }, [decay, wet]);

  // Limpia URLs al desmontar
  useEffect(() => {
    return () => {
      if (urlA.current) URL.revokeObjectURL(urlA.current);
      if (urlB.current) URL.revokeObjectURL(urlB.current);
    };
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: 600, margin: 'auto' }}>
      <h1>🧠 Sonido Mental con Crossfade</h1>

      {!started && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              Cargar audio para Player A:
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  setFileA(e.target.files ? e.target.files[0] : null);
                  logEvent('Archivo A cargado');
                }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              Cargar audio para Player B:
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  setFileB(e.target.files ? e.target.files[0] : null);
                  logEvent('Archivo B cargado');
                }}
              />
            </label>
          </div>

          <button
            onClick={handleStart}
            disabled={!fileA || !fileB}
            style={{ padding: '10px 20px', fontSize: '16px', marginTop: '1rem' }}
          >
            Iniciar Sonido
          </button>
        </>
      )}

      {started && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <button onClick={() => crossfadeTo('A')} disabled={current === 'A'}>
              Reproducir Player A
            </button>
            <button onClick={() => crossfadeTo('B')} disabled={current === 'B'} style={{ marginLeft: '1rem' }}>
              Reproducir Player B
            </button>
          </div>

          <label>
            🎵 Velocidad ({rate.toFixed(2)}x)
            <input
              type="range"
              min="0.5"
              max="1.2"
              step="0.01"
              value={rate}
              onChange={(e) => {
                setRate(parseFloat(e.target.value));
                logEvent(`Velocidad cambiada a ${e.target.value}`);
              }}
            />
          </label>

          <label>
            🔊 Volumen ({volume} dB)
            <input
              type="range"
              min="-30"
              max="0"
              step="1"
              value={volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                logEvent(`Volumen cambiado a ${e.target.value} dB`);
              }}
            />
          </label>

          <label>
            🎶 Reverb Decay ({decay}s)
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={decay}
              onChange={(e) => {
                setDecay(parseFloat(e.target.value));
                logEvent(`Decay cambiado a ${e.target.value}`);
              }}
            />
          </label>

          <label>
            🧪 Reverb Wet ({(wet * 100).toFixed(0)}%)
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={wet}
              onChange={(e) => {
                setWet(parseFloat(e.target.value));
                logEvent(`Wet cambiado a ${e.target.value}`);
              }}
            />
          </label>
        </>
      )}
    </div>
  );
}

export default App;
