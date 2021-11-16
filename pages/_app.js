import "styles/index.css";
import "styles/markdown.css";
import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider, BaseStyles } from "@primer/components";
import { Hydrate, QueryClient, QueryClientProvider } from "react-query";
import "@githubnext/utils/dist/index.css"

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient} contextSharing={true}>
      <Hydrate state={pageProps.dehydratedState}>
        <BaseStyles />
        <ThemeProvider>
          <SessionProvider session={session}>
            <Component {...pageProps} />
          </SessionProvider>
        </ThemeProvider>
      </Hydrate>
    </QueryClientProvider>
  );
}
