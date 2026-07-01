interface LogoProps {
  className?: string;
  showBadge?: boolean;
}

export function Logo({ className = '', showBadge = false }: LogoProps) {
  return (
    <span className={`text-xl font-bold tracking-tight text-text-primary flex items-center ${className}`}>
      PRESSFORGE<span className="text-instagram-pink ml-0.5">.AI</span>
      {showBadge ? (
        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-text-secondary px-1.5 py-0.5 rounded-full font-medium ml-2">
          WIP
        </span>
      ) : null}
    </span>
  );
}
