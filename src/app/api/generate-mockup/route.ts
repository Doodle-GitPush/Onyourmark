import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(API_KEY)

export async function POST(req: NextRequest) {
    if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
        return NextResponse.json({ error: 'no_key' }, { status: 401 })
    }

    try {
        const { scene, logoBase64 } = await req.json()
        if (!scene) {
            return NextResponse.json({ error: 'scene is required' }, { status: 400 })
        }

        // ── Approach: pass the actual logo PNG as multimodal input to gemini-2.5-flash-image.
        // The model sees the real logo and generates a scene that incorporates it naturally.
        if (logoBase64 && logoBase64.length > 100) {
            try {
                console.log('[mockup] Trying multimodal image gen with logo reference...')
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const imageModel = genAI.getGenerativeModel({
                    model: 'gemini-2.5-flash-image',
                    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } as any
                })

                const prompt = `You are a professional brand mockup photographer.
Using the logo shown in the image, create a ultra-realistic, cinematic, photographic scene: "${scene}".
Requirements:
- The exact logo from the image must be physically present in the scene (on signage, packaging, window, surface, etc.)
- The logo should look naturally placed and scaled appropriately to the environment
- Professional commercial photography quality, 8k, sharp focus, cinematic lighting
- Do NOT alter or stylize the logo — reproduce it exactly as provided`

                const result = await imageModel.generateContent([
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: 'image/png',
                            data: logoBase64,
                        }
                    }
                ])

                const parts = result.response?.candidates?.[0]?.content?.parts ?? []
                for (const part of parts) {
                    if (part.inlineData?.mimeType?.startsWith('image/')) {
                        console.log('[mockup] ✓ Multimodal image gen succeeded')
                        return NextResponse.json({
                            imageBase64: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                            model: 'gemini-2.5-flash-image-ref',
                            prompt,
                        })
                    }
                }
                console.warn('[mockup] Multimodal returned no image parts, falling through...')
            } catch (e) {
                console.warn('[mockup] Multimodal image gen failed:', e)
            }
        }

        // ── Fallback: text-only prompt generation → then image gen without ref
        const textModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
        const promptRes = await textModel.generateContent(
            `Write a concise AI image generation prompt (max 60 words) for: "${scene}".
A brand logo is naturally embedded and prominently visible in the scene.
Style: cinematic lighting, photorealistic, commercial brand mockup photography, 8k, sharp focus.
Return ONLY the prompt text.`
        )
        const imagePrompt = promptRes.response.text().trim()
        console.log('[mockup] Text-only fallback prompt:', imagePrompt.slice(0, 80))

        // Try text-only gemini image generation
        try {
            console.log('[mockup] Trying gemini-2.5-flash-image (text only)...')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const imageModel = genAI.getGenerativeModel({
                model: 'gemini-2.5-flash-image',
                generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } as any
            })
            const imgRes = await imageModel.generateContent(imagePrompt)
            const parts = imgRes.response?.candidates?.[0]?.content?.parts ?? []
            for (const part of parts) {
                if (part.inlineData?.mimeType?.startsWith('image/')) {
                    console.log('[mockup] ✓ gemini-2.5-flash-image text-only succeeded')
                    return NextResponse.json({
                        imageBase64: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                        model: 'gemini-2.5-flash-image',
                        prompt: imagePrompt,
                    })
                }
            }
        } catch (e) {
            console.warn('[mockup] gemini text-only failed:', e)
        }

        // ── Final fallback: Pollinations FLUX
        console.log('[mockup] Falling back to Pollinations FLUX...')
        const enc = encodeURIComponent(imagePrompt)
        const seed = Math.floor(Math.random() * 999999)
        const polRes = await fetch(
            `https://image.pollinations.ai/prompt/${enc}?nologo=true&width=1600&height=900&seed=${seed}&model=flux`,
            { headers: { 'User-Agent': 'OnYourMark/1.0' }, redirect: 'follow' }
        )
        if (!polRes.ok) {
            return NextResponse.json({ error: 'All image generation services unavailable.' }, { status: 500 })
        }
        const buf = await polRes.arrayBuffer()
        const b64 = Buffer.from(buf).toString('base64')
        const mime = polRes.headers.get('content-type') || 'image/jpeg'
        console.log('[mockup] ✓ Pollinations succeeded')
        return NextResponse.json({
            imageBase64: `data:${mime};base64,${b64}`,
            model: 'pollinations-flux',
            prompt: imagePrompt,
        })

    } catch (err: unknown) {
        console.error('[mockup] Fatal error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to generate mockup' },
            { status: 500 }
        )
    }
}
