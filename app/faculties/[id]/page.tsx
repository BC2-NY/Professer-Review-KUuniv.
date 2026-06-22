import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SearchBar from '../../SearchBar'

export default async function FacultyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string; sort?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const q = (sp.q ?? '').trim()
  const sort = sp.sort ?? 'kana'
  const supabase = await createClient()

  const { data: faculty } = await supabase.from('faculties').select('*').eq('id', id).single()
  if (!faculty) notFound()

  let { data: profsData } = await supabase
    .from('professor_rankings')
    .select('*')
    .eq('faculty_id', id)
  let profs = profsData ?? []

  if (q) {
    const lower = q.toLowerCase()
    const { data: lec } = await supabase
      .from('lectures')
      .select('professor_id')
      .ilike('name', `%${q}%`)
    const lecIds = new Set((lec ?? []).map((l) => l.professor_id))
    profs = profs.filter(
      (p) =>
        (p.name ?? '').toLowerCase().includes(lower) ||
        (p.name_kana ?? '').toLowerCase().includes(lower) ||
        lecIds.has(p.id)
    )
  }

  profs = [...profs].sort((a, b) => {
    if (sort === 'like') return (b.likes - a.likes) || (a.name_kana ?? '').localeCompare(b.name_kana ?? '', 'ja')
    if (sort === 'dislike') return (b.dislikes - a.dislikes) || (a.name_kana ?? '').localeCompare(b.name_kana ?? '', 'ja')
    return (a.name_kana ?? '').localeCompare(b.name_kana ?? '', 'ja')
  })

  const qs = (s: string) => {
    const p = new URLSearchParams()
    if (s !== 'kana') p.set('sort', s)
    if (q) p.set('q', q)
    const str = p.toString()
    return str ? `?${str}` : ''
  }

  const sortBtn = (key: string, label: string) => (
    <Link
      href={`/faculties/${id}${qs(key)}`}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        sort === key
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
          ← トップへ戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{faculty.name}</h1>
        {faculty.department && <p className="text-gray-500 mb-6">{faculty.department}</p>}

        <SearchBar
          basePath={`/faculties/${id}`}
          placeholder="教授名・講義名で検索（例: 言語学）"
          defaultValue={q}
        />

        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-gray-500 mr-1">並び替え:</span>
          {sortBtn('kana', 'あいうえお順')}
          {sortBtn('like', '好き順')}
          {sortBtn('dislike', '嫌い順')}
        </div>

        {q && (
          <p className="text-sm text-gray-500 mb-4">「{q}」の検索結果: {profs.length} 件</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profs.map((prof) => (
            <Link
              key={prof.id}
              href={`/professors/${prof.id}`}
              className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow border border-gray-100 flex items-center gap-4"
            >
              {prof.photo_url ? (
                <img src={prof.photo_url} alt={prof.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-2xl flex-shrink-0">👤</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">{prof.name}</p>
                <p className="text-sm text-gray-400 truncate">{prof.name_kana}</p>
                {prof.research_field && (
                  <p className="text-xs text-blue-500 mt-1 truncate">{prof.research_field}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0 text-xs text-gray-500">
                <p className="text-green-600 font-bold">👍{prof.likes}</p>
                <p className="text-red-400 font-bold">👎{prof.dislikes}</p>
              </div>
            </Link>
          ))}

          {profs.length === 0 && (
            <p className="text-gray-400 col-span-2 py-8 text-center">
              {q ? `「${q}」に一致する教授は見つかりませんでした。` : 'この学部には教授データがまだありません。'}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
