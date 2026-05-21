export const runtime = 'nodejs'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { getLesionByLabel } from '@/lib/lesionData'

export interface AnalysisResult {
  topPrediction: {
    lesionId: string; name: string; layman: string; description: string
    risk: string; action: string; urgency: string; confidence: number; emoji: string
  }
  allPredictions: Array<{ lesionId: string; name: string; confidence: number; risk: string; color: string }>
  gradcam: string | null
  disclaimer: string
  analyzedAt: string
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()
    if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const response = await fetch('https://web-production-26f73.up.railway.app/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Railway error:', response.status, err)
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: 500 })
    }

    const data = await response.json()
    const rawPredictions: Array<{ label: string; score: number }> = data.predictions
    const sorted = [...rawPredictions].sort((a, b) => b.score - a.score)

    const enriched = sorted.map((pred) => {
      const lesionData = getLesionByLabel(pred.label)
      if (lesionData) {
        return {
          lesionId: lesionData.id, name: lesionData.name, layman: lesionData.layman,
          description: lesionData.description, risk: lesionData.risk, action: lesionData.action,
          urgency: lesionData.urgency, confidence: Math.round(pred.score * 100),
          emoji: lesionData.emoji, color: lesionData.color,
        }
      }
      return {
        lesionId: pred.label, name: pred.label, layman: 'Unknown lesion type.',
        description: '', risk: 'moderate', action: 'Consult a dermatologist.',