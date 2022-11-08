export function GradientBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-2 z-1 px-6 gradient-border-badge relative bg-transparent inline-flex items-center justify-center">
      <span className="z-10 text-sm lg:text-base bg-clip-text text-transparent bg-gradient-to-r from-[#9867f0] to-[#ed4e50] font-semibold relative -top-px">
        {children}
      </span>
    </div>
  );
}
export function GradientBadgeDark({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${className} pt-[0.3em] pb-[0.4em] z-1 px-[1em] gradient-border-badge-dark relative bg-transparent inline-flex items-center justify-center`}
    >
      <span className="z-10 text-sm lg:text-base bg-clip-text text-transparent bg-gradient-to-r from-[#79C0FF] to-[#84EDC1] font-normal relative -top-px leading-none">
        {children}
      </span>
    </div>
  );
}
