'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

// 許可する学内メールドメイン（DB側トリガーと必ず一致させる）
const ALLOWED_DOMAIN_REGEX = /@([a-z0-9-]+\.)*kansai-u\.ac\.jp$/i

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [studentId, setStudentId] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSignup = async () => {
    setError('')

    const studentIdRegex = /^[\u4e00-\u9fff]\d{2}-\d{4}$/
    if (!studentIdRegex.test(studentId)) {
      setError('学籍番号の形式が正しくありません（例: 情25-0101）')
      return
    }
    if (!ALLOWED_DOMAIN_REGEX.test(email.trim())) {
      setError('関西大学の学内メールアドレス（@kansai-u.ac.jp）で登録してください')
      return
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上で設定してください')
      return
    }

    setLoading(true)
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: { student_id: studentId },
      },
    })

    if (signUpError) {
      // DBトリガーのドメイン拒否は汎用エラーで返ることが多いので、ドメイン文言で案内
      if (
        signUpError.message.includes('allowed_domain_only') ||
        signUpError.message.toLowerCase().includes('database error')
      ) {
        setError('関西大学の学内メールアドレスでのみ登録できます')
      } else {
        setError('登録エラー: ' + signUpError.message)
      }
      setLoading(false)
      return
    }

    setLoading(false)
    setSent(true)
  }

  // 確認メール送信後の案内
  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-sm w-full max-w-sm text-center">
          <h1 className="text-xl font-bold mb-3">確認メールを送りました</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            <span className="font-bold">{email}</span> 宛に確認メールを送信しました。
            メール内のリンクを開くと登録が完了し、ログインできます。
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm text-blue-500"
          >
            ログイン画面へ
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm w-full max-w-sm">
        <h1 className="text-xl font-bold mb-6">新規登録</h1>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">学籍番号</label>
            <input
              type="text"
              placeholder="例: 情25-0101"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

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
              placeholder="8文字以上"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-blue-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {loading ? '登録中...' : '登録する'}
          </button>

          <p className="text-center text-sm text-gray-500">
            アカウントをお持ちの方は
            <Link href="/login" className="text-blue-500 ml-1">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}