import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Create a test file
    const testContent = `Test file created at ${new Date().toISOString()}`
    const testFile = new Blob([testContent], { type: 'text/plain' })
    const fileName = `test-${Date.now()}.txt`

    // Upload test file to product-images bucket
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, testFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      message: 'Storage upload successful! ✅',
      path: data.path,
      url: urlData.publicUrl,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Storage upload error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Storage upload failed ❌',
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Make sure the "product-images" bucket exists in Supabase Storage',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
