import { NextResponse } from 'next/server'
import { getHomepagePreview } from '@/lib/home/getHomepagePreview'

export async function GET() {
  try {
    const data = await getHomepagePreview()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[api/home-preview] Failed to load homepage preview', error)
    return NextResponse.json({ error: 'No se pudo cargar la portada.' }, { status: 500 })
  }
}
