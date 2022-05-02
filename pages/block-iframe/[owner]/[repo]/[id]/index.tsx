import React from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Script from "next/script";

export default () => {
  const router = useRouter();
  const { owner, repo, id } = router.query;

  const [props, setProps] = React.useState(undefined);
  const [Block, setBlock] = React.useState(undefined);

  React.useEffect(() => {
    const onLoad = () => {
      window.parent.postMessage(
        {
          type: "loaded",
        },
        "*"
      );
    };
    addEventListener("load", onLoad);
    return () => removeEventListener("load", onLoad);
  }, []);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const { data, source } = event;
      if (source !== window.parent) return;

      switch (data.type) {
        case "set-props":
          console.log("props", data.props, Block);
          setProps(data.props);
          break;
      }
    };
    addEventListener("message", onMessage);
    return () => removeEventListener("message", onMessage);
  }, []);

  return (
    <>
      {Block && props && <Block.default {...props} />}
      <Head>
        <link
          rel="stylesheet"
          href={`/api/block-code/css/${owner}/${repo}/${id}`}
        />
      </Head>
      <Script
        strategy="afterInteractive"
        src={`/api/block-code/js/${owner}/${repo}/${id}`}
        onLoad={() => {
          console.log("LOAD");
          console.log("global.BlockBundle", global.BlockBundle);
          if (!global.BlockBundle) return;
          setBlock(global.BlockBundle({ React }));
        }}
      />
    </>
  );
};

// force server-side rendering instead of static generation
// otherwise `router.query` is not filled in on the server
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};
