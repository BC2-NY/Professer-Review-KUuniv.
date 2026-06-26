// app/page.tsx — Server Component（トップページ web版 / レスポンシブ）
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import SearchBar from './SearchBar'
import LogoutButton from './LogoutButton'

// 学部アイコンの色（並び順 index で自動割当）
const PALETTE: [string, string][] = [
  ['#EFEBFF', '#6A4DE0'], ['#FFEDE6', '#E8623F'], ['#E6F4EC', '#2E9E6B'],
  ['#E7F0FF', '#3E6FD9'], ['#FBEAF5', '#C2569E'], ['#FFF4E0', '#D9911F'],
  ['#E8F6F7', '#2C9AA6'], ['#EEEAFB', '#7B61FF'],
]

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'たった今'
  if (m < 60) return `${m}分前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}時間前`
  return `${Math.floor(h / 24)}日前`
}

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── 並列取得 ──
  const [
    { data: faculties },
    { count: profCount },
    { count: reviewCount },
    { data: recentComments },
  ] = await Promise.all([
    supabase.from('faculties').select('*').order('name'),
    supabase.from('professors').select('*', { count: 'exact', head: true }),
    supabase.from('comments').select('*', { count: 'exact', head: true }),
    // 最近のコメント（教授名は別取得：comments→professors はFKが無く埋め込み不可）
    supabase
      .from('comments')
      .select('id, body, created_at, target_id')
      .eq('target_type', 'professor')
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  // ── アクティビティの教授名を target_id から解決 ──
  const profIds = [...new Set((recentComments ?? []).map((c) => c.target_id as string))]
  const { data: profRows } = profIds.length
    ? await supabase.from('professors').select('id, name').in('id', profIds)
    : { data: [] as { id: string; name: string }[] }
  const nameById = new Map((profRows ?? []).map((p) => [p.id as string, p.name as string]))

  const facultyList = faculties ?? []

  const stats = [
    { value: (profCount ?? 0).toLocaleString(), label: '掲載教授' },
    { value: (reviewCount ?? 0).toLocaleString(), label: '投稿レビュー' },
    { value: facultyList.length.toLocaleString(), label: '学部' },
  ]

  const activity = (recentComments ?? []).map((c) => {
    const profId = c.target_id as string
    const profName = nameById.get(profId) ?? '教授'
    return {
      id: c.id as string,
      profId,
      profName,
      initial: profName[0] ?? '？',
      text: `「${c.body}」`,
      time: timeAgo(c.created_at as string),
    }
  })

  return (
    <div className="min-h-screen bg-page font-sans">
      {/* ===== NAV ===== */}
      <header className="sticky top-0 z-20 border-b border-[#ECEAF3] bg-white/85 backdrop-blur-md">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          {/* 1段目：ロゴ ＋ (PC:検索) ＋ ナビ */}
          <div className="flex items-center gap-3 py-3">
            <Link href="/" className="flex flex-none items-center gap-2.5 no-underline">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#8B6BFF,#6A4DE0)] font-heading text-lg font-black text-white">
                関
              </span>
              <span className="hidden whitespace-nowrap font-heading text-base font-bold text-ink sm:inline">
                関大 教授レビュー
              </span>
            </Link>

            {/* PC のみ検索 */}
            <div className="hidden flex-[1_1_260px] sm:block">
              <SearchBar />
            </div>

            <nav className="ml-auto flex flex-none items-center gap-2">
              {/* ランキングは PC のみ */}
              <Link
                href="/ranking"
                className="hidden h-11 items-center gap-1.5 whitespace-nowrap rounded-xl bg-like-soft px-4 font-heading text-[13.5px] font-bold text-[#E8623F] no-underline transition-colors hover:bg-[#FFE0D4] sm:inline-flex"
              >
                <span className="text-[15px]">🏆</span> ランキング
              </Link>
              {user ? (
                <LogoutButton />
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center whitespace-nowrap rounded-xl bg-[linear-gradient(135deg,#8B6BFF,#7B61FF)] px-[17px] font-heading text-[13.5px] font-bold text-white no-underline shadow-[0_4px_12px_rgba(123,97,255,0.28)] transition-opacity hover:opacity-90"
                >
                  ログイン
                </Link>
              )}
            </nav>
          </div>

          {/* 2段目：スマホのみ検索ボックス */}
          <div className="pb-3 sm:hidden">
            <SearchBar />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-6">
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#7E64FF_0%,#6A4DE0_100%)] px-5 py-8 shadow-[0_18px_44px_rgba(106,77,224,0.30)] sm:rounded-[32px] sm:px-10 sm:py-12">
          <div className="absolute -right-10 -top-16 h-60 w-60 rounded-full bg-white/[0.08]" />
          <div className="absolute -bottom-24 right-32 h-44 w-44 rounded-full bg-white/[0.06]" />
          <div className="relative max-w-[560px]">
            <span className="inline-block rounded-full bg-white/[0.16] px-3 py-1 text-[11px] font-bold tracking-wide text-white sm:px-3.5 sm:py-1.5 sm:text-xs">
              関西大学の学生だけの口コミ
            </span>
            <h1 className="mb-2 mt-3 font-heading text-[26px] font-bold leading-[1.35] text-white sm:mb-2.5 sm:mt-[18px] sm:text-[38px]">
              学部を選んで、
              <br />
              教授を見つけよう。
            </h1>
            <p className="mb-5 text-[13.5px] leading-[1.7] text-white/[0.82] sm:mb-[26px] sm:text-[15px]">
              在学生のリアルな声で、履修登録の参考に。好き・嫌いの割合と講義の感想がひと目で分かります。
            </p>
            <div className="flex flex-wrap gap-5 sm:gap-7">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <span className="font-heading text-[22px] font-black leading-none text-white sm:text-[30px]">
                    {s.value}
                  </span>
                  <span className="text-[11.5px] text-white/75 sm:text-[12.5px]">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== ランキングバナー（スマホ：全幅 / PC：非表示） ===== */}
        <Link
          href="/ranking"
          className="mt-4 flex items-center justify-between rounded-2xl bg-[linear-gradient(135deg,#FFF0E8,#FFE4D2)] px-5 py-4 no-underline shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:hidden"
        >
          <span className="flex items-center gap-2.5">
            <span className="text-[22px] leading-none">🏆</span>
            <span className="flex flex-col gap-0.5">
              <span className="font-heading text-[14px] font-bold text-[#C0501A]">教授ランキング</span>
              <span className="text-[11.5px] text-[#B07050]">人気・不評の教授をチェック</span>
            </span>
          </span>
          <span className="font-heading text-[13px] font-bold text-[#E8623F]">見る →</span>
        </Link>

        {/* ===== BODY ===== */}
        <div className="mt-6 flex flex-wrap items-start gap-6">
          {/* 学部一覧 */}
          <section className="min-w-[300px] flex-[3_1_520px]">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-heading text-[22px] font-bold text-ink">学部一覧</h2>
              <span className="text-[13px] text-muted">{facultyList.length} 学部</span>
            </div>

            {/* auto-fill グリッド：列数が幅で自動変化 */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
              {facultyList.map((f, i) => {
                const [bg, fg] = PALETTE[i % PALETTE.length]
                return (
                  <Link
                    key={f.id}
                    href={`/faculties/${f.id}`}
                    className="flex flex-col gap-2.5 rounded-card bg-white p-5 no-underline shadow-card transition-all hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(80,60,160,0.14)]"
                  >
                    <span
                      className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] font-heading text-[19px] font-bold"
                      style={{ background: bg, color: fg }}
                    >
                      {f.name?.[0] ?? '学'}
                    </span>
                    <span className="font-heading text-base font-bold leading-[1.35] text-ink">
                      {f.name}
                    </span>
                    {f.department && (
                      <span className="text-xs leading-[1.5] text-muted">{f.department}</span>
                    )}
                    <span className="mt-0.5 font-sans text-[11.5px] font-bold text-[#9B85FF]">
                      詳しく見る ›
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>

          {/* サイドバー（狭い幅では下に折返し） */}
          <aside className="flex min-w-[260px] flex-[1_1_280px] flex-col gap-4">
            <div className="rounded-card bg-white p-[22px] shadow-card">
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-like" />
                <h2 className="font-heading text-base font-bold text-ink">最近のアクティビティ</h2>
              </div>
              <div className="flex flex-col">
                {activity.map((a) => (
                  <Link
                    key={a.id}
                    href={a.profId ? `/professors/${a.profId}#comment-${a.id}` : '#'}
                    className="flex gap-3 border-t border-[#F2F0F8] py-3.5 no-underline transition-opacity hover:opacity-75 first:border-t-0"
                  >
                    <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-[linear-gradient(150deg,#EFEBFF,#E5DEFF)] font-heading text-sm font-bold text-[#9B85FF]">
                      {a.initial}
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="line-clamp-2 text-[13px] leading-[1.55] text-[#3A3852]">
                        {a.text}
                      </span>
                      <span className="text-[11px] text-[#B0AEC0]">
                        {a.profName} ・ {a.time}
                      </span>
                    </span>
                  </Link>
                ))}
                {activity.length === 0 && (
                  <p className="py-4 text-center text-[13px] text-muted">
                    まだアクティビティがありません。
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-card bg-[linear-gradient(135deg,#FFF4E0,#FFEAD2)] px-[22px] py-5">
              <div className="mb-1.5 font-heading text-sm font-bold text-[#9A6B12]">
                📣 みんなで気持ちよく
              </div>
              <p className="text-[12.5px] leading-[1.7] text-[#A57A2A]">
                投稿は匿名ですが、個人攻撃や誹謗中傷はNG。講義や指導の感想を建設的に共有しましょう。
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="mt-6 border-t border-[#ECEAF3]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-7">
          <span className="text-xs text-muted">
            関西大学の在学生限定 ・ 学内メール認証が必要です
          </span>
          <div className="flex gap-[18px]">
            <Link href="/terms" className="text-xs text-[#7C7992] no-underline hover:text-brand">
              利用規約
            </Link>
            <Link href="/privacy" className="text-xs text-[#7C7992] no-underline hover:text-brand">
              プライバシー
            </Link>
            <Link href="/contact" className="text-xs text-[#7C7992] no-underline hover:text-brand">
              お問い合わせ
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}