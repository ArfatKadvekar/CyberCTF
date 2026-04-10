import { BadgeCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function TeamCard({ member, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group relative w-[280px] max-w-[280px] flex-shrink-0 overflow-hidden rounded-3xl border border-cyan-200/20',
        'bg-gradient-to-br from-white/16 via-white/8 to-white/4 p-5 text-left text-slate-100 backdrop-blur-xl',
        'shadow-[0_12px_32px_rgba(6,182,212,0.18)] transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(34,211,238,0.24)]'
      )}
      aria-label={`Open ${member.name} profile`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.26),transparent_45%)] opacity-80" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.15)_45%,transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <img
          src={member.image}
          alt={member.name}
          className="h-[90px] w-[90px] rounded-full border border-cyan-200/30 object-cover ring-4 ring-cyan-300/30"
          loading="lazy"
        />

        <div className="mt-4 flex items-center gap-1.5">
          <h3 className="font-mono text-xl font-bold">{member.name}</h3>
          <BadgeCheck className="h-4 w-4 text-cyan-300" />
        </div>

        <p className="mt-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wider text-slate-200">
          {member.role}
        </p>
      </div>
    </button>
  );
}
