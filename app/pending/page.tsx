export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-5">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Access Pending</h1>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          Your account is awaiting admin approval. You&apos;ll receive an email once you&apos;re approved.
        </p>
        <p className="mt-4 text-xs text-gray-400">
          If you think this is a mistake, contact your administrator.
        </p>
      </div>
    </div>
  )
}
