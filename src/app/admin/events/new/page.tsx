import EventForm from '../EventForm'

export default function NewEventPage() {
  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-black text-white">새 사건 작성</h1>
        <p className="text-sm text-zinc-500 mt-0.5">저장 후 참여자·클립을 추가할 수 있습니다.</p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <EventForm />
      </div>
    </div>
  )
}
