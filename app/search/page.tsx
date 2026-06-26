// app/search/page.tsx — Server Component（検索結果 / 新デザイン）
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import SearchBar from '../SearchBar'

type Row = {
  id: string
  name: string
  name_kana: string | null
  research_field: string | null
  photo_url: string | null
  like_percent: number | null
  likes: number | null
  dislikes: number | null
  faculty_name: string | null
}

// research_field の先頭の中区分1つ（カード表示用）
function firstField(research_field: string | null) {
  const fields = [
    ...new Set(
      (research_field ?? '')
        .split('、')
        .map((s) => s.split('/').pop()!.trim())
        .filter(Boolean),
    ),
  ]
  return fields[0] ?? ''
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const keyword = (q ?? '').trim()
  const supabase = await createClient()

  const cols =
    'id, name, name_kana, research_field, photo_url, like_percent, likes, dislikes, faculty_name'
  let results: Row[] = []

  if (keyword) {
    // PostgREST の or 構文・ワイルドカードを壊す文字を除去
    const safe = keyword.replace(/[,()%*]/g, ' ').trim()
    if (safe) {
      const like = `%${safe}%`

      // 1) 教授名・ふりがな・研究分野
      const { data: byProf } = await supabase
        .from('professor_rankings')
        .select(cols)
        .or(`name.ilike.${like},name_kana.ilike.${like},research_field.ilike.${like}`)

      // 2) 講義名でヒットした教授ID
      const { data: lecHits } = await supabase
        .from('lectures')
        .select('professor_id')
        .ilike('name', like)

      const have = new Set((byProf ?? []).map((p) => p.id as string))
      const missing = [
        ...new Set((lecHits ?? []).map((l) => l.professor_id as string)),
      ].filter((id) => !have.has(id))

      let byLecture: Row[] = []
      if (missing.length) {
        const { data } = await supabase
          .from('professor_rankings')
          .select(cols)
          .in('id', missing)
        byLecture = (data ?? []) as Row[]
      }

      results = [...((byProf ?? []) as Row[]), ...byLecture].sort((a, b) =>
        (a.name_kana ?? '').localeCompare(b.name_kana ?? '', 'ja'),
      )
    }
  }

  return (
    <main className="min-h-screen bg-page font-sans">
      <div className="mx-auto w-full max-w-[760px] px-5 pb-12 pt-5">
        <Link
          href="/"
          className="-ml-1 mb-3 inline-flex items-center gap-2 px-1 py-2 font-heading text-sm font-bold text-brand transition-opacity hover:opacity-70"
        >
          <span className="text-[17px] leading-none">←</span> トップへ戻る
        </Link>

        <SearchBar defaultValue={keyword} />

        <h1 className="mb-1 mt-6 font-heading text-xl font-bold text-ink">検索結果</h1>
        {keyword && (
          <p className="mb-5 text-[13px] text-muted">
            「{keyword}」の検索結果：{results.length} 件
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {results.map((p) => {
            const field = firstField(p.research_field)
            const pct = p.like_percent ?? 0
            const votes = (p.likes ?? 0) + (p.dislikes ?? 0)
            return (
              <Link
                key={p.id}
                href={`/professors/${p.id}`}
                className="flex items-center gap-3.5 rounded-card bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(80,60,160,0.12)] active:scale-[0.99]"
              >
                {p.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.photo_url}
                    alt={p.name}
                    className="h-[54px] w-[54px] flex-none rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-[54px] w-[54px] flex-none items-center justify-center rounded-full bg-[linear-gradient(150deg,#EFEBFF,#E5DEFF)] font-heading text-xl font-bold text-[#9B85FF]">
                    {p.name?.[0] ?? '？'}
                  </span>
                )}

                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate font-heading text-[15.5px] font-bold text-ink">
                    {p.name}
                  </span>
                  {p.name_kana && (
                    <span className="truncate text-[11.5px] tracking-[0.05em] text-[#A8A6BA]">
                      {p.name_kana}
                    </span>
                  )}
                  <span className="flex flex-wrap items-center gap-1.5">
                    {p.faculty_name && (
                      <span className="text-[11px] text-muted">{p.faculty_name}</span>
                    )}
                    {field && (
                      <span className="inline-flex rounded-full bg-brand-soft px-2 py-0.5 text-[10.5px] font-bold text-[#6A4DE0]">
                        {field}
                      </span>
                    )}
                  </span>
                </span>

                <span className="flex w-[58px] flex-none flex-col items-end gap-1.5">
                  <span className="font-heading text-[16px] font-bold leading-none text-[#E8623F]">
                    {pct}
                    <span className="text-[10px]">%</span>
                  </span>
                  <span className="flex h-[6px] w-full overflow-hidden rounded-full bg-dislike-soft">
                    <span
                      className="h-full bg-[linear-gradient(90deg,#FF8A6B,#FF7050)]"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="text-[10px] text-[#B0AEC0]">{votes}票</span>
                </span>
              </Link>
            )
          })}
        </div>

        {keyword && results.length === 0 && (
          <div className="px-5 py-12 text-center text-[13.5px] text-[#A8A6BA]">
            <div className="mb-2.5 text-[34px]">🔍</div>
            「{keyword}」に一致する教授は見つかりませんでした。
          </div>
        )}
        {!keyword && (
          <div className="px-5 py-12 text-center text-[13.5px] text-[#A8A6BA]">
            <div className="mb-2.5 text-[34px]">⌕</div>
            上の検索ボックスにキーワードを入力してください（教授名・ふりがな・研究分野・講義名）。
          </div>
        )}
      </div>
    </main>
  )
}
