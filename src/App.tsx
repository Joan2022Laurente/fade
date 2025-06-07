"use client"

import { useEffect, useState, useRef } from "react"
import * as Tone from "tone"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Play, Upload, Volume2, Zap, Waves, RotateCcw, Music, Brain, Headphones } from "lucide-react"

export default function AudioCrossfadeApp() {
  const [started, setStarted] = useState(false)
  const playerA = useRef<Tone.Player | null>(null)
  const playerB = useRef<Tone.Player | null>(null)
  const reverb = useRef<Tone.Reverb | null>(null)
  const [current, setCurrent] = useState<"A" | "B" | null>(null)

  // Parámetros
  const [rate, setRate] = useState(0.8)
  const [volume, setVolume] = useState(-6)
  const [decay, setDecay] = useState(3.5)
  const [wet, setWet] = useState(0.5)

  const fadeTime = 4 // segundos para crossfade

  // Para archivos cargados dinámicamente
  const [fileA, setFileA] = useState<File | null>(null)
  const [fileB, setFileB] = useState<File | null>(null)

  // Para guardar URLs temporales
  const urlA = useRef<string | null>(null)
  const urlB = useRef<string | null>(null)

  const logEvent = (msg: string) => {
    console.log(`[LOG]: ${msg}`)
  }

  const handleStart = async () => {
    await Tone.start()

    const rev = new Tone.Reverb({
      decay,
      preDelay: 0.01,
      wet,
    }).toDestination()

    await rev.generate()
    reverb.current = rev

    if (fileA) {
      if (urlA.current) URL.revokeObjectURL(urlA.current)
      urlA.current = URL.createObjectURL(fileA)
      playerA.current = new Tone.Player({
        url: urlA.current,
        playbackRate: rate,
        volume: Number.NEGATIVE_INFINITY,
        autostart: false,
      }).connect(rev)
    }

    if (fileB) {
      if (urlB.current) URL.revokeObjectURL(urlB.current)
      urlB.current = URL.createObjectURL(fileB)
      playerB.current = new Tone.Player({
        url: urlB.current,
        playbackRate: rate,
        volume: Number.NEGATIVE_INFINITY,
        autostart: false,
      }).connect(rev)
    }

    setStarted(true)
    logEvent("Sonido iniciado")
  }

  const crossfadeTo = (target: "A" | "B") => {
    if (!playerA.current || !playerB.current || !reverb.current) return

    const fadeOutPlayer = current === "A" ? playerA.current : playerB.current
    const fadeInPlayer = target === "A" ? playerA.current : playerB.current

    if (fadeInPlayer.state !== "started") {
      fadeInPlayer.start()
    }

    fadeInPlayer.playbackRate = rate

    fadeInPlayer.volume.cancelScheduledValues(Tone.now())
    fadeInPlayer.volume.setValueAtTime(fadeInPlayer.volume.value, Tone.now())
    fadeInPlayer.volume.linearRampToValueAtTime(volume, Tone.now() + fadeTime)

    if (fadeOutPlayer.state === "started") {
      fadeOutPlayer.volume.cancelScheduledValues(Tone.now())
      fadeOutPlayer.volume.setValueAtTime(fadeOutPlayer.volume.value, Tone.now())
      fadeOutPlayer.volume.linearRampToValueAtTime(Number.NEGATIVE_INFINITY, Tone.now() + fadeTime)

      setTimeout(() => {
        fadeOutPlayer.stop()
      }, fadeTime * 1000)
    }

    setCurrent(target)
    logEvent(`Crossfade a pista ${target}`)
  }

  useEffect(() => {
    if (!started) return

    if (playerA.current) {
      playerA.current.playbackRate = rate
      if (current === "A") {
        playerA.current.volume.value = volume
      }
    }

    if (playerB.current) {
      playerB.current.playbackRate = rate
      if (current === "B") {
        playerB.current.volume.value = volume
      }
    }
  }, [rate, volume, current, started])

  useEffect(() => {
    if (reverb.current) {
      reverb.current.decay = decay
      reverb.current.wet.value = wet
    }
  }, [decay, wet])

  // Limpia URLs al desmontar
  useEffect(() => {
    return () => {
      if (urlA.current) URL.revokeObjectURL(urlA.current)
      if (urlB.current) URL.revokeObjectURL(urlB.current)
    }
  }, [])

  return (
    <div className="min-h-screen bg-black p-2 sm:p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 sm:space-y-4 py-4 sm:py-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {/* <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" /> */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">mala notica mi jenteh</h1>
            {/* <Headphones className="w-6 h-6 sm:w-8 sm:h-8 text-white" /> */}
          </div>
          <p className="text-gray-400 text-sm sm:text-base lg:text-lg px-4">
            Mala noticiah 
          </p>
        </div>

        {!started ? (
          <Card className="bg-gray-900 border-gray-800 mx-2 sm:mx-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-white text-lg sm:text-xl">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                Configuración Inicial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <Label className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                    <Music className="w-4 h-4" />
                    Player A
                  </Label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        setFileA(e.target.files ? e.target.files[0] : null)
                        logEvent("Archivo A cargado")
                      }}
                      className="bg-gray-800 border-gray-700 text-white text-sm file:bg-white file:text-black file:border-0 file:rounded-md file:px-2 file:py-1 file:text-xs sm:file:px-3 sm:file:py-1 sm:file:text-sm"
                    />
                    {fileA && <Badge className="absolute -top-2 -right-2 bg-green-600 text-xs">✓</Badge>}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                    <Music className="w-4 h-4" />
                    Player B
                  </Label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        setFileB(e.target.files ? e.target.files[0] : null)
                        logEvent("Archivo B cargado")
                      }}
                      className="bg-gray-800 border-gray-700 text-white text-sm file:bg-white file:text-black file:border-0 file:rounded-md file:px-2 file:py-1 file:text-xs sm:file:px-3 sm:file:py-1 sm:file:text-sm"
                    />
                    {fileB && <Badge className="absolute -top-2 -right-2 bg-green-600 text-xs">✓</Badge>}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleStart}
                disabled={!fileA || !fileB}
                className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-3 sm:py-4 text-base sm:text-lg h-auto"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Iniciar 
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Control de Reproducción */}
            <Card className="bg-gray-900 border-gray-800 mx-2 sm:mx-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                  Control de Crossfade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-center">
                  <Button
                    onClick={() => crossfadeTo("A")}
                    disabled={current === "A"}
                    variant={current === "A" ? "default" : "outline"}
                    className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base font-medium h-auto ${
                      current === "A"
                        ? "bg-white hover:bg-gray-200 text-black"
                        : "border-gray-700 text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    Player A
                  </Button>
                  <Button
                    onClick={() => crossfadeTo("B")}
                    disabled={current === "B"}
                    variant={current === "B" ? "default" : "outline"}
                    className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base font-medium h-auto ${
                      current === "B"
                        ? "bg-white hover:bg-gray-200 text-black"
                        : "border-gray-700 text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    Player B
                  </Button>
                </div>
                {current && (
                  <div className="text-center mt-4">
                    <Badge className="bg-white text-black text-sm">Reproduciendo: Player {current}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Controles de Audio */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mx-2 sm:mx-0">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                    Controles Principales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                        <RotateCcw className="w-4 h-4" />
                        Velocidad
                      </Label>
                      <Badge variant="outline" className="border-gray-700 text-gray-300 text-xs sm:text-sm">
                        {rate.toFixed(2)}x
                      </Badge>
                    </div>
                    <div className="px-2">
                      <Slider
                        value={[rate]}
                        onValueChange={(value) => {
                          setRate(value[0])
                          logEvent(`Velocidad cambiada a ${value[0]}`)
                        }}
                        min={0.5}
                        max={1.2}
                        step={0.01}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                        <Volume2 className="w-4 h-4" />
                        Volumen
                      </Label>
                      <Badge variant="outline" className="border-gray-700 text-gray-300 text-xs sm:text-sm">
                        {volume} dB
                      </Badge>
                    </div>
                    <div className="px-2">
                      <Slider
                        value={[volume]}
                        onValueChange={(value) => {
                          setVolume(value[0])
                          logEvent(`Volumen cambiado a ${value[0]}`)
                        }}
                        min={-30}
                        max={0}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                    <Waves className="w-4 h-4 sm:w-5 sm:h-5" />
                    Efectos de Reverb
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300 text-sm sm:text-base">Decay</Label>
                      <Badge variant="outline" className="border-gray-700 text-gray-300 text-xs sm:text-sm">
                        {decay}s
                      </Badge>
                    </div>
                    <div className="px-2">
                      <Slider
                        value={[decay]}
                        onValueChange={(value) => {
                          setDecay(value[0])
                          logEvent(`Decay cambiado a ${value[0]}`)
                        }}
                        min={0.1}
                        max={10}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300 text-sm sm:text-base">Wet</Label>
                      <Badge variant="outline" className="border-gray-700 text-gray-300 text-xs sm:text-sm">
                        {(wet * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="px-2">
                      <Slider
                        value={[wet]}
                        onValueChange={(value) => {
                          setWet(value[0])
                          logEvent(`Wet cambiado a ${value[0]}`)
                        }}
                        min={0}
                        max={1}
                        step={0.01}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
