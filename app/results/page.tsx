'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, Scan, Shield, Zap, BookOpen, ChevronRight, X, AlertCircle } from 'lucide-react'
import { getLesionByLabel } from '@/lib/lesionData'
import { AnalysisResult } from '../api/analyze/route'

const RAILWAY_URL = 'https://web-production-26f73.up.railway.app/classify'

const ERROR_HINTS: Record<string, string> = {
  NO_SKIN:        'Tip: Hold the camera 5–10cm from your skin. Make sure the lesion fills most of the frame.',
  QUALITY_FAIL:   'Tip: Use natural daylight and hold your hand steady.',
  LOW_CONFIDENCE: 'Tip: Get closer to the lesion and make sure it is in sharp focus.',
}

const ERROR_EMOJI: Record<string, string> = {
  NO_SKIN: '🚫', QUALITY_FAIL: '📷', LOW_CONFIDENCE: '🔍',
}

export default function HomePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<{ message: string; code?: string } | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
  }, [])

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = document.createElement('img')
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 1024
        let { width, height } = img
        if (width > height) {
          if (width > MAX) { height = (height * MAX) / width; width = MAX }
        } else {
          if (height > MAX) { width = (width * MAX) / height; height = MAX }
        }
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = url
    })

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.heic')) {
      setError({ message: 'Please upload an image file (JPG, PNG, HEIC).' }); return
    }
    setError(null)
    const b64 = await compressImage(file)
    setPreview(b64)
  }, [])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) handleFile(file)
  }

  const handleAnalyse = async () => {
    if (!preview) return
    setIsAnalyzing(true); setError(null)
    try {
      const res = await fetch(RAILWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: preview }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError({ message: data.error || 'Analysis failed.', code: data.code })
        setIsAnalyzing(false); return
      }
      const sorted = [...data.predictions].sort((a: {label: string; score: number}, b: {label: string; score: number}) => b.score - a.score)
      const enriched = sorted.map((pred: {label: string; score: number}) => {
        const l = getLesionByLabel(pred.label)
        if (l) return {
          lesionId: l.id, name: l.name, layman: l.layman, description: l.description,
          risk: l.risk, action: l.action, urgency: l.urgency,
          confidence: Math.round(pred.score * 100), emoji: l.emoji, color: l.color,
        }
        return {
          lesionId: pred.label, name: pred.label, layman: 'Unknown lesion type.',
          description: '', risk: 'moderate', action: 'Consult a dermatologist.',
          urgency: 'Book an appointment.', confidence: Math.round(pred.score * 100),
          emoji: '❓', color: 'text-gray-400',
        }
      })
      const top = enriched[0]
      const result = {
        topPrediction: {
          lesionId: top.lesionId, name: top.name, layman: top.layman,
          description: top.description, risk: top.risk, action: top.action,
          urgency: top.urgency, confidence: top.confidence, emoji: top.emoji,
        },
        allPredictions: enriched.map((e: {lesionId: string; name: string; confidence: number; risk: string; color: string}) => ({
          lesionId: e.lesionId, name: e.name, confidence: e.confidence, risk: e.risk, color: e.color,
        })),
        gradcam: null,
        disclaimer: 'DermIQ is an AI-assisted screening tool and does NOT replace professional medical advice.',
        analyzedAt: new Date().toISOString(),
      }
      sessionStorage.setItem('dermiq_result', JSON.stringify(result))
      sessionStorage.setItem('dermiq_image', preview)
      console.log('Result being stored:', JSON.stringify(result).substring(0, 200))
      router.push('/results')
    } catch {
      setError({ message: 'Network error. Please check your connection.' })
      setIsAnalyzing(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400/80 to-yellow-600/80 flex items-center justify-center">
            <Scan className="w-4 h-4 text-black" />
          </div>
          <span className="font-display text-lg text-white/90 tracking-wide">DermIQ</span>
        </div>
        <span className="text-xs text-white/30 font-mono-custom tracking-widest uppercase">Beta</span>
      </header>

      <section className="px-6 pt-12 pb-8 max-w-2xl mx-auto w-full text-center">
        <p className="text-xs tracking-[0.25em] uppercase text-yellow-400/60 font-mono-custom mb-4">AI-Powered Dermatology Screening</p>
        <h1 className="font-display text-4xl sm:text-5xl leading-tight text-white/95 mb-5">
          Know your skin.<br /><span className="gold-text italic">Before it speaks.</span>
        </h1>
        <p className="text-white/45 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
          Upload a close-up photo of any skin lesion. Our model — trained on 10,000+ clinical images — analyses it across 7 diagnostic categories in seconds.
        </p>
      </section>

      <section className="flex-1 px-4 pb-8 max-w-xl mx-auto w-full">
        {!preview ? (
          <div
            className={`upload-zone rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragging ? 'drag-over' : ''}`}
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ minHeight: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}
          >
            <div className="w-16 h-16 rounded-full bg-yellow-400/8 border border-yellow-400/20 flex items-center justify-center mx-auto">
              <Upload className="w-7 h-7 text-yellow-400/70" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium mb-1">{isDragging ? 'Drop to analyse' : 'Drop image here or click to browse'}</p>
              <p className="text-white/25 text-xs">Close-up of skin lesion · JPG, PNG, HEIC</p>
            </div>
            {isMobile && (
              <button
                onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click() }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-yellow-400/30 text-yellow-400/80 text-sm hover:bg-yellow-400/8 transition-all"
              >
                <Camera className="w-4 h-4" />Take Photo
              </button>
            )}
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Selected lesion" className="w-full result-image" />
              <button onClick={() => { setPreview(null); setError(null) }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center hover:bg-black/80 transition-all">
                <X className="w-4 h-4 text-white/70" />
              </button>
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-2 border-yellow-400/30"></div>
                    <div className="absolute inset-0 rounded-full border-t-2 border-yellow-400 animate-spin"></div>
                  </div>
                  <p className="text-white/70 text-sm font-mono-custom">Analysing...</p>
                </div>
              )}
            </div>
            <div className="p-5">
              {error && (
                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-red-300 text-sm font-medium">{error.code ? ERROR_EMOJI[error.code] : '⚠️'} {error.message}</p>
                    {error.code && ERROR_HINTS[error.code] && (
                      <p className="text-white/40 text-xs">{ERROR_HINTS[error.code]}</p>
                    )}
                  </div>
                </div>
              )}
              <button onClick={handleAnalyse} disabled={isAnalyzing}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-medium text-sm tracking-wide hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isAnalyzing ? <>Analysing image...</> : <><Scan className="w-4 h-4" />Analyse Lesion<ChevronRight className="w-4 h-4" /></>}
              </button>
              <p className="text-center text-white/25 text-xs mt-3">Results in ~3 seconds · Not a medical diagnosis</p>
            </div>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
      </section>

      <section className="border-t border-white/5 px-6 py-8">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-4 text-center">
          {[
            { icon: Shield, label: 'Clinical Dataset', sub: 'HAM10000 · 10,015 images' },
            { icon: Zap, label: '7 Lesion Classes', sub: 'Including melanoma' },
            { icon: BookOpen, label: 'Research-Grade', sub: 'AUC 0.9808' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon className="w-4 h-4 text-yellow-400/50" />
              <span className="text-white/60 text-xs font-medium">{label}</span>
              <span className="text-white/25 text-[10px]">{sub}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-6 pb-8 text-center">
        <p className="text-white/20 text-[11px] max-w-sm mx-auto leading-relaxed">
          DermIQ is a screening aid only. It does not provide medical diagnosis or replace professional clinical assessment.
        </p>
      </footer>
    </main>
  )
}