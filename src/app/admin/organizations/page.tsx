import { createAdminClient } from '@/lib/supabase/admin'
import OrgEditRow from './OrgEditRow'
import OrgAddForm from './OrgAddForm'
import CacheRefreshButton from '@/components/admin/CacheRefreshButton'

const categoryOrder = ['city_hall', 'public_service', 'gang', 'business', 'illegal']
const categoryLabel: Record<string, string> = {
  city_hall: '시청',
  public_service: '공무직',
  gang: '갱단',
  business: '사업체',
  illegal: '불법 사업체',
}

async function getOrganizations() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('organizations')
    .select('id, name, name_confirmed, type, category, color, emoji, description, is_active, is_disbanded, gang_id')
    .order('category')
    .order('name')
  return (data ?? []) as {
    id: string
    name: string
    name_confirmed: boolean
    type: string | null
    category: string | null
    color: string | null
    emoji: string | null
    description: string | null
    is_active: boolean
    is_disbanded: boolean
    gang_id: string | null
  }[]
}

export default async function AdminOrganizationsPage() {
  const orgs = await getOrganizations()

  const gangs = orgs.filter((o) => o.category === 'gang').map((o) => ({ id: o.id, name: o.name }))

  const grouped = categoryOrder.reduce((acc, cat) => {
    acc[cat] = orgs.filter((o) => o.category === cat)
    return acc
  }, {} as Record<string, typeof orgs>)

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white">조직 관리</h1>
          <p className="text-sm text-zinc-500 mt-0.5">총 {orgs.length}개</p>
        </div>
        <div className="flex items-center gap-2">
          <CacheRefreshButton scope="organizations" />
          <OrgAddForm />
        </div>
      </div>

      {categoryOrder.map((cat) => {
        const list = grouped[cat]
        if (!list?.length) return null
        return (
          <section key={cat} className="space-y-3">
            <h2 className="text-sm font-bold text-zinc-400">{categoryLabel[cat]}</h2>
            <div className="rounded-xl border border-zinc-800 overflow-x-auto">
              <table className="w-full min-w-[760px] table-fixed">
                <colgroup>
                  <col className="w-12" />
                  <col className="w-64" />
                  <col />
                  <col className="w-16" />
                  <col className="w-48" />
                </colgroup>
                <thead>
                  <tr className="bg-zinc-900">
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">색상</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">명칭</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">설명</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">상태</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((org) => (
                    <OrgEditRow key={org.id} org={org} gangs={cat === 'illegal' ? gangs : []} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}
