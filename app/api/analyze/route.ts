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
  disclaimer: string
  analyzedAt: string
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()
    if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const spaceUrl = 'https://uzzyy-dermiq-api.hf.space/run/predict'

    const hfResponse = await fetch(spaceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [image] }),
    })

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text()
      console.error('Space error:', hfResponse.status, errorText)
      return NextResponse.json({ error: `Space error: ${hfResponse.status}` }, { status: 500 })
    }

    const spaceResult = await hfResponse.json()
    const jsonString = spaceResult.data[0]
    const rawPredictions: Array<{ label: string; score: number }> = JSON.parse(jsonString)
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
        urgency: 'Book an appointment.', confidence: Math.round(pred.score * 100),
        emoji: '❓', color: 'text-gray-400',
      }
    })

    const top = enriched[0]
    return NextResponse.json({
      topPrediction: {
        lesionId: top.lesionId, name: top.name, layman: top.layman,
        description: top.description, risk: top.risk, action: top.action,
        urgency: top.urgency, confidence: top.confidence, emoji: top.emoji,
      },
      allPredictions: enriched.map((e) => ({
        lesionId: e.lesionId, name: e.name, confidence: e.confidence, risk: e.risk, color: e.color,
      })),
      disclaimer: 'DermIQ is an AI-assisted screening tool and does NOT replace professional medical advice. Always consult a qualified dermatologist or GP.',
      analyzedAt: new Date().toISOString(),
    } as AnalysisResult)

  } catch (err) {
    console.error('Analyze error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}