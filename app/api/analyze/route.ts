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

    const token = process.env.HUGGINGFACE_API_TOKEN
    if (!token) return NextResponse.json({ error: 'Missing API token' }, { status: 500 })

    const modelId = process.env.HF_MODEL_ID || 'Anwarkh1/Skin_Lesion-Image_Classification'

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    const hfUrl = `https://api-inference.huggingface.co/models/${modelId}`

    const hfResponse = await fetch(hfUrl, {
      method: 'POST',
     headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'x-wait-for-model': 'true',
    },
    body: buffer,
    })

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text()
      console.error('HuggingFace error:', hfResponse.status, errorText)
      if (hfResponse.status === 503) {
        return NextResponse.json({ error: 'Model warming up. Wait 20s and retry.', retryable: true }, { status: 503 })
      }
      return NextResponse.json({ error: `HF error: ${hfResponse.status}` }, { status: 500 })
    }

    const rawPredictions: Array<{ label: string; score: number }> = await hfResponse.json()
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
