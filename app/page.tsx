import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import SearchBar from './SearchBar'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: faculties } = await supabase
    .from('faculties')
    .select('*')
    .order('name')

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-800">関西大学 教授レビュー</h1>
          <Link
            href="/ranking"
            className="bg-amber-400 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-500 transition-colors whitespace-nowrap flex-shrink-0"
          >
            🏆 ランキング
          </Link>
        </div>
        <p className="text-gray-500 mb-8">学部を選んで教授を探そう</p>

        <SearchBar />

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">学部一覧</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {faculties?.map((faculty) => (
              <Link
                key={faculty.id}
                href={`/faculties/${faculty.id}`}
                className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow border border-gray-100"
              >
                <h3 className="font-bold text-gray-800">{faculty.name}</h3>
                {faculty.department && (
                  <p className="text-sm text-gray-500 mt-1">{faculty.department}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
