import "styles/index.css";
import "styles/markdown.css";
import { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider, BaseStyles } from "@primer/react";
import { Hydrate, QueryClient, QueryClientProvider } from "react-query";
import Head from "next/head";
import { useRouter } from "next/router";
import { track } from "../lib/analytics";
import { ApplicationInsights } from "@microsoft/applicationinsights-web";

function App({ Component, pageProps: { session, ...pageProps } }) {
  const [queryClient] = useState(() => new QueryClient());

  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    const appInsights = new ApplicationInsights({
      config: {
        // this isn't a high-security key, see https://stackoverflow.com/questions/54535275/what-will-happen-if-applicationinsights-instrumentationkey-gets-stolen
        connectionString:
          "InstrumentationKey=96006ad9-5042-466e-b5c9-641be3a9e13f;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/",
      },
    });
    appInsights.loadAppInsights();
  }, []);

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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <title>GitHub Blocks</title>
      </Head>
      <Hydrate state={pageProps.dehydratedState}>
        <ThemeProvider>
          <BaseStyles>
            <SessionProvider
              refetchOnWindowFocus={false}
              session={session}
              refetchInterval={5 * 60}
            >
              <Component {...pageProps} />
            </SessionProvider>
          </BaseStyles>
        </ThemeProvider>
      </Hydrate>
    </QueryClientProvider>
  );
}

export default App;
