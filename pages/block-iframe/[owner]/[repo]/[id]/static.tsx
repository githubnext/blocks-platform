import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import PrimerReact from "@primer/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Script from "next/script";
import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import tar from "tar-stream";
import streamifier from "streamifier";
import { unzipSync } from "zlib";
import sanitizeId from "utils/sanitize-id";

type Asset = {
  name: string;
  content: string;
};

const Page = ({ assets }: { assets: Asset[] }) => {
  const router = useRouter();
  const { owner, repo, id } = router.query;

  const [props, setProps] = useState(undefined);
  const [Block, setBlock] = useState(undefined);

  const jsString =
    assets.find((asset) => asset.name.endsWith(".js"))?.content || "";

  useEffect(() => {
    console.log("LOAD in effect");
    console.log("global.BlockBundle", global.BlockBundle);
    if (!global.BlockBundle) return;
    setBlock(global.BlockBundle({ React, ReactDOM, PrimerReact }));
  }, []);

  useEffect(() => {
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

  useEffect(() => {
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
      <Head>
        <style>{/* {css} */}</style>
      </Head>
      {Block && props && <Block.default {...props} />}
      BLock here
      <Script id="block-code" strategy="afterInteractive">
        {`
var BlockBundle = ({ React, ReactDOM, PrimerReact }) => {
  function require(name) {
    switch (name) {
      case "react":
        return React;
      case "react-dom":
        return ReactDOM;
      case "@primer/react":
        return PrimerReact;
      default:
        console.log("no module '" + name + "'");
        return null;
    }
  }
${jsString}
  return BlockBundle;
};`}
      </Script>
    </>
  );
};

// force server-side rendering instead of static generation
// otherwise `router.query` is not filled in on the server
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const query = context.query;
  const { repo, owner, id } = query as Record<string, string>;
  const session = await getSession({ req: context.req });

  const authorization: Record<string, string> = session.token
    ? { authorization: `Bearer ${session.token}` }
    : {};

  const apiBaseUrl = `https://api.github.com/repos/${sanitizeId(
    owner
  )}/${sanitizeId(repo)}`;

  // @ts-ignore
  const releaseInfoUrl = `${apiBaseUrl}/releases/latest`;
  const releaseInfo = await fetch(releaseInfoUrl, {
    headers: authorization,
  }).then((r) => r.json());
  const releaseAssets = releaseInfo.assets || [];
  const asset = releaseAssets.find((a: any) => a.name === `${id}.tar.gz`);
  if (!asset) {
    return {
      props: {
        notFound: true,
      },
    };
  }
  const assetUrl = `${apiBaseUrl}/releases/assets/${asset.id}`;

  const assetContentRes = await fetch(assetUrl, {
    headers: {
      ...authorization,
      Accept: "application/octet-stream",
    },
  });
  if (assetContentRes.status !== 200) {
    return {
      props: {
        notFound: true,
      },
    };
  }

  // @ts-ignore
  const buffer = await assetContentRes.buffer();
  const assets = await untar(buffer);

  console.log("assets", assets);

  // TODO: look into caching
  // https://nextjs.org/docs/basic-features/data-fetching/get-server-side-props#caching-with-server-side-rendering-ssr
  // eg:
  // res.setHeader(
  //   'Cache-Control',
  //   'public, s-maxage=10, stale-while-revalidate=59'
  // )

  return {
    props: {
      assets,
    },
  };
}

Page.getLayout = (page) => page;

export default Page;

const untar = (buffer: any): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    // Buffer is representation of .tar.gz file uploaded to Express.js server
    // using Multer middleware with MemoryStorage
    const textData = [] as { name: string; content: string }[];
    const extract = tar.extract();
    // Extract method accepts each tarred file as entry, separating header and stream of contents:
    extract.on("entry", (header: any, stream: any, next: any) => {
      const chunks = [] as Uint8Array[];
      stream.on("data", (chunk: Uint8Array) => {
        chunks.push(chunk);
      });
      stream.on("error", (err: any) => {
        reject(err);
      });
      stream.on("end", () => {
        // We concatenate chunks of the stream into string and push it to array, which holds contents of each file in .tar.gz:
        const text = Buffer.concat(chunks).toString("utf8");
        textData.push({ name: header.name, content: text });
        next();
      });
      stream.resume();
    });
    extract.on("finish", () => {
      // We return array of tarred files's contents:
      resolve(textData);
    });
    // We unzip buffer and convert it to Readable Stream and then pass to tar-stream's extract method:
    streamifier.createReadStream(unzipSync(buffer)).pipe(extract);
  });
};
