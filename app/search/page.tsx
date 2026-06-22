import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import SearchBar from '../SearchBar'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const keyword = (q ?? '').trim()
  const supabase = await createClient()

  let professors: any[] = []
  if (keyword) {
    const { data } = await supabase
      .from('professors')
      .select('*, faculties(name)')
      .or(`name.ilike.%${keyword}%,name_kana.ilike.%${keyword}%`)
      .order('name_kana')
    professors = data ?? []
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
          ← トップへ戻る
        </Link>

        <SearchBar />

        <h1 className="text-xl font-semibold text-gray-700 mb-1">検索結果</h1>
        {keyword && (
          <p className="text-sm text-gray-400 mb-6">
            「{keyword}」の検索結果: {professors.length} 件
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {professors.map((prof) => (
            <Link
              key={prof.id}
              href={`/professors/${prof.id}`}
              className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow border border-gray-100 flex items-center gap-4"
            >
              {prof.photo_url ? (
                <img
                  src={prof.photo_url}
                  alt={prof.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-2xl flex-shrink-0">
                  👤
                </div>
              )}
              <div>
                <p className="font-bold text-gray-800">{prof.name}</p>
                <p className="text-sm text-gray-400">{prof.name_kana}</p>
                {prof.faculties?.name && (
                  <p className="text-xs text-gray-400 mt-1">{prof.faculties.name}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {keyword && professors.length === 0 && (
          <p className="text-gray-400 py-8 text-center">
            「{keyword}」に一致する教授は見つかりませんでした。
          </p>
        )}
        {!keyword && (
          <p className="text-gray-400 py-8 text-center">
            上の検索ボックスにキーワードを入力してください。
          </p>
        )}
      </div>
    </main>
  )
}
