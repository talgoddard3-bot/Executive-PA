import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'
import { NextResponse } from 'next/server'

export async function GET() {
  const companyId = await getSessionCompanyId()
  if (!companyId) {
    return NextResponse.json({ name: null, logo_url: null, brand_color: null })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('companies')
    .select('name, logo_url, brand_color')
    .eq('id', companyId)
    .single()

  return NextResponse.json(data ?? { name: null, logo_url: null, brand_color: null })
}
