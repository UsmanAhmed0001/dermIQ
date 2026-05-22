'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, Info, Share2, RotateCcw } from 'lucide-react'
import { AnalysisResult } from '@/lib/types'
import { RISK_CONFIG, RiskLevel } from '@/lib/lesionData'

export default function ResultsPage() {
  const router = useRouter()
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [image, setImage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('dermiq_result')
    const img = sessionStorage.getItem('dermiq_image')
    if (!stored) { router.push('/'); return }
    setResult(JSON.parse(stored))
    setImage(img)
    setMounted(true)
  }, [router])

  if (!mounted || !result) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-t-2 border-yellow-400 animate-spin" />
    </div>
  )

  const top = result.topPrediction
  const risk = top.risk as RiskLevel
  const riskConf = RISK_CONFIG[risk]
  const riskIcon = { low: CheckCircle, moderate: Clock, high: AlertTriangle, critical: AlertTriangle }[risk]
  const RiskIcon = riskIcon

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'DermIQ Analysis Result',
        text: `Skin lesion classified as: ${top.name} (${top.confidence}% confidence). Risk: ${riskConf.label}.`,
      })
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 z-10"
        style={{ background: 'rgba(8,9,26,0.92)', backdropFilter: 'blur(16px)' }}>
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-white/50 text-sm hover:text-white/80 transition-colors">
          <ArrowLeft className="w-4 h-4" />New scan
        </button>
        <span className="font-display text-sm text-white/60">Analysis Results</span>
        <button onClick={handleShare} className="text-white/40 hover:text-white/70 transition-colors">
          <Share2 className="w-4 h-4" />
        </button>
      </header>

      <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-5">
        <div className="glass rounded-2xl overflow-hidden">
          <div className="sm:flex">
            {image && (
              <div className="sm:w-48 sm:flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Analysed lesion" className="w-full result-image sm:h-full" />
              </div>
            )}
            <div className="p-5 flex flex-col justify-center gap-3">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium w-fit ${riskConf.bg} ${riskConf.text} border ${riskConf.border}`}>
                <RiskIcon className="w-3.5 h-3.5" />{riskConf.label}
              </div>
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <h2 className="font-display text-2xl text-white/95">{top.name}</h2>
                  <span className="font-mono-custom text-lg gold-text font-medium">{top.confidence}%</span>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">{top.layman}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-2 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-yellow-400/70 text-xs font-mono-custom uppercase tracking-widest mb-3">
            <Info className="w-3.5 h-3.5" />Clinical Context
          </div>
          <p className="text-white/60 text-sm leading-relaxed">{top.description}</p>
        </div>

        <div className={`rounded-2xl p-5 border ${riskConf.border} ${riskConf.bg}`}>
          <p className={`text-xs font-mono-custom uppercase tracking-widest mb-3 ${riskConf.text}`}>What to do</p>
          <p className="text-white/80 text-sm leading-relaxed mb-3">{top.action}</p>
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <Clock className="w-3.5 h-3.5" />{top.urgency}
          </div>
        </div>

        <div className="glass-2 rounded-2xl p-5">
          <p className="text-xs font-mono-custom uppercase tracking-widest text-white/30 mb-5">All 7 classes · Confidence breakdown</p>
          <div className="space-y-3.5">
            {result.allPredictions.map((pred, i) => (
              <div key={pred.lesionId}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-medium ${i === 0 ? 'text-white/90' : 'text-white/45'}`}>{pred.name}</span>
                  <span className={`text-xs font-mono-custom ${i === 0 ? 'gold-text' : 'text-white/35'}`}>{pred.confidence}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full rounded-full confidence-fill ${i === 0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-300' : 'bg-white/15'}`}
                    style={{ width: `${pred.confidence}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-white/20 text-xs font-mono-custom">
          Analysed {new Date(result.analyzedAt).toLocaleString('en-GB')}
        </p>

        <div className="rounded-xl border border-white/5 p-4">
          <p className="text-white/25 text-xs leading-relaxed text-center">{result.disclaimer}</p>
        </div>

        <button onClick={() => { sessionStorage.clear(); router.push('/') }}
          className="w-full py-3.5 rounded-xl border border-yellow-400/25 text-yellow-400/70 text-sm hover:bg-yellow-400/8 transition-all flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4" />Analyse another lesion
        </button>
        <div className="pb-8" />
      </div>
    </main>
  )
}