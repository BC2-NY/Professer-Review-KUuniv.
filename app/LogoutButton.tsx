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
      className="inline-flex h-11 items-center whitespace-nowrap rounded-xl bg-[#F4F3FA] px-[17px] font-heading text-[13.5px] font-bold text-[#6A4DE0] transition-colors hover:bg-[#ECEAF3]"
    >
      ログアウト
    </button>
  )
}