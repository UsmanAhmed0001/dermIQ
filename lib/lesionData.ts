// ─────────────────────────────────────────────────────────────────────────────
// lib/lesionData.ts
// 
// WHAT THIS FILE DOES:
// Defines the 7 skin lesion classes from the HAM10000 dataset with:
// - Human-readable names and descriptions
// - Risk levels (low / moderate / high / critical)
// - What the user should do next
// - Color coding for UI
//
// WHY THIS MATTERS FOR THE PRODUCT:
// A raw AI confidence score means nothing to a user. This layer translates
// model output into clinical context — making DermIQ useful, not just accurate.
// ─────────────────────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical'

export interface LesionClass {
  id: string           // HAM10000 abbreviation (e.g. "mel")
  label: string        // What the model returns (must match HF model output)
  name: string         // Human readable name
  layman: string       // Plain English explanation
  description: string  // Clinical description
  risk: RiskLevel
  action: string       // What should the user do?
  urgency: string      // Timeline advice
  color: string        // Tailwind color class for UI
  emoji: string
}

// These 7 classes directly match the HAM10000 dataset your dissertation used.
// The `label` field must match what the HuggingFace model returns.
export const LESION_CLASSES: Record<string, LesionClass> = {
  nv: {
    id: 'nv',
    label: 'Melanocytic nevi',
    name: 'Common Mole',
    layman: 'A harmless pigmented spot — the most common type of skin growth.',
    description: 'Melanocytic nevi are benign proliferations of melanocytes. They appear as well-defined, uniformly pigmented macules or papules.',
    risk: 'low',
    action: 'No immediate action required. Monitor for changes in size, shape, or colour using the ABCDE rule.',
    urgency: 'Routine annual skin check recommended.',
    color: 'text-green-400',
    emoji: '✅',
  },
  mel: {
    id: 'mel',
    label: 'Melanoma',
    name: 'Melanoma',
    layman: 'A serious form of skin cancer that requires prompt medical attention.',
    description: 'Melanoma is a malignant tumour of melanocytes. It is the most dangerous form of skin cancer and requires urgent evaluation by a dermatologist.',
    risk: 'critical',
    action: 'See a dermatologist urgently. Do not wait. Early detection dramatically improves outcomes.',
    urgency: 'Book an appointment within 48–72 hours. If GP can refer urgently under the 2-week wait cancer pathway, do so.',
    color: 'text-red-500',
    emoji: '🚨',
  },
  bkl: {
    id: 'bkl',
    label: 'Benign keratosis-like lesions',
    name: 'Benign Keratosis',
    layman: 'A harmless, often rough or scaly skin growth. Includes seborrhoeic keratoses and solar lentigines.',
    description: 'Benign keratosis-like lesions encompass seborrhoeic keratoses, solar lentigines (age spots), and lichen-planus-like keratoses. Generally benign.',
    risk: 'low',
    action: 'Typically no treatment needed. Can be removed for cosmetic reasons by a dermatologist.',
    urgency: 'Non-urgent. Mention at your next routine appointment.',
    color: 'text-green-400',
    emoji: '✅',
  },
  bcc: {
    id: 'bcc',
    label: 'Basal cell carcinoma',
    name: 'Basal Cell Carcinoma',
    layman: 'The most common form of skin cancer. Rarely spreads but should be treated.',
    description: 'Basal cell carcinoma arises from basal cells of the epidermis. It is slow-growing and rarely metastasises, but local invasion can cause significant tissue damage if untreated.',
    risk: 'high',
    action: 'See your GP or a dermatologist. Treatment is usually straightforward when caught early (surgical excision or topical therapy).',
    urgency: 'Book within 2 weeks. Request urgent referral if growing rapidly or bleeding.',
    color: 'text-orange-400',
    emoji: '⚠️',
  },
  akiec: {
    id: 'akiec',
    label: 'Actinic keratoses',
    name: 'Actinic Keratosis',
    layman: 'A precancerous rough patch caused by sun damage. Can develop into cancer if left untreated.',
    description: 'Actinic keratoses (solar keratoses) are precancerous lesions caused by cumulative UV damage. Without treatment, ~5–10% progress to squamous cell carcinoma.',
    risk: 'moderate',
    action: 'See a GP or dermatologist. Multiple treatment options are available (cryotherapy, topical creams, photodynamic therapy).',
    urgency: 'Book within 4 weeks.',
    color: 'text-yellow-400',
    emoji: '⚡',
  },
  vasc: {
    id: 'vasc',
    label: 'Vascular lesions',
    name: 'Vascular Lesion',
    layman: 'A growth made up of blood vessels — such as angiomas or pyogenic granulomas. Usually benign.',
    description: 'Vascular lesions include cherry angiomas, angiokeratomas, pyogenic granulomas, and haemorrhage. Most are benign but pyogenic granulomas can bleed significantly.',
    risk: 'low',
    action: 'Generally no action needed. If the lesion bleeds easily or grows rapidly, see a GP.',
    urgency: 'Non-urgent unless bleeding or rapidly growing.',
    color: 'text-blue-400',
    emoji: '🔵',
  },
  df: {
    id: 'df',
    label: 'Dermatofibroma',
    name: 'Dermatofibroma',
    layman: 'A firm, harmless bump in the skin — very common and usually requires no treatment.',
    description: 'Dermatofibromas are benign fibrous nodules of the dermis. They are firm, slightly pigmented, and often dimple inward when pinched (Fitzpatrick sign).',
    risk: 'low',
    action: 'No treatment necessary. Can be surgically removed if symptomatic.',
    urgency: 'Non-urgent.',
    color: 'text-green-400',
    emoji: '✅',
  },
}

// Map risk levels to display properties
export const RISK_CONFIG: Record<RiskLevel, { label: string; bg: string; text: string; border: string }> = {
  low:      { label: 'Low Risk',      bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/30' },
  moderate: { label: 'Moderate Risk', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  high:     { label: 'High Risk',     bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  critical: { label: 'Urgent',        bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/30' },
}

// Helper: find lesion data by the raw label the model returns
export function getLesionByLabel(label: string): LesionClass | undefined {
  return Object.values(LESION_CLASSES).find(
    (l) => l.label.toLowerCase() === label.toLowerCase() ||
           l.id === label.toLowerCase()
  )
}
