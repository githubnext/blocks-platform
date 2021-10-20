import "styles/index.css";
import { ThemeProvider, BaseStyles } from "@primer/components";

export default function App({ Component, pageProps }) {
  return (
    <>
      <BaseStyles />
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}
