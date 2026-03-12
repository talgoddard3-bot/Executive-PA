import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '@/lib/get-company'
import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/claude/client'

export const maxDuration = 30

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { docId } = await request.json()
  if (!docId) return NextResponse.json({ error: 'docId required' }, { status: 400 })

  const db = service()
  const { data: doc } = await db
    .from('uploaded_documents')
    .select('id, title, description, storage_path, file_type')
    .eq('id', docId)
    .eq('company_id', user.companyId)
    .single()

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.from('uploaded_documents').update({ processing_status: 'processing' }).eq('id', docId)

  try {
    const { data: fileData, error: dlErr } = await db.storage
      .from('internal-documents')
      .download(doc.storage_path)

    if (dlErr || !fileData) throw new Error('Download failed: ' + dlErr?.message)

    const bytes = Buffer.from(await fileData.arrayBuffer())
    const processed = await analyzeFile(doc.file_type, doc.title, doc.description ?? '', bytes)

    await db.from('uploaded_documents').update({
      processed_content: processed,
      processing_status: 'done',
    }).eq('id', docId)

    return NextResponse.json({ processed_content: processed })
  } catch (err) {
    await db.from('uploaded_documents').update({ processing_status: 'failed' }).eq('id', docId)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

async function analyzeFile(fileType: string, title: string, userDesc: string, bytes: Buffer): Promise<string> {
  const IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'gif', 'webp']
  const EXCEL_TYPES = ['xlsx', 'xls']
  const TEXT_TYPES  = ['csv', 'txt']

  if (IMAGE_TYPES.includes(fileType)) return analyzeImage(fileType, title, userDesc, bytes)
  if (EXCEL_TYPES.includes(fileType))  return analyzeExcel(title, userDesc, bytes)
  if (TEXT_TYPES.includes(fileType))   return analyzeText(title, userDesc, bytes.toString('utf-8').slice(0, 8000))
  return `[Not auto-analyzed] ${userDesc}`
}

async function analyzeImage(fileType: string, title: string, userDesc: string, bytes: Buffer): Promise<string> {
  const mediaTypes: Record<string, 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  }
  const mediaType = mediaTypes[fileType] ?? 'image/png'
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: bytes.toString('base64') } },
        { type: 'text', text: `Business dashboard titled "${title}".${userDesc ? ` Context: ${userDesc}` : ''} Extract all key metrics, trends (↑/↓), comparisons, and actionable signals visible in this image. Concise bullet points only.` },
      ],
    }],
  })
  return msg.content.filter(b => b.type === 'text').map(b => (b as { text: string }).text).join('')
}

async function analyzeExcel(title: string, userDesc: string, bytes: Buffer): Promise<string> {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(bytes, { type: 'buffer' })
  const parts: string[] = []
  for (const name of wb.SheetNames.slice(0, 3)) {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name]).split('\n').slice(0, 60).join('\n')
    parts.push(`Sheet "${name}":\n${csv}`)
  }
  return analyzeText(title, userDesc, parts.join('\n\n').slice(0, 6000))
}

async function analyzeText(title: string, userDesc: string, text: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Business document titled "${title}".${userDesc ? ` Context: ${userDesc}` : ''}\n\nData:\n${text}\n\nExtract key business insights, trends, and actionable signals. Concise bullet points only.`,
    }],
  })
  return msg.content.filter(b => b.type === 'text').map(b => (b as { text: string }).text).join('')
}
