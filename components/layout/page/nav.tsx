import Link from "next/link";

export function Nav() {
  return (
    <div className="relative">
      <div className="h-1 bg-gradient-to-r from-[#9867f0] to-[#ed4e50]"></div>
      <header className="p-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <a aria-label="Home" className="inline-block rounded-full">
              <img
                alt="GitHub Next Logo"
                width={72}
                height={72}
                src="/assets/images/next-octocat.svg"
              />
            </a>
          </Link>
          <nav className="space-x-4 text-sm text-gray-600">
            <a
              className="hover:underline"
              href="https://twitter.com/githubnext"
            >
              Twitter
            </a>
          </nav>
        </div>
      </header>
    </div>
  );
}
