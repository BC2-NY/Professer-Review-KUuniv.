'use client'
// app/LogoutButton.tsx — ヘッダーのログアウトボタン
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F3FA] text-[#6A4DE0] transition-colors hover:bg-[#ECEAF3] sm:h-11 sm:w-auto sm:whitespace-nowrap sm:px-[17px] sm:font-heading sm:text-[13.5px] sm:font-bold"
    >
      <svg className="sm:hidden" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <span className="hidden sm:inline">ログアウト</span>
    </button>
  )
}