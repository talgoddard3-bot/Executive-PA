import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('companies')
    .select('name, logo_url, brand_color')
    .eq('user_id', DEV_USER_ID)
    .single()

  return NextResponse.json(data ?? { name: null, logo_url: null, brand_color: null })
}
