import { BadgeCheck, Github, Linkedin, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function TeamMemberCard({ member, variant = 'light' }) {
  const isDark = variant === 'dark';

  return (
    <article
      className={cn(
        'team-card group mx-auto w-full max-w-[320px] rounded-2xl border p-5 shadow-md transition-all duration-300 hover:shadow-2xl',
        isDark
          ? 'border-cyan-200/20 bg-gradient-to-br from-slate-900/85 via-slate-900/75 to-black/70 text-slate-100 shadow-[0_12px_28px_rgba(8,47,73,0.35)] backdrop-blur-xl'
          : 'border-white/25 bg-gradient-to-b from-white/22 to-white/8 text-slate-100 shadow-[0_12px_28px_rgba(15,23,42,0.2)] backdrop-blur-xl'
      )}
    >
      <div className="flex flex-col items-center text-center">
        <img
          src={member.image}
          alt={member.name}
          className={cn(
            'h-24 w-24 rounded-full object-cover ring-4',
            isDark ? 'ring-cyan-300/35 border border-cyan-200/40' : 'ring-white/30 border border-white/30'
          )}
          loading="lazy"
        />

        <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-90">
          {member.role}
        </div>

        <div className="mt-3 mb-2 flex items-center gap-1.5">
          <h3 className="font-mono text-xl font-bold">{member.name}</h3>
          <BadgeCheck className={cn('h-4 w-4', isDark ? 'text-cyan-300' : 'text-primary')} />
        </div>

        <p className={cn('min-h-[42px] text-sm leading-relaxed', isDark ? 'text-slate-300' : 'text-slate-200')}>
          {member.bio}
        </p>

        <div className={cn('my-4 grid w-full grid-cols-3 gap-2 rounded-xl border p-3 text-center', isDark ? 'border-white/10 bg-white/5 backdrop-blur-sm' : 'border-white/20 bg-white/10 backdrop-blur-sm')}>
          <div>
            <p className="text-[10px] uppercase tracking-wide opacity-70">Focus</p>
            <p className="text-xs font-semibold">Security</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide opacity-70">Stack</p>
            <p className="text-xs font-semibold">MERN</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide opacity-70">School</p>
            <p className="text-xs font-semibold">PICT</p>
          </div>
        </div>

        <div className="flex w-full items-center gap-2">
          <a
            href={member.github}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors', isDark ? 'border-white/20 hover:bg-white/10 hover:text-cyan-300' : 'border-white/25 hover:bg-white/20 hover:text-cyan-300')}
            aria-label={`${member.name} GitHub`}
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors', isDark ? 'border-white/20 hover:bg-white/10 hover:text-cyan-300' : 'border-white/25 hover:bg-white/20 hover:text-cyan-300')}
            aria-label={`${member.name} LinkedIn`}
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors', isDark ? 'bg-cyan-400 text-slate-900 hover:bg-cyan-300' : 'bg-cyan-400 text-slate-900 hover:bg-cyan-300')}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Get in Touch
          </a>
        </div>
      </div>
    </article>
  );
}
