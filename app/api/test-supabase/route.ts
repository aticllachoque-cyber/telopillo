import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test database connection by attempting to query
    // This will fail gracefully if no tables exist yet
    const { error } = await supabase
      .from('_test_connection')
      .select('*')
      .limit(1)
    
    // PGRST116 or PGRST205 = table doesn't exist (expected for now)
    if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205') {
      throw error
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection successful! ✅',
      connected: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Supabase connection error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Supabase connection failed ❌',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
