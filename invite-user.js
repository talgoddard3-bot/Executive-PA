import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const [email, fullName, position, companyName] = process.argv.slice(2)

if (!email || !fullName || !position || !companyName) {
  console.error('Usage: node invite-user.js <email> <full_name> <position> <company_name>')
  console.error('Example: node invite-user.js jane@acme.com "Jane Smith" "Chief Operating Officer" "Acme Corp"')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function inviteUser() {
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/get-started`,
  })

  if (inviteError || !inviteData.user) {
    console.error('Invite error:', inviteError)
    return
  }

  const userId = inviteData.user.id

  // Insert into user_profiles
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      full_name: fullName,
      email,
      position,
      language: 'en',
      avatar_url: null,
      status: 'pending',
      company_name: companyName,
      requested_at: new Date().toISOString(),
      is_admin: false,
    })

  if (profileError) {
    console.error('Profile error:', profileError)
  } else {
    console.log('User invited successfully:', userId)
  }
}

inviteUser()
