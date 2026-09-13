import { cn } from '@/lib/utils'

export default function BbsLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  const iconSize = 'h-10 w-12'

  return (
    <span className={cn('inline-flex items-start gap-2', className)} style={{ fontFamily: 'var(--font-geist-sans)' }}>
      <span className={cn('relative mt-0.5 inline-flex shrink-0 items-center justify-center font-sans text-[15px] font-black leading-none tracking-tight text-white', iconSize)}>
        <span aria-hidden className="absolute left-0 top-0 h-1/4 w-1/2 bg-[#D84017] [clip-path:polygon(0_100%,100%_0,100%_100%)]" />
        <span aria-hidden className="absolute left-0 top-0 h-1/4 w-1/2 bg-[#a70f1d] [clip-path:polygon(45%_100%,100%_72%,100%_100%)]" />
        <span aria-hidden className="absolute bottom-0 right-0 h-1/4 w-1/2 bg-[#D84017] [clip-path:polygon(0_0,0_100%,100%_0)]" />
        <span aria-hidden className="absolute bottom-0 right-0 h-1/4 w-1/2 bg-[#a70f1d] [clip-path:polygon(0_0,55%_0,0_28%)]" />
        <span className="absolute inset-x-0 top-1/4 bottom-1/4 flex items-center justify-center bg-[#D84017]">
          <span className="relative z-10">BBS</span>
        </span>
        <span className="absolute right-0 top-0 z-20 rounded-[2px] bg-[#F5DC38] px-[5px] text-[5px] font-black leading-[9px] text-[#7d361f]">NEWS</span>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[21px] font-bold tracking-tight text-[#D84017]">BBS</span>
          <span className="mt-1 text-[9px] font-medium tracking-tight text-zinc-500">Bongnudo Broadcasting System</span>
        </span>
      )}
    </span>
  )
}
