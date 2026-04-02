export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080a12] px-6">
      <div className="w-full max-w-sm text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-amber-500/30 bg-amber-500/10 mb-6">
          <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-white mb-2">Access request received</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          We&apos;ve notified our team. You&apos;ll get an email the moment your access is approved — usually within one business day.
        </p>

        {/* Steps */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-left space-y-4 mb-6">
          {[
            { done: true,  label: 'Account created' },
            { done: true,  label: 'Request sent to admin' },
            { done: false, label: 'Admin approves your access' },
            { done: false, label: 'Welcome email + first brief' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                step.done
                  ? 'bg-emerald-500/20 border border-emerald-500/40'
                  : 'bg-white/5 border border-white/10'
              }`}>
                {step.done ? (
                  <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                )}
              </div>
              <span className={`text-sm ${step.done ? 'text-gray-300' : 'text-gray-500'}`}>{step.label}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-600">
          Questions? Email us at{' '}
          <a href="mailto:support@intelligentbrief.com" className="text-blue-400 hover:underline">
            support@intelligentbrief.com
          </a>
        </p>
      </div>
    </div>
  )
}
