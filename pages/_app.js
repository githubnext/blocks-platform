import { withPasswordProtect } from "@storyofams/next-password-protect";
import "styles/index.css";
import "styles/markdown.css";
import "./../blocks/blocks.css";
import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider, BaseStyles } from "@primer/components";
import { Hydrate, QueryClient, QueryClientProvider } from "react-query";
import "@codesandbox/sandpack-react/dist/index.css";

function App({
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

export default process.env.PASSWORD_PROTECT
  ? withPasswordProtect(App)
  : App;