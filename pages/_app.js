import "styles/index.css";
import "styles/primer-blocks.scss";
import "styles/markdown.css";
import "./../blocks/blocks.css";
import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider, BaseStyles } from "@primer/components";
import { Hydrate, QueryClient, QueryClientProvider } from "react-query";
import "@codesandbox/sandpack-react/dist/index.css";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient} contextSharing={true}>
      <Hydrate state={pageProps.dehydratedState}>
        <ThemeProvider>
          <BaseStyles>
            <SessionProvider session={session}>
              <Component {...pageProps} />
            </SessionProvider>
          </BaseStyles>
        </ThemeProvider>
      </Hydrate>
    </QueryClientProvider>
  );
}
