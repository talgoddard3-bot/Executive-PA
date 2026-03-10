import { createClient } from '@supabase/supabase-js'
import type { Brief, BriefContent, Company } from './types'

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'

export interface LatestBriefData {
  company: Company | null
  brief: (Brief & { content: BriefContent }) | null
  weekOf: string | null
}

export async function getLatestBrief(): Promise<LatestBriefData> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', DEV_USER_ID)
    .single()

  if (!company) return { company: null, brief: null, weekOf: null }

  const { data: brief } = await supabase
    .from('briefs')
    .select('*')
    .eq('company_id', company.id)
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', DEV_USER_ID)
    .single()

  if (!company) return { company: null, brief: null, weekOf: null }

  const { data: brief } = await supabase
    .from('briefs')
    .select('*')
    .eq('id', id)
    .eq('company_id', company.id)
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
