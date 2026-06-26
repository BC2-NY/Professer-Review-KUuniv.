// app/faculties/[id]/page.tsx — Server Component
// （このファイルを app/faculties/[id]/page.tsx として上書き配置してください）
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import FacultyProfessorList, { type Prof } from './FacultyProfessorList'

export default async function FacultyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // ── 学部の教授（professor_rankings ビュー1本でカードに必要な値が揃う） ──
  const { data: rows } = await supabase
    .from('professor_rankings')
    .select(
      'id, name, name_kana, research_field, photo_url, likes, dislikes, like_percent, faculty_name',
    )
    .eq('faculty_id', id)

  // 学部名（教授0名でも表示できるようフォールバック取得）
  let facultyName = rows?.[0]?.faculty_name as string | undefined
  if (!facultyName) {
    const { data: f } = await supabase
      .from('faculties')
      .select('name')
      .eq('id', id)
      .maybeSingle()
    if (!f) notFound()
    facultyName = f.name as string
  }

  // ── 講義名（検索対象に含める）。学部の全教授の講義をまとめて取得し professor_id ごとに集約 ──
  const profIds = (rows ?? []).map((r) => r.id as string)
  const lectureMap = new Map<string, string[]>()
  if (profIds.length > 0) {
    const { data: lecs } = await supabase
      .from('lectures')
      .select('professor_id, name')
      .in('professor_id', profIds)
    lecs?.forEach((l) => {
      const pid = l.professor_id as string
      const arr = lectureMap.get(pid) ?? []
      arr.push(l.name as string)
      lectureMap.set(pid, arr)
    })
  }

  // ── カード用に整形 ──
  const professors: Prof[] = (rows ?? []).map((r) => {
    // research_field: 「大区分 / 中区分、…」→ 中区分のみ・重複除去
    const fields = [
      ...new Set(
        ((r.research_field as string | null) ?? '')
          .split('、')
          .map((s) => s.split('/').pop()!.trim())
          .filter(Boolean),
      ),
    ]
    const lectureNames = lectureMap.get(r.id as string) ?? []
    return {
      id: r.id as string,
      name: r.name as string,
      kana: ((r.name_kana as string | null) ?? '') as string,
      field: fields[0] ?? '', // カード表示は先頭1つ
      likes: (r.likes as number | null) ?? 0,
      dislikes: (r.dislikes as number | null) ?? 0,
      pct: (r.like_percent as number | null) ?? 0,
      // 検索対象：教授名 + ふりがな + 全研究分野 + 担当講義名
      searchText: [r.name, r.name_kana, ...fields, ...lectureNames]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
    }
  })

  return <FacultyProfessorList facultyName={facultyName!} professors={professors} />
}
