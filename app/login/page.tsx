'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      // メール未確認を区別して案内
      if (
        signInError.code === 'email_not_confirmed' ||
        signInError.message.toLowerCase().includes('not confirmed')
      ) {
        setError('メールアドレスが未確認です。確認メールのリンクを開いてから再度ログインしてください。')
      } else {
        setError('メールアドレスまたはパスワードが正しくありません')
      }
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh() // サーバーコンポーネントにログイン状態を反映
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm w-full max-w-sm">
        <h1 className="text-xl font-bold mb-6">ログイン</h1>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">学内メールアドレス</label>
            <input
              type="email"
              placeholder="example@kansai-u.ac.jp"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">パスワード</label>
            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>

          <p className="text-center text-sm text-gray-500">
            アカウントをお持ちでない方は
            <Link href="/signup" className="text-blue-500 ml-1">
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}