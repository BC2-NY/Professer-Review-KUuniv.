'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  basePath?: string
  placeholder?: string
  defaultValue?: string
}

export default function SearchBar({
  basePath = '/search',
  placeholder = '教授名・ふりがなで検索（例: やまだ）',
  defaultValue = '',
}: Props) {
  const router = useRouter()
  const [q, setQ] = useState(defaultValue)

  const search = () => {
    const keyword = q.trim()
    router.push(keyword ? `${basePath}?q=${encodeURIComponent(keyword)}` : basePath)
  }

  return (
    <div className="flex gap-2 mb-8">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') search() }}
        placeholder={placeholder}
        className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
      <button
        onClick={search}
        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        検索
      </button>
    </div>
  )
}
