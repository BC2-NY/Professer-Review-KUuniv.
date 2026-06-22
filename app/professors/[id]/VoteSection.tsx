'use client'
// app/professors/[id]/VoteSection.tsx — Client Component
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type VoteType = 'like' | 'dislike' | null

interface Props {
  professorId: string
  initialLikes: number // professor_rankings.likes
  initialDislikes: number // professor_rankings.dislikes
  initialMyVote: VoteType
  isAuthed: boolean
}

export default function VoteSection({
  professorId,
  initialLikes,
  initialDislikes,
  initialMyVote,
  isAuthed,
}: Props) {
  const supabase = createClient()
  const router = useRouter()

  // ビューの実件数をそのまま初期値に（逆算による丸め誤差なし）
  const [likes, setLikes] = useState(initialLikes)
  const [dislikes, setDislikes] = useState(initialDislikes)
  const [myVote, setMyVote] = useState<VoteType>(initialMyVote)
  const [pending, setPending] = useState(false)

  const total = likes + dislikes
  const pct = total > 0 ? Math.round((likes / total) * 100) : 0

  const vote = async (type: 'like' | 'dislike') => {
    if (!isAuthed) {
      router.push('/login')
      return
    }
    if (pending) return
    setPending(true)

    // ── 楽観的更新 ──
    const prev = { likes, dislikes, myVote }
    if (myVote === type) {
      // 取り消し
      type === 'like' ? setLikes((n) => n - 1) : setDislikes((n) => n - 1)
      setMyVote(null)
    } else {
      if (myVote === 'like') setLikes((n) => n - 1)
      if (myVote === 'dislike') setDislikes((n) => n - 1)
      type === 'like' ? setLikes((n) => n + 1) : setDislikes((n) => n + 1)
      setMyVote(type)
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      if (prev.myVote === type) {
        // 同じボタン → 取り消し（delete）
        await supabase
          .from('votes')
          .delete()
          .eq('user_id', user.id)
          .eq('target_id', professorId)
          .eq('target_type', 'professor')
      } else {
        // upsert（user_id,target_id,target_type で一意）
        await supabase.from('votes').upsert(
          {
            user_id: user.id,
            target_id: professorId,
            target_type: 'professor',
            vote_type: type,
          },
          { onConflict: 'user_id,target_id,target_type' },
        )
      }
      // TODO: professor_rankings がリアルタイム集計でない場合は router.refresh() で再取得
    } catch (e) {
      // 失敗時はロールバック
      setLikes(prev.likes)
      setDislikes(prev.dislikes)
      setMyVote(prev.myVote)
      console.error(e)
    } finally {
      setPending(false)
    }
  }

  const likeOn = myVote === 'like'
  const disOn = myVote === 'dislike'

  return (
    <section className="rounded-card bg-white p-[22px] shadow-card">
      <h2 className="mb-4 font-heading text-base font-bold text-ink">この先生どう？</h2>

      {/* 割合バー */}
      <div className="mb-2 flex justify-between text-[13px] font-bold">
        <span className="text-[#E8623F]">好き {pct}%</span>
        <span className="text-[#7A86A0]">嫌い {100 - pct}%</span>
      </div>
      <div className="flex h-3.5 overflow-hidden rounded-full bg-dislike-soft">
        <div
          className="h-full bg-[linear-gradient(90deg,#FF8A6B,#FF7050)] transition-[width] duration-500 ease-[cubic-bezier(.4,0,.2,1)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-right text-[11px] text-[#B0AEC0]">計 {total} 票</p>

      {/* ボタン（大きめタップ領域） */}
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => vote('like')}
          disabled={pending}
          aria-pressed={likeOn}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-btn py-[15px] font-heading text-base font-bold transition-all duration-150 active:scale-95 ${
            likeOn
              ? 'bg-[linear-gradient(135deg,#FF8A6B,#FF6A48)] text-white shadow-[0_8px_20px_rgba(255,90,60,0.32)]'
              : 'bg-like-soft text-[#E8623F]'
          }`}
        >
          <span className="text-[19px]">♥</span> 好き
        </button>
        <button
          type="button"
          onClick={() => vote('dislike')}
          disabled={pending}
          aria-pressed={disOn}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-btn py-[15px] font-heading text-base font-bold transition-all duration-150 active:scale-95 ${
            disOn
              ? 'bg-[#7A86A0] text-white shadow-[0_8px_20px_rgba(110,125,160,0.28)]'
              : 'bg-dislike-soft text-[#6B7794]'
          }`}
        >
          <span className="text-[18px]">↓</span> 嫌い
        </button>
      </div>

      {!isAuthed && (
        <p className="mt-3 text-center text-[11px] text-muted">
          投票するには{' '}
          <a href="/login" className="text-brand underline">
            ログイン
          </a>{' '}
          が必要です
        </p>
      )}
    </section>
  )
}
