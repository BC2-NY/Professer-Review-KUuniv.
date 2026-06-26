'use client'
// app/SearchBar.tsx — Client Component（高さ統一・検索ボタン付き・共通利用可）
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  basePath?: string // 遷移先（デフォルト /search）
  defaultValue?: string
  placeholder?: string
}

export default function SearchBar({
  basePath = '/search',
  defaultValue = '',
  placeholder = '教授名・フリガナで検索（例: ヤマダ）',
}: Props) {
  const router = useRouter()
  const [q, setQ] = useState(defaultValue)

  const search = () => {
    const keyword = q.trim()
    router.push(keyword ? `${basePath}?q=${encodeURIComponent(keyword)}` : basePath)
  }

  return (
    <div className="flex items-center gap-2">
      {/* 入力（高さ44px固定） */}
      <div className="flex h-11 flex-1 items-center gap-2.5 rounded-[14px] border-2 border-transparent bg-[#F4F3FA] px-3.5 transition-colors focus-within:border-[#C9BCFF] focus-within:bg-white">
        <span className="text-[15px] leading-none text-[#B6B3C6]">⌕</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') search()
          }}
          placeholder={placeholder}
          aria-label="検索"
          className="h-full min-w-0 flex-1 border-none bg-transparent text-sm text-ink outline-none placeholder:text-[#B6B3C6]"
        />
      </div>

      {/* 検索ボタン（同じ高さ44px） */}
      <button
        type="button"
        onClick={search}
        className="h-11 flex-none rounded-[14px] bg-[linear-gradient(135deg,#8B6BFF,#7B61FF)] px-5 font-heading text-sm font-bold text-white shadow-[0_4px_12px_rgba(123,97,255,0.28)] transition-opacity hover:opacity-90"
      >
        検索
      </button>
    </div>
  )
}