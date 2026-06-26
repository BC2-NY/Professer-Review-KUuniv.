'use client'
// app/faculties/[id]/FacultyProfessorList.tsx — Client Component
import { useMemo, useState } from 'react'
import Link from 'next/link'

type Sort = 'kana' | 'like' | 'dislike'

export interface Prof {
  id: string
  name: string
  kana: string
  field: string // 表示用：先頭の研究分野1つ
  likes: number
  dislikes: number
  pct: number // like_percent
  searchText: string // 検索用：名前+かな+全分野+講義名（小文字）
}

interface Props {
  facultyName: string
  professors: Prof[]
}

export default function FacultyProfessorList({ facultyName, professors }: Props) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('kana')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? professors.filter((p) => p.searchText.includes(q))
      : professors
    return [...filtered].sort((a, b) => {
      if (sort === 'like') return b.likes - a.likes || a.kana.localeCompare(b.kana, 'ja')
      if (sort === 'dislike')
        return b.dislikes - a.dislikes || a.kana.localeCompare(b.kana, 'ja')
      return a.kana.localeCompare(b.kana, 'ja')
    })
  }, [professors, query, sort])

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-2 text-[12.5px] font-bold whitespace-nowrap transition-all active:scale-95 ${
      active
        ? 'bg-[linear-gradient(135deg,#8B6BFF,#7B61FF)] text-white shadow-[0_4px_12px_rgba(123,97,255,0.28)]'
        : 'bg-white text-[#7C7992] shadow-[0_1px_4px_rgba(80,60,160,0.06)]'
    }`

  return (
    <main className="min-h-screen bg-page font-sans">
      <div className="mx-auto w-full max-w-[480px] px-5 pb-12 lg:max-w-[760px]">
        {/* sticky header（戻る・学部名・検索・ソート） */}
        <div className="sticky top-0 z-10 -mx-5 bg-[linear-gradient(var(--color-page)_78%,transparent)] px-5 pb-3 pt-4">
          <Link
            href="/"
            className="-ml-1 mb-1.5 inline-flex items-center gap-2 px-1 py-2 font-heading text-sm font-bold text-brand transition-opacity hover:opacity-70"
          >
            <span className="text-[17px] leading-none">←</span> トップへ戻る
          </Link>

          <h1 className="font-heading text-2xl font-bold text-ink">{facultyName}</h1>
          <p className="mt-0.5 text-[12.5px] text-muted">教授 {professors.length}名</p>

          {/* 検索 */}
          <div className="mt-3.5 flex items-center gap-2.5 rounded-input border-2 border-[#ECEAF3] bg-white px-3.5 py-2.5 shadow-[0_2px_10px_rgba(80,60,160,0.05)]">
            <span className="text-[15px] leading-none text-[#C2BFD4]">⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="教授名・講義名で検索"
              className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-[#B6B3C6]"
            />
          </div>

          {/* ソート */}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setSort('kana')} className={chip(sort === 'kana')}>
              あいうえお順
            </button>
            <button type="button" onClick={() => setSort('like')} className={chip(sort === 'like')}>
              好き順
            </button>
            <button type="button" onClick={() => setSort('dislike')} className={chip(sort === 'dislike')}>
              嫌い順
            </button>
          </div>
        </div>

        {/* 一覧（lgで2カラム） */}
        <div className="grid grid-cols-1 gap-3 pb-10 pt-1 lg:grid-cols-2">
          {list.map((p) => (
            <Link
              key={p.id}
              href={`/professors/${p.id}`}
              className="flex items-center gap-3.5 rounded-card bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(80,60,160,0.12)] active:scale-[0.99]"
            >
              {/* アバター（頭文字） */}
              <span className="flex h-[54px] w-[54px] flex-none items-center justify-center rounded-full bg-[linear-gradient(150deg,#EFEBFF,#E5DEFF)] font-heading text-xl font-bold text-[#9B85FF]">
                {p.name?.[0] ?? '？'}
              </span>

              {/* 情報 */}
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate font-heading text-[15.5px] font-bold text-ink">
                  {p.name}
                </span>
                {p.kana && (
                  <span className="truncate text-[11.5px] tracking-[0.05em] text-[#A8A6BA]">
                    {p.kana}
                  </span>
                )}
                {p.field && (
                  <span className="mt-0.5 inline-flex self-start rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-bold text-[#6A4DE0]">
                    {p.field}
                  </span>
                )}
              </span>

              {/* 好き割合ミニ */}
              <span className="flex w-[62px] flex-none flex-col items-end gap-1.5">
                <span className="font-heading text-[17px] font-bold leading-none text-[#E8623F]">
                  {p.pct}
                  <span className="text-[11px]">%</span>
                </span>
                <span className="flex h-[7px] w-full overflow-hidden rounded-full bg-dislike-soft">
                  <span
                    className="h-full bg-[linear-gradient(90deg,#FF8A6B,#FF7050)]"
                    style={{ width: `${p.pct}%` }}
                  />
                </span>
                <span className="text-[10px] text-[#B0AEC0]">{p.likes + p.dislikes}票</span>
              </span>
            </Link>
          ))}

          {/* 空状態 */}
          {list.length === 0 && (
            <div className="col-span-full px-5 py-12 text-center text-[13.5px] text-[#A8A6BA]">
              <div className="mb-2.5 text-[34px]">🔍</div>
              「{query}」に一致する教授は見つかりませんでした。
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
