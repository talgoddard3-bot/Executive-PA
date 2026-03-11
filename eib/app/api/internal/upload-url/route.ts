import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '@/lib/get-company'
import { NextResponse } from 'next/server'

// POST /api/internal/upload-url
// body: { fileName, contentType }
// Returns a signed upload URL so the client can PUT the file directly to storage
export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user?.companyId || !user.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fileName, contentType } = await request.json()
  if (!fileName) return NextResponse.json({ error: 'fileName required' }, { status: 400 })

  // Sanitise filename
  const ext = fileName.split('.').pop()?.toLowerCase() ?? 'bin'
  const ALLOWED = ['pdf', 'xlsx', 'xls', 'csv', 'png', 'jpg', 'jpeg', 'txt', 'docx', 'pptx']
  if (!ALLOWED.includes(ext)) {
    return NextResponse.json({ error: `File type .${ext} not allowed` }, { status: 400 })
  }

  const uuid = crypto.randomUUID()
  const storagePath = `${user.companyId}/${uuid}.${ext}`

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.storage
    .from('internal-documents')
    .createSignedUploadUrl(storagePath)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    signedUrl: data.signedUrl,
    storagePath,
    fileType: ext,
  })
}
