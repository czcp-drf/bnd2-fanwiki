import { cn } from '@/lib/utils'

export default function BbsLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-start gap-2', className)}>
      <span className="relative mt-0.5 inline-flex h-10 w-12 shrink-0 items-center justify-center rounded-sm bg-[#d7432d] text-[15px] font-black tracking-tight text-white shadow-[3px_3px_0_#f28a2e] after:absolute after:-bottom-1 after:left-2 after:h-3 after:w-3 after:-skew-x-12 after:bg-[#d7432d]">
        <span className="relative z-10">BBS</span>
        <span className="absolute -right-1 -top-2 z-20 bg-[#f5c542] px-1 text-[6px] font-black leading-3 text-[#7d361f]">NEWS</span>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[21px] font-bold tracking-tight text-[#d7432d]">BBS</span>
          <span className="mt-1 text-[9px] font-medium tracking-tight text-zinc-500">Bongnudo Broadcasting System</span>
        </span>
      )}
    </span>
  )
}
