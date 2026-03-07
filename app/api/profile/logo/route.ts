import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const brandColor = formData.get('brand_color') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'File must be PNG, JPG, WebP or SVG' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', DEV_USER_ID)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const ext = file.name.split('.').pop() ?? 'png'
    const path = `${company.id}/logo.${ext}`

    const bytes = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(path, bytes, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from('company-logos')
      .getPublicUrl(path)

    const logoUrl = `${urlData.publicUrl}?v=${Date.now()}`

    const update: Record<string, string> = { logo_url: logoUrl }
    if (brandColor && /^#[0-9a-fA-F]{6}$/.test(brandColor)) {
      update.brand_color = brandColor
    }

    await supabase.from('companies').update(update).eq('id', company.id)

    return NextResponse.json({ logo_url: logoUrl, brand_color: brandColor })
  } catch (err) {
    console.error('[profile/logo] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
