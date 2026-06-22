import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

const medals = ['🥇', '🥈', '🥉']
const likeColors = ['bg-pink-500 text-white', 'bg-pink-300 text-pink-900', 'bg-pink-100 text-pink-900']
const dislikeColors = ['bg-blue-600 text-white', 'bg-blue-400 text-white', 'bg-sky-300 text-sky-900']

type Prof = {
  id: string
  name: string
  faculty_name: string | null
  photo_url: string | null
  likes: number
  dislikes: number
  like_percent: number
}

function RankList({ title, items, palette, kind }: {
  title: string
  items: Prof[]
  palette: string[]
  kind: 'like' | 'dislike'
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-gray-800 mb-3">{title}</h2>
      <div className="space-y-3">
        {items.map((prof, i) => {
          const colorClass = palette[i] ?? 'bg-white text-gray-800 border border-gray-100'
          const count = kind === 'like' ? prof.likes : prof.dislikes
          const percent = kind === 'like' ? prof.like_percent : 100 - prof.like_percent
          const emoji = kind === 'like' ? '👍' : '👎'
          return (
            <Link
              key={prof.id}
              href={`/professors/${prof.id}`}
              className={`rounded-lg shadow-sm p-3 flex items-center gap-3 transition-shadow hover:shadow-md ${colorClass}`}
            >
              <div className="w-7 text-center font-bold flex-shrink-0">{medals[i] ?? i + 1}</div>
              {prof.photo_url ? (
                <img src={prof.photo_url} alt={prof.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl flex-shrink-0">👤</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{prof.name}</p>
                {prof.faculty_name && <p className="text-xs opacity-70 truncate">{prof.faculty_name}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold">{emoji}{count}</p>
                <p className="text-xs opacity-70">{percent}%</p>
              </div>
            </Link>
          )
        })}
        {items.length === 0 && (
          <p className="text-gray-400 py-8 text-center text-sm">まだ投票がありません。</p>
        )}
      </div>
    </section>
  )
}

export default async function RankingPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('professor_rankings')
    .select('*')
    .gt('total_votes', 0)

  const all = (data ?? []) as Prof[]

  const liked = [...all].sort(
    (a, b) => (b.likes - a.likes) || (b.like_percent - a.like_percent)
  )
  const disliked = [...all].sort(
    (a, b) => (b.dislikes - a.dislikes) || ((100 - b.like_percent) - (100 - a.like_percent))
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
          ← トップへ戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">教授ランキング</h1>
        <p className="text-sm text-gray-500 mb-6">1票以上が対象</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RankList title="💗 好きランキング" items={liked} palette={likeColors} kind="like" />
          <RankList title="💙 嫌いランキング" items={disliked} palette={dislikeColors} kind="dislike" />
        </div>
      </div>
    </main>
  )
}
