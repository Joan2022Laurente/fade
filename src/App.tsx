import { useEffect, useState, useRef } from 'react';
import * as Tone from 'tone';

function App() {
  const [started, setStarted] = useState(false);

  // refs para los players y el reverb
  const playerA = useRef<Tone.Player | null>(null);
  const playerB = useRef<Tone.Player | null>(null);
  const reverb = useRef<Tone.Reverb | null>(null);

  const [current, setCurrent] = useState<'A' | 'B' | null>(null);

  // Parámetros
  const [rate, setRate] = useState(0.8);
  const [volume, setVolume] = useState(-6);
  const [decay, setDecay] = useState(3.5);
  const [wet, setWet] = useState(0.5);
  const [detune, setDetune] = useState(0);

  // URLs de archivos cargados por el usuario
  const [fileA, setFileA] = useState<string | null>(null);
  const [fileB, setFileB] = useState<string | null>(null);

  const fadeTime = 4; // segundos para crossfade

  const logEvent = (msg: string) => {
    console.log(`[LOG]: ${msg}`);
  };

  // Inicializa Tone y crea el Reverb y los players vacíos
  const handleStart = async () => {
    await Tone.start();

    const rev = new Tone.Reverb({
      decay,
      preDelay: 0.01,
      wet,
    }).toDestination();

    await rev.generate();
    reverb.current = rev;

    // Crea los players con los archivos seleccionados o ninguno
    playerA.current = new Tone.Player({
      url: fileA || undefined,
      playbackRate: rate,
      volume: -Infinity,
      autostart: false,
      detune,
    }).connect(rev);

    playerB.current = new Tone.Player({
      url: fileB || undefined,
      playbackRate: rate,
      volume: -Infinity,
      autostart: false,
      detune,
    }).connect(rev);

    setStarted(true);
    logEvent('Sonido iniciado');
  };

  // Función para actualizar la URL y reiniciar el player con nuevo archivo
  const loadFile = (file: File, playerRef: React.MutableRefObject<Tone.Player | null>, setFileUrl: React.Dispatch<React.SetStateAction<string | null>>, playerName: 'A' | 'B') => {
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    logEvent(`Archivo cargado para player ${playerName}: ${file.name}`);

    if (playerRef.current) {
      // Detenemos y desconectamos el player anterior
      playerRef.current.stop();
      playerRef.current.disconnect();

      // Creamos un nuevo player con el nuevo archivo
      playerRef.current = new Tone.Player({
        url,
        playbackRate: rate,
        volume: playerName === current ? volume : -Infinity,
        autostart: false,
        detune,
      }).connect(reverb.current!);
    }
  };

  const crossfadeTo = (target: 'A' | 'B') => {
    if (!playerA.current || !playerB.current || !reverb.current) return;

    const fadeOutPlayer = current === 'A' ? playerA.current : playerB.current;
    const fadeInPlayer = target === 'A' ? playerA.current : playerB.current;

    if (fadeInPlayer.state !== 'started') {
      fadeInPlayer.start();
    }

    fadeInPlayer.playbackRate = rate;
    fadeInPlayer.detune = detune;

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
      playerA.current.detune = detune;
      if (current === 'A') {
        playerA.current.volume.value = volume;
      }
    }

    if (playerB.current) {
      playerB.current.playbackRate = rate;
      playerB.current.detune = detune;
      if (current === 'B') {
        playerB.current.volume.value = volume;
      }
    }
  }, [rate, volume, detune, current, started]);

  useEffect(() => {
    if (reverb.current) {
      reverb.current.decay = decay;
      reverb.current.wet.value = wet;
    }
  }, [decay, wet]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: 600, margin: 'auto' }}>
      <h1>🧠 Sonido Mental con Crossfade y carga dinámica</h1>

      {!started && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              Cargar archivo para Player A:
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    loadFile(e.target.files[0], playerA, setFileA, 'A');
                  }
                }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              Cargar archivo para Player B:
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    loadFile(e.target.files[0], playerB, setFileB, 'B');
                  }
                }}
              />
            </label>
          </div>

          <button
            onClick={handleStart}
            disabled={!fileA || !fileB}
            style={{ padding: '10px 20px', fontSize: '16px' }}
            title={!fileA || !fileB ? 'Carga ambos archivos primero' : undefined}
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

          <label>
            🌀 Detune ({detune} cents)
            <input
              type="range"
              min="-1200"
              max="1200"
              step="10"
              value={detune}
              onChange={(e) => {
                setDetune(parseFloat(e.target.value));
                logEvent(`Detune cambiado a ${e.target.value} cents`);
              }}
            />
          </label>
        </>
      )}
    </div>
  );
}

export default App;
