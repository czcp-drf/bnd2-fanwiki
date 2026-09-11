import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import TableOfContents from '@/components/guide/TableOfContents'

export const metadata: Metadata = {
  title: '입문 가이드',
  description: '봉누도2를 처음 접하는 시청자를 위한 기본 가이드',
}

const faqs = [
  {
    q: '봉누도2는 어떤 서버인가요?',
    a: 'GTA 5 온라인 기반의 한국 역할극 서버입니다. 스트리머들이 각자의 캐릭터를 연기하며 도시 생활, 범죄 수사, 사업 운영 등 다양한 이야기를 실시간으로 만들어갑니다.',
  },
  {
    q: '처음에 어떤 스트리머를 보면 좋나요?',
    a: '경찰이나 EMS 직군 스트리머를 추천합니다. 서버 전반의 사건에 자주 개입하기 때문에, 어떤 인물들이 있고 어떤 일들이 벌어지는지 전체적으로 파악하기 좋습니다.',
  },
  {
    q: '같은 사건인데 다른 스트리머 방송에서 보면 내용이 다른가요?',
    a: '네. 같은 시간에 일어난 사건도 어떤 캐릭터의 시각으로 보느냐에 따라 보이는 정보와 분위기가 완전히 달라집니다. 경찰이 추격하는 장면을 경찰 시각과 도주자 시각에서 각각 보면 전혀 다른 긴장감을 경험할 수 있습니다.',
  },
  {
    q: '스트리머가 방송 중 특정 정보를 모르는 척하는 이유는?',
    a: '캐릭터 연기를 지키기 위해서입니다. 방송을 통해 알게 된 정보라도, 캐릭터가 그 상황에서 실제로 알 수 없는 내용이라면 모르는 채로 행동해야 합니다. 이것이 지켜져야 모든 참여자가 몰입할 수 있는 이야기가 만들어집니다.',
  },
  {
    q: '시청자가 직접 참여할 수 있나요?',
    a: '봉누도2는 초대 기반으로 운영되어 일반 시청자는 입장할 수 없습니다. 방송 시청과 이 사이트의 위키를 통해 세계관을 즐겨주세요.',
  },
  {
    q: '사이트의 정보가 틀렸거나 업데이트가 필요하면?',
    a: (
      <>
        상단 네비게이션의{' '}
        <Link href="/report" className="text-amber-400 hover:underline">
          제보하기
        </Link>
        를 통해 알려주세요. 검토 후 반영됩니다.
      </>
    ),
  },
]

async function getStats() {
  const supabase = await createClient()
  const [{ count: streamerCount }, { count: characterCount }] = await Promise.all([
    supabase.from('streamers').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('characters').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])
  return { streamerCount: streamerCount ?? 0, characterCount: characterCount ?? 0 }
}

export default async function GuidePage() {
  const stats = await getStats()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
        {/* 사이드 TOC — 데스크탑 */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <TableOfContents />
          </div>
        </aside>

        {/* 본문 */}
        <div className="space-y-16 min-w-0">
          {/* 헤더 */}
          <div className="space-y-3">
            <div className="inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-400">
              입문 가이드
            </div>
            <h1 className="text-3xl font-black text-white">봉누도2를 처음 접하신 분께</h1>
            <p className="text-zinc-400 leading-relaxed">
              처음 보더라도 걱정하지 마세요. 이 가이드를 읽고 나면 봉누도2 세계관을 훨씬 재미있게 즐길 수 있습니다.
            </p>

            {/* 통계 요약 */}
            <div className="mt-6 flex gap-6 rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-4">
              <div>
                <p className="text-2xl font-black text-white">{stats.streamerCount}</p>
                <p className="text-xs text-zinc-500 mt-0.5">활동 스트리머</p>
              </div>
              <div className="w-px bg-zinc-800" />
              <div>
                <p className="text-2xl font-black text-white">{stats.characterCount}</p>
                <p className="text-xs text-zinc-500 mt-0.5">활동 캐릭터</p>
              </div>
              <div className="w-px bg-zinc-800" />
              <div>
                <p className="text-2xl font-black text-white">치지직</p>
                <p className="text-xs text-zinc-500 mt-0.5">방송 플랫폼</p>
              </div>
            </div>
          </div>

          {/* GTA RP란? */}
          <Section id="what-is-gta-rp" title="GTA RP란?">
            <p>
              GTA RP는 <strong>Grand Theft Auto V</strong>라는 게임 안에서 각자 캐릭터를 만들어 그 인물로서 살아가는 콘텐츠입니다.
              게임을 잘하는 것이 목표가 아니라, 마치 배우처럼 자신의 캐릭터를 연기하며 다른 참여자들과 함께 이야기를 만들어가는 것이 핵심입니다.
            </p>
            <p>
              경찰은 범죄자를 쫓고, 갱단은 세력을 키우며, 의사는 부상자를 치료합니다.
              모든 것이 미리 짜여진 대본 없이 실시간으로 벌어지기 때문에,
              시청자 입장에서는 살아 숨쉬는 드라마를 보는 듯한 몰입감을 느낄 수 있습니다.
            </p>
            <InfoBox>
              스트리머들은 방송 중 자신의 <strong>캐릭터</strong>로서 말하고 행동합니다.
              캐릭터가 모를 법한 정보는 방송에서 알게 됐더라도 캐릭터로서는 모르는 채로 연기하는 것이 기본 규칙입니다.
              이 규칙이 지켜져야 모두가 몰입할 수 있는 이야기가 만들어집니다.
            </InfoBox>
          </Section>

          {/* 봉누도2 소개 */}
          <Section id="what-is-bnd2" title="봉누도2 소개">
            <p>
              봉누도2는 국내 치지직 스트리머들이 참여하는 <strong>한국형 GTA 역할극 서버</strong>입니다.
              경찰, EMS, 기자, 교통정비공사 같은 공공 기관부터 음식점·튜닝소 같은 합법 사업체,
              갱단이 운영하는 총기 제작소·자금 세탁·밀수 같은 불법 사업체까지,
              다양한 직군의 캐릭터들이 한 도시 안에서 얽히고 설킵니다.
            </p>
            <p>
              각 스트리머는 하나 이상의 캐릭터를 가지고 있으며, 캐릭터마다 직업·소속 세력·개인 사연이 다릅니다.
              같은 사건을 어떤 캐릭터의 시각으로 보느냐에 따라 전혀 다른 경험이 되는 것이 봉누도2만의 매력입니다.
            </p>
            <InfoBox>
              봉누도2는 초대 기반 서버로, 시청자가 직접 입장할 수 없습니다. 방송 시청과 이 사이트를 통해 세계관을 즐겨주세요.
            </InfoBox>
          </Section>

          {/* 시청 방법 */}
          <Section id="how-to-watch" title="시청 방법">
            <p>
              봉누도2 스트리머들은 모두 <strong>치지직(chzzk.naver.com)</strong>에서 방송합니다.
              이 사이트의{' '}
              <Link href="/streamers" className="text-amber-400 hover:underline">스트리머 목록</Link>
              에서 활동 중인 스트리머를 확인하고 치지직 채널로 바로 이동할 수 있습니다.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                {
                  step: '1',
                  title: '스트리머 선택',
                  desc: '스트리머 목록에서 관심 있는 직군이나 캐릭터를 골라 치지직 채널로 이동합니다. 처음엔 경찰 또는 EMS를 추천합니다.',
                },
                {
                  step: '2',
                  title: '방송 시청',
                  desc: '라이브 방송 중이라면 실시간으로, 아니라면 다시보기로 시청합니다. 채팅을 보면 다른 시청자들의 반응도 함께 즐길 수 있습니다.',
                },
                {
                  step: '3',
                  title: '시점 전환',
                  desc: '같은 사건을 다른 캐릭터 시각으로 보고 싶다면, 해당 사건에 참여한 다른 스트리머 채널로 이동합니다.',
                },
              ].map(({ step, title, desc }) => (
                <div key={step} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-zinc-900">
                    {step}
                  </div>
                  <p className="font-bold text-white text-sm">{title}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* 시점 전환 가이드 */}
          <Section id="pov-guide" title="시점 전환 가이드">
            <p>
              봉누도2의 가장 큰 재미 중 하나는 <strong>같은 사건을 여러 시각으로 보는 것</strong>입니다.
              경찰이 갱단을 추격하는 상황이라면, 경찰 스트리머 방송에서는 범인을 잡으려는 긴박한 수사가 펼쳐지고,
              갱단 스트리머 방송에서는 도주를 위한 치열한 판단과 결정이 펼쳐집니다.
              같은 시간대에 같은 사건이지만 전혀 다른 드라마입니다.
            </p>
            <p>
              각 스트리머의 방송 화면에 표시되는 정보도 그 캐릭터가 실제로 보고 들은 것만으로 제한됩니다.
              그래서 한 스트리머 방송만 봐서는 전체 그림이 잘 안 보일 때가 있습니다.
              이럴 때 다른 스트리머로 시점을 전환하면 퍼즐 조각이 맞춰지는 쾌감을 느낄 수 있습니다.
            </p>
            <InfoBox>
              <strong>처음 시청하는 분께:</strong> 처음에는 한 스트리머를 고정해서 보는 것을 추천합니다.
              세계관에 익숙해지면 자연스럽게 여러 채널을 넘나들게 됩니다.
            </InfoBox>
            <p>
              이 사이트의 사건 아카이브에서는 주요 사건마다 참여 캐릭터와 각 스트리머의 방송 클립을 정리해두고 있습니다.
              다시보기로 여러 시각을 비교해보기에 최적입니다.
            </p>
            <div className="mt-2">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-amber-400/40 hover:text-amber-400 transition-colors"
              >
                사건 아카이브 보기 →
              </Link>
            </div>
          </Section>

          {/* 주요 세력 */}
          <Section id="organizations" title="주요 세력">
            <p>봉누도2의 도시는 크게 네 종류의 세력이 움직입니다. 각 세력이 서로 부딪히고 협력하며 이야기가 만들어집니다.</p>
            <div className="mt-4 space-y-3">
              {[
                {
                  color: 'border-indigo-500/30 bg-indigo-500/5',
                  dot: 'bg-indigo-400',
                  label: '시청',
                  title: '서버 운영 총괄 기관',
                  desc: '봉누도2 서버 전체를 관할하는 최상위 기관입니다. 서버장과 운영진으로 구성되며, 서버의 규칙과 방향을 결정합니다. 일반 스트리머는 포함되지 않습니다.',
                },
                {
                  color: 'border-blue-500/30 bg-blue-500/5',
                  dot: 'bg-blue-400',
                  label: '공무직',
                  title: '경찰서 · EMS · 기자단 · 교통정비공사',
                  desc: '도시의 질서와 안전을 지키는 공공 기관입니다. 경찰은 범죄를 수사하고 범인을 검거하며, EMS는 사고 현장에 달려가 부상자를 치료합니다. 기자는 서버에서 벌어지는 사건들을 취재해 보도하고, 교통정비공사는 도로와 차량 관련 업무를 담당합니다.',
                },
                {
                  color: 'border-emerald-500/30 bg-emerald-500/5',
                  dot: 'bg-emerald-400',
                  label: '사업체',
                  title: '음식점 · 튜닝소 · 농장 · 어업',
                  desc: '도시 경제를 움직이는 합법 사업체들입니다. 중식·일식·양식·카페 등 음식점을 운영하거나, 자동차를 개조하는 튜닝소를 꾸리거나, 농작물을 재배하고 물고기를 잡아 생계를 유지합니다. 비교적 평화로운 일상 드라마가 펼쳐지는 공간입니다.',
                },
                {
                  color: 'border-red-500/30 bg-red-500/5',
                  dot: 'bg-red-400',
                  label: '갱 (불법 사업체)',
                  title: '총기 제작 · 자금 세탁 · 밀수 · 정보상 외',
                  desc: '갱단이 운영하는 불법 사업체들입니다. 경찰의 눈을 피해 총기를 만들거나, 범죄로 얻은 돈을 세탁하거나, 위험한 물건을 몰래 들여오고 팔아넘깁니다. 판도라 연구소는 불법 의료 시술을 담당하고, 위스퍼는 도시의 온갖 정보를 사고파는 정보상 조직입니다.',
                },
              ].map(({ color, dot, label, title, desc }) => (
                <div key={label} className={`rounded-xl border p-5 space-y-2 ${color}`}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                    <span className="text-xs font-semibold text-zinc-400">{label}</span>
                  </div>
                  <p className="font-bold text-white text-sm">{title}</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="/organizations"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-amber-400/40 hover:text-amber-400 transition-colors"
              >
                조직 전체 보기 →
              </Link>
            </div>
          </Section>

          {/* FAQ */}
          <Section id="faq" title="자주 묻는 질문">
            <div className="space-y-3">
              {faqs.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-zinc-200 hover:text-white transition-colors">
                    {q}
                    <span className="ml-3 shrink-0 text-zinc-600 transition-transform group-open:rotate-45 text-lg leading-none">+</span>
                  </summary>
                  <div className="border-t border-zinc-800 px-5 py-4 text-sm text-zinc-400 leading-relaxed">
                    {a}
                  </div>
                </details>
              ))}
            </div>
          </Section>

          {/* 마무리 */}
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-6 py-5 text-center space-y-3">
            <p className="font-bold text-white">이제 봉누도2를 즐길 준비가 됐습니다!</p>
            <p className="text-sm text-zinc-400">
              궁금한 캐릭터나 사건이 있다면 위키에서 찾아보세요. 빠진 정보가 있다면 제보해 주세요.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <Link
                href="/streamers"
                className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-zinc-900 hover:bg-amber-300 transition-colors"
              >
                스트리머 보러가기
              </Link>
              <Link
                href="/report"
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
              >
                제보하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="text-xl font-black text-white">{title}</h2>
      <div className="space-y-3 text-sm text-zinc-400 leading-relaxed [&_strong]:text-zinc-200 [&_strong]:font-semibold">
        {children}
      </div>
    </section>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-l-2 border-amber-400/60 bg-amber-400/5 px-4 py-3 text-sm text-zinc-400">
      {children}
    </div>
  )
}
