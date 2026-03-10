'use client'

import Link from 'next/link'
import { useTheme } from '@/components/ThemeProvider'

function SettingRow({ label, description, children }: {
  label: string; description?: string; children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-5 px-6">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        on ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const { theme, toggle } = useTheme()

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Manage your display and application preferences.</p>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm mb-4">
        <div className="px-6 pt-5 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Appearance</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          <SettingRow
            label="Dark mode"
            description="Switch between light and dark interface theme."
          >
            <Toggle on={theme === 'dark'} onToggle={toggle} />
          </SettingRow>
        </div>
      </div>

      {/* Account */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm mb-4">
        <div className="px-6 pt-5 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Account</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          <SettingRow
            label="My Profile"
            description="Update your name, photo, and email address."
          >
            <Link
              href="/me"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Edit →
            </Link>
          </SettingRow>
          <SettingRow
            label="Company Profile"
            description="Update company details, revenue exposure, and competitors."
          >
            <Link
              href="/profile"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Edit →
            </Link>
          </SettingRow>
          <SettingRow
            label="Brief Schedule"
            description="Configure when weekly briefs are generated and emailed."
          >
            <Link
              href="/settings/schedule"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Configure →
            </Link>
          </SettingRow>
        </div>
      </div>

      {/* About */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
        <div className="px-6 pt-5 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">About</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          <SettingRow label="Application" description="Executive Intelligence Brief">
            <span className="text-xs text-gray-400">v1.0</span>
          </SettingRow>
          <SettingRow label="AI Model" description="Brief synthesis engine">
            <span className="text-xs text-gray-400">Claude Sonnet 4.6</span>
          </SettingRow>
          <SettingRow label="Trend Analysis" description="Historic comparison engine">
            <span className="text-xs text-gray-400">Claude Haiku 4.5</span>
          </SettingRow>
        </div>
      </div>
    </div>
  )
}
