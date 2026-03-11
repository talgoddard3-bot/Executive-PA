import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'
import type { Brief, BriefContent, Company } from './types'

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface LatestBriefData {
  company: Company | null
  brief: (Brief & { content: BriefContent }) | null
  weekOf: string | null
}

export async function getLatestBrief(): Promise<LatestBriefData> {
  const companyId = await getSessionCompanyId()
  if (!companyId) return { company: null, brief: null, weekOf: null }

  const db = service()

  const { data: company } = await db
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

  if (!company) return { company: null, brief: null, weekOf: null }

  const { data: brief } = await db
    .from('briefs')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'complete')
    .order('week_of', { ascending: false })
    .limit(1)
    .single()

  const weekOf = brief
    ? new Date(brief.week_of).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  return {
    company: company as Company,
    brief: brief as (Brief & { content: BriefContent }) | null,
    weekOf,
  }
}

export async function getBriefById(id: string): Promise<LatestBriefData> {
  const companyId = await getSessionCompanyId()
  if (!companyId) return { company: null, brief: null, weekOf: null }

  const db = service()

  const { data: company } = await db
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

  if (!company) return { company: null, brief: null, weekOf: null }

  const { data: brief } = await db
    .from('briefs')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  const weekOf = brief
    ? new Date(brief.week_of).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  return {
    company: company as Company,
    brief: brief as (Brief & { content: BriefContent }) | null,
    weekOf,
  }
}
