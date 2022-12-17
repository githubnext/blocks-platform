import "styles/index.css";
import "styles/markdown.css";
import { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider, BaseStyles } from "@primer/react";
import { Hydrate, QueryClient, QueryClientProvider } from "react-query";
import Head from "next/head";
import { useRouter } from "next/router";
import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { NextAdapter } from "next-query-params";
import { QueryParamProvider } from "use-query-params";

function App({ Component, pageProps: { session, ...pageProps } }) {
  const [queryClient] = useState(() => new QueryClient());
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    const appInsights = new ApplicationInsights({
      config: {

        // this isn't a high-security key, see https://stackoverflow.com/questions/54535275/what-will-happen-if-applicationinsights-instrumentationkey-gets-stolen
        connectionString:
          `InstrumentationKey=96006ad9-5042-466e-b5c9-641be3a9e13f;IngestionEndpoint=/api/telemetry/ingest;LiveEndpoint=/api/telemetry/live`,
      },
    });
    appInsights.loadAppInsights();

    const handleRouteChange = (url, { shallow }) => {
      const parsedUrl = new URL(url, window.location.origin);
      const params = parsedUrl.searchParams;
      const pathname = parsedUrl.pathname;
      const [_, owner, repo] = pathname.split("/");
      const path = params.get("path");
      const branch = params.get("branch");
      const [blockOwner, blockRepo, blockId] =
        params.get("blockKey")?.split("__") ?? [];
      const fileRef = params.get("fileRef");

      const event = {
        name: "block-view",
        properties: {
          owner,
          repo,
          branch,
          path,
          fileRef,
          blockOwner,
          blockRepo,
          blockId,
          shallow,
        },
      };
      appInsights.trackEvent(event);
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, []);

  return (
    <QueryParamProvider adapter={NextAdapter}>
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
    </QueryParamProvider>
  );
}

export default App;
