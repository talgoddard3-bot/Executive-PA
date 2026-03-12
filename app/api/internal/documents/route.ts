import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '@/lib/get-company'
import { NextResponse } from 'next/server'

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/internal/documents  → active documents for the company
export async function GET() {
  const user = await getSessionUser()
  if (!user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await service()
    .from('uploaded_documents')
    .select('id, title, description, processed_content, processing_status, file_type, file_size, expires_at, created_at, target_brief_id')
    .eq('company_id', user.companyId)
    .eq('archived', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/internal/documents  → save document metadata after upload
// body: { title, description, storagePath, fileType, fileSize?, expiresInDays? }
export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user?.companyId || !user.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description, storagePath, fileType, fileSize, expiresInDays = 90, briefId } = await request.json()
  if (!title?.trim() || !storagePath) return NextResponse.json({ error: 'title and storagePath required' }, { status: 400 })

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + Math.min(expiresInDays, 365))

  const { data, error } = await service()
    .from('uploaded_documents')
    .insert({
      company_id:   user.companyId,
      user_id:      user.userId,
      title:        title.trim(),
      description:  description?.trim() ?? '',
      storage_path: storagePath,
      file_type:    fileType,
      file_size:        fileSize ?? null,
      expires_at:       expiresAt.toISOString(),
      target_brief_id:  briefId ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
