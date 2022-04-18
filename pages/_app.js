import "styles/index.css";
import "styles/primer-blocks.scss";
import "styles/markdown.css";
import "./../blocks/blocks.css";
import { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider, BaseStyles } from "@primer/react";
import { Hydrate, QueryClient, QueryClientProvider } from "react-query";
import "@codesandbox/sandpack-react/dist/index.css";
import Head from "next/head";
import { useRouter } from "next/router";
import { track } from "../lib/analytics";

function App({ Component, pageProps: { session, ...pageProps } }) {
  const [queryClient] = useState(() => new QueryClient());

  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url, { shallow }) => {
      if (shallow) return;
      let queryParams = url.split("?")[1];
      const parsed = new URLSearchParams(queryParams);
      const blockKey = parsed.get("blockKey");
      const path = parsed.get("path");
      if (path && blockKey) {
        track({
          url,
          event: "block-view",
          payload: {
            blockKey,
            path,
          },
        });
      }
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient} contextSharing={true}>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <Hydrate state={pageProps.dehydratedState}>
        <ThemeProvider>
          <BaseStyles>
            <SessionProvider refetchOnWindowFocus={false} session={session}>
              <Component {...pageProps} />
            </SessionProvider>
          </BaseStyles>
        </ThemeProvider>
      </Hydrate>
    </QueryClientProvider>
  );
}

export default App;
