// ─────────────────────────────────────────────────────────────────────────────
// app/api/analyze/route.ts
//
// WHAT THIS IS:
// A Next.js API Route (runs on the server, never exposed to the browser).
// The frontend POSTs a base64 image here, this sends it to HuggingFace,
// gets back classification scores, enriches them with clinical data, and
// returns structured JSON to the frontend.
//
// WHY SERVER-SIDE:
// Your HuggingFace API token stays secret (never sent to the browser).
// This same endpoint can be called from Phase 2 iOS/Android apps.
//
// ARCHITECTURE NOTE:
// In Phase 2 you can swap the HF Inference API call for your own
// trained model hosted on HF Spaces or any GPU server — nothing else changes.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { getLesionByLabel, LESION_CLASSES } from '@/lib/lesionData'

const HF_API_URL = `https://api-inference.huggingface.co/models/${
  process.env.HF_MODEL_ID || 'Anwarkh1/Skin_Lesion-Image_Classification'
}`

export interface AnalysisResult {
  topPrediction: {
    lesionId: string
    name: string
    layman: string
    description: string
    risk: string
    action: string
    urgency: string
    confidence: number
    emoji: string
  }
  allPredictions: Array<{
    lesionId: string
    name: string
    confidence: number
    risk: string
    color: string
  }>
  disclaimer: string
  analyzedAt: string
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const token = process.env.HUGGINGFACE_API_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'Server misconfiguration: missing API token' }, { status: 500 })
    }

    // Convert base64 data URL to binary blob for HuggingFace API
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const binaryData = Buffer.from(base64Data, 'base64')

    // Call HuggingFace Inference API
    // The model returns an array like: [{ label: 'Melanoma', score: 0.87 }, ...]
    const hfResponse = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
      },
      body: binaryData,
    })

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text()
      console.error('HuggingFace error:', errorText)

      // Handle model loading (HF cold starts take ~20s)
      if (hfResponse.status === 503) {
        return NextResponse.json(
          { error: 'Model is warming up. Please try again in 20 seconds.', retryable: true },
          { status: 503 }
        )
      }

      return NextResponse.json({ error: 'Classification failed. Please try again.' }, { status: 500 })
    }

    const rawPredictions: Array<{ label: string; score: number }> = await hfResponse.json()

    // Sort by confidence descending
    const sorted = [...rawPredictions].sort((a, b) => b.score - a.score)

    // Enrich with our clinical data
    const enriched = sorted.map((pred) => {
      const lesionData = getLesionByLabel(pred.label)
      if (lesionData) {
        return {
          lesionId: lesionData.id,
          name: lesionData.name,
          layman: lesionData.layman,
          description: lesionData.description,
          risk: lesionData.risk,
          action: lesionData.action,
          urgency: lesionData.urgency,
          confidence: Math.round(pred.score * 100),
          emoji: lesionData.emoji,
          color: lesionData.color,
        }
      }
      // Fallback if label doesn't match our map
      return {
        lesionId: pred.label,
        name: pred.label,
        layman: 'Unknown lesion type.',
        description: '',
        risk: 'moderate',
        action: 'Please consult a dermatologist.',
        urgency: 'Book an appointment.',
        confidence: Math.round(pred.score * 100),
        emoji: '❓',
        color: 'text-gray-400',
      }
    })

    const top = enriched[0]

    const result: AnalysisResult = {
      topPrediction: {
        lesionId: top.lesionId,
        name: top.name,
        layman: top.layman,
        description: top.description,
        risk: top.risk,
        action: top.action,
        urgency: top.urgency,
        confidence: top.confidence,
        emoji: top.emoji,
      },
      allPredictions: enriched.map((e) => ({
        lesionId: e.lesionId,
        name: e.name,
        confidence: e.confidence,
        risk: e.risk,
        color: e.color,
      })),
      disclaimer:
        'DermIQ is an AI-assisted screening tool and does NOT replace professional medical advice. Always consult a qualified dermatologist or GP for diagnosis and treatment.',
      analyzedAt: new Date().toISOString(),
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Analyze error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Allow up to 10MB request body (for high-res images)
export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
}
