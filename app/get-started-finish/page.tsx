'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// This page is the landing point after email confirmation.
// It reads the saved plan + details from localStorage and completes the flow.
export default function GetStartedFinishPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Completing your setup…')

  useEffect(() => {
    async function finish() {
      try {
        const plan    = localStorage.getItem('ib_plan') ?? 'solo'
        const billing = localStorage.getItem('ib_billing') ?? 'monthly'
        const raw     = localStorage.getItem('ib_details')
        const details = raw ? JSON.parse(raw) : {}

        if (details.full_name) {
          setStatus('Saving your profile…')
          await fetch('/api/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...details, plan }),
          })
        }

        setStatus('Redirecting to payment…')
        const stripeRes = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, billing }),
        })

        localStorage.removeItem('ib_plan')
        localStorage.removeItem('ib_billing')
        localStorage.removeItem('ib_details')

        if (stripeRes.ok) {
          const { url } = await stripeRes.json()
          if (url) { window.location.href = url; return }
        }

        router.replace('/pending')
      } catch {
        router.replace('/pending')
      }
    }
    finish()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080a12]">
      <div className="text-center">
        <span className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin block mx-auto mb-4" />
        <p className="text-sm text-gray-400">{status}</p>
      </div>
    </div>
  )
}
