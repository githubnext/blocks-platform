export function Nav() {
  return (
    <div className="relative">
      <div className="h-1 bg-gradient-to-r from-[#9867f0] to-[#ed4e50]"></div>
      <header className="p-4">
        <div className="flex items-center justify-between">
          <div aria-label="Home" className="inline-block rounded-full">
            <img
              alt="GitHub Next Logo"
              width={72}
              height={72}
              src="/next-octocat.svg"
            />
          </div>
        </div>
      </header>
    </div>
  );
}
