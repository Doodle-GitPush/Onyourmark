import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: NextRequest) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        return NextResponse.json({ error: 'no_key' }, { status: 401 })
    }

    try {
        const { imageBase64 } = await req.json()
        if (!imageBase64) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 })
        }

        // Strip the data URI prefix if present
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const prompt = `You are a world-class brand strategist and designer. A user has uploaded their logo. Analyze this logo image carefully and return a JSON object (no markdown, no code blocks — raw JSON only) with these exact keys:

{
  "brandName": "A short, evocative brand name that fits this logo's visual style (2-3 words max)",
  "tagline": "A punchy, memorable tagline (max 8 words)",
  "meaning": "A 2-3 sentence paragraph about what this logo communicates visually — its shapes, composition, and implied emotion",
  "personality": ["Array", "of", "5", "single-word", "adjectives describing the brand personality"],
  "colorStory": "1-2 sentences about what the colors communicate psychologically",
  "industry": "Best-fit industry or category (e.g. Tech, Wellness, Finance, Fashion)"
}

Be insightful, poetic, and specific to what you actually see in this logo. Do not be generic.`

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: 'image/png',
                    data: base64Data,
                },
            },
        ])

        const text = result.response.text().trim()

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 })
        }

        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json(parsed)
    } catch (err: unknown) {
        console.error('Logo analysis error:', err)
        const message = err instanceof Error ? err.message : 'Analysis failed'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
