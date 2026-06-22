'use client'
// app/professors/[id]/CommentSection.tsx — Client Component
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface Comment {
  id: string
  body: string
  created_at: string
  mine: boolean
}

interface Props {
  professorId: string
  initialComments: Comment[]
  isAuthed: boolean
}

export default function CommentSection({
  professorId,
  initialComments,
  isAuthed,
}: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canPost = draft.trim().length > 0 && !submitting

  const post = async () => {
    const body = draft.trim()
    if (!body) return
    if (!isAuthed) {
      router.push('/login')
      return
    }
    setSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          target_id: professorId,
          target_type: 'professor',
          body,
        })
        .select('id, body, created_at')
        .single()

      if (error) throw error
      if (data) {
        setComments((prev) => [{ ...(data as any), mine: true }, ...prev])
        setDraft('')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('このコメントを削除しますか？')) return
    // 楽観的削除
    const prev = comments
    setComments((c) => c.filter((x) => x.id !== id))
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) {
      setComments(prev) // ロールバック
      console.error(error)
    }
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  return (
    <section className="rounded-card bg-white p-[22px] shadow-card">
      <h2 className="mb-3.5 font-heading text-base font-bold text-ink">
        コメント <span className="text-[#9B85FF]">{comments.length}</span>
      </h2>

      {/* 投稿フォーム */}
      {isAuthed ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="この先生について書く（匿名で投稿されます）"
            className="w-full resize-none rounded-input border-2 border-[#ECEAF3] bg-[#FAFAFE] px-3.5 py-3 text-[13.5px] leading-relaxed text-ink outline-none transition-colors placeholder:text-[#B6B3C6] focus:border-[#C9BCFF] focus:bg-white"
          />
          <div className="mt-2.5 flex justify-end">
            <button
              type="button"
              onClick={post}
              disabled={!canPost}
              className={`rounded-btn px-6 py-2.5 font-heading text-sm font-bold transition-all active:scale-[0.97] ${
                canPost
                  ? 'bg-[linear-gradient(135deg,#8B6BFF,#7B61FF)] text-white shadow-[0_6px_16px_rgba(123,97,255,0.30)]'
                  : 'cursor-default bg-[#E7E4F2] text-[#B6B3C6]'
              }`}
            >
              {submitting ? '投稿中…' : '投稿する'}
            </button>
          </div>
        </>
      ) : (
        <p className="text-[13px] text-muted">
          コメントするには{' '}
          <a href="/login" className="text-brand underline">
            ログイン
          </a>{' '}
          が必要です
        </p>
      )}

      {/* 一覧 */}
      <div className="mt-[18px] flex flex-col gap-3.5">
        {comments.map((c) => (
          <div key={c.id} className="rounded-[18px] bg-[#F8F7FC] px-4 py-[15px]">
            <p className="text-[13.5px] leading-[1.7] text-[#3A3852]">{c.body}</p>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] text-[#A8A6BA]">
                {c.mine && (
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 font-bold text-[#6A4DE0]">
                    あなた
                  </span>
                )}
                {fmt(c.created_at)}
              </span>
              {c.mine && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="px-1.5 py-1 text-[12px] font-bold text-[#A8A6BA] transition-colors hover:text-[#E8623F]"
                >
                  削除
                </button>
              )}
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="py-6 text-center text-[13px] text-muted">
            まだコメントがありません。最初のコメントを書きましょう！
          </p>
        )}
      </div>
    </section>
  )
}
