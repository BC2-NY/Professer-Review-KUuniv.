// app/professors/[id]/page.tsx — Server Component
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import VoteSection from './VoteSection'
import CommentSection from './CommentSection'

type VoteType = 'like' | 'dislike' | null

export default async function ProfessorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // ── 認証中ユーザー（myVote / コメントの mine 判定に使用） ──
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── 並列取得 ──
  const [
    { data: professor },
    { data: ranking },
    { data: lectures },
    { data: voteRow },
    { data: commentRows },
  ] = await Promise.all([
    // professor + 学部名（faculties をジョイン）
    supabase
      .from('professors')
      .select('id, name, name_kana, research_field, photo_url, faculty_id, faculties(name)')
      .eq('id', id)
      .single(),
    // ranking: professor_rankings ビュー。主キー列は professor_id ではなく id。
    // likes / dislikes も直接持っているので取得して件数の逆算をなくす。
    supabase
      .from('professor_rankings')
      .select('like_percent, total_votes, likes, dislikes')
      .eq('id', id)
      .maybeSingle(),
    // 担当講義
    supabase
      .from('lectures')
      .select('id, name, semester, day_period, credits')
      .eq('professor_id', id)
      .order('semester'),
    // 自分の投票
    user
      ? supabase
          .from('votes')
          .select('vote_type')
          .eq('user_id', user.id)
          .eq('target_id', id)
          .eq('target_type', 'professor')
          .maybeSingle()
      : Promise.resolve({ data: null }),
    // コメント（mine 判定のため user_id も取得）
    supabase
      .from('comments')
      .select('id, body, created_at, user_id')
      .eq('target_id', id)
      .eq('target_type', 'professor')
      .order('created_at', { ascending: false }),
  ])

  if (!professor) notFound()

  // faculties は単一リレーション想定だが型上は配列になり得るため吸収
  const facultyName =
    (Array.isArray((professor as any).faculties)
      ? (professor as any).faculties[0]?.name
      : (professor as any).faculties?.name) ?? undefined

  // ビューの実値をそのまま使う（逆算による丸め誤差をなくす）
  const likes = ranking?.likes ?? 0
  const dislikes = ranking?.dislikes ?? 0
  const myVote = (voteRow?.vote_type ?? null) as VoteType

  const comments =
    commentRows?.map((c) => ({
      id: c.id as string,
      body: c.body as string,
      created_at: c.created_at as string,
      mine: !!user && c.user_id === user.id,
    })) ?? []

  // research_field をチップ化。
  // 研究者DB由来は「大区分 / 中区分、大区分 / 中区分…」の形なので、
  //   ・「、」で項目分割
  //   ・「/」があれば末尾（中区分）だけ採用 → "情報通信 /" の重複を防ぐ
  //   ・Set で重複除去
  // 「行政学」のような単独表記はそのまま1チップになる。
  const fields = [
    ...new Set(
      (professor.research_field ?? '')
        .split('、')
        .map((s: string) => s.split('/').pop()!.trim())
        .filter(Boolean),
    ),
  ]

  return (
    <main className="min-h-screen bg-page font-sans">
      {/* モバイル=中央1カラム(480px) / lg以上=2カラム(920px) */}
      <div className="mx-auto w-full max-w-[480px] px-5 pb-12 pt-4 lg:max-w-[920px]">
        {/* 戻る（全幅・上部） */}
        <Link
          href={`/faculties/${professor.faculty_id}`}
          className="-ml-1 mb-2 inline-flex items-center gap-2 px-1 py-2 font-heading text-sm font-bold text-brand transition-opacity hover:opacity-70"
        >
          <span className="text-[17px] leading-none">←</span> 学部へ戻る
        </Link>

        {/* lg: 左=プロフィール+評価 / 右=講義+コメント。モバイルは縦積み */}
        <div className="lg:grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start lg:gap-6">
          {/* 左カラム（lgで追従） */}
          <div className="space-y-4 lg:sticky lg:top-6">
            {/* プロフィール */}
            <section className="flex flex-col items-center rounded-card bg-white p-6 text-center shadow-card">
              {professor.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={professor.photo_url}
                  alt={professor.name}
                  className="h-24 w-24 rounded-full border-[3px] border-white object-cover shadow-[0_4px_14px_rgba(123,97,255,0.18)]"
                />
              ) : (
                // 写真が無い場合のプレースホルダー（氏名頭文字）
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-white bg-[linear-gradient(150deg,#EFEBFF,#E5DEFF)] shadow-[0_4px_14px_rgba(123,97,255,0.18)]">
                  <span className="font-heading text-4xl font-bold text-[#9B85FF]">
                    {professor.name?.[0] ?? '？'}
                  </span>
                </div>
              )}

              {facultyName && (
                <p className="mt-3.5 text-[11px] font-bold tracking-wider text-muted">
                  {facultyName}
                </p>
              )}
              <h1 className="mb-0.5 mt-1 font-heading text-[25px] font-bold text-ink">
                {professor.name}
              </h1>
              {professor.name_kana && (
                <p className="text-[13px] tracking-[0.08em] text-muted">
                  {professor.name_kana}
                </p>
              )}

              {fields.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {fields.map((f: string) => (
                    <span
                      key={f}
                      className="rounded-full bg-brand-soft px-3.5 py-1.5 text-[12.5px] font-bold text-[#6A4DE0]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* 評価（クライアント） */}
            <VoteSection
              professorId={id}
              initialLikes={likes}
              initialDislikes={dislikes}
              initialMyVote={myVote}
              isAuthed={!!user}
            />
          </div>

          {/* 右カラム */}
          <div className="mt-4 space-y-4 lg:mt-0">
            {/* 担当講義 */}
            {lectures && lectures.length > 0 && (
              <section className="rounded-card bg-white p-[22px] shadow-card">
                <h2 className="mb-3.5 font-heading text-base font-bold text-ink">担当講義</h2>
                <div className="flex flex-col gap-3">
                  {lectures.map((lec) => (
                    <div key={lec.id} className="rounded-[18px] bg-[#F8F7FC] px-4 py-3.5">
                      <p className="mb-2 font-heading text-[14.5px] font-bold text-ink">
                        {lec.name}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {[lec.semester, lec.day_period, lec.credits && `${lec.credits}単位`]
                          .filter(Boolean)
                          .map((t, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-medium text-[#6B6880] shadow-[0_1px_3px_rgba(60,40,120,0.06)]"
                            >
                              {t}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* コメント（クライアント） */}
            <CommentSection
              professorId={id}
              initialComments={comments}
              isAuthed={!!user}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
