import type { Metadata } from 'next'
import { FileText, Clock, CheckCheck, MessageSquare } from 'lucide-react'
import ReportForm from '@/components/report/ReportForm'

export const metadata: Metadata = {
  title: '제보하기',
  description: '봉누도2 위키에 정보를 제보하거나 수정을 요청합니다',
}

const processSteps = [
  {
    icon: FileText,
    label: '제출',
    desc: '아래 양식을 작성해 제보합니다',
  },
  {
    icon: Clock,
    label: '검토',
    desc: '관리자가 내용을 확인합니다',
  },
  {
    icon: CheckCheck,
    label: '반영',
    desc: '검토 완료 후 위키에 반영됩니다',
  },
]

export default function ReportPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-10">
      {/* 헤더 */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-400">
          <MessageSquare size={12} />
          커뮤니티 제보
        </div>
        <h1 className="text-2xl font-black text-white">제보하기</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          위키에 빠진 정보나 잘못된 내용을 알려주세요.
          여러분의 제보가 봉누도2 위키를 더욱 풍성하게 만듭니다.
        </p>
      </div>

      {/* 처리 흐름 */}
      <div className="flex items-center gap-2">
        {processSteps.map(({ icon: Icon, label, desc }, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className="flex flex-col items-center gap-1.5 text-center flex-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400">
                <Icon size={15} />
              </div>
              <p className="text-xs font-semibold text-zinc-300">{label}</p>
              <p className="text-[11px] text-zinc-600 leading-tight">{desc}</p>
            </div>
            {i < processSteps.length - 1 && (
              <div className="h-px w-6 shrink-0 bg-zinc-800 mb-7" />
            )}
          </div>
        ))}
      </div>

      {/* 안내 */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 space-y-2">
        <p className="text-xs font-semibold text-zinc-400">제보 시 이런 내용을 포함해주시면 빠르게 반영됩니다</p>
        <ul className="space-y-1 text-xs text-zinc-600">
          <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0">·</span>캐릭터 제보 시: 캐릭터 이름, 담당 스트리머, 직업, 소속 조직</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0">·</span>사건 제보 시: 사건명, 발생 날짜와 시간, 관련 클립 링크</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0">·</span>수정 요청 시: 현재 잘못된 내용과 올바른 내용</li>
        </ul>
      </div>

      {/* 폼 */}
      <ReportForm />
    </div>
  )
}
