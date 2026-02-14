import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface SearchParams {
  q?: string
  category?: string
  priceMin?: number
  priceMax?: number
  department?: string
  condition?: string
  status?: string
  sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc'
  page?: number
  limit?: number
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = request.nextUrl

    // Parse query parameters
    const params: SearchParams = {
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      priceMin: searchParams.get('priceMin')
        ? parseFloat(searchParams.get('priceMin')!)
        : undefined,
      priceMax: searchParams.get('priceMax')
        ? parseFloat(searchParams.get('priceMax')!)
        : undefined,
      department: searchParams.get('department') || undefined,
      condition: searchParams.get('condition') || undefined,
      status: searchParams.get('status') || 'active',
      sort: (searchParams.get('sort') as SearchParams['sort']) || 'relevance',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 24,
    }

    // Validate pagination
    const page = Math.max(1, params.page || 1)
    const limit = Math.min(100, Math.max(1, params.limit || 24))
    const offset = (page - 1) * limit

    // Call search_products RPC
    const { data, error } = await supabase.rpc('search_products', {
      search_query: params.q || null,
      category_filter: params.category || null,
      price_min: params.priceMin || null,
      price_max: params.priceMax || null,
      location_department_filter: params.department || null,
      condition_filter: params.condition || null,
      status_filter: params.status || null,
      sort_by: params.sort || 'relevance',
      result_limit: limit,
      result_offset: offset,
    })

    if (error) {
      console.error('Search RPC error:', error)
      return NextResponse.json(
        { error: 'Error al buscar productos', details: error.message },
        { status: 500 }
      )
    }

    // RPC returns single row with {products: JSONB[], total_count: number}
    const result = data?.[0] || { products: [], total_count: 0 }
    const products = result.products || []
    const totalCount = result.total_count || 0

    return NextResponse.json({
      products,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: offset + products.length < totalCount,
    })
  } catch (err) {
    console.error('Search API error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
