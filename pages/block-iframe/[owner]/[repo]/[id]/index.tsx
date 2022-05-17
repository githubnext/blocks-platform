import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import * as PrimerReact from "@primer/react";
import { ThemeProvider, BaseStyles } from "@primer/react";
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

const onUpdateMetadata = (newMetadata) => {
  window.parent.postMessage(
    {
      type: "update-metadata",
      id: "${id}",
      metadata: newMetadata,
    },
    "*"
  );
};

const onNavigateToPath = (path) => {
  window.parent.postMessage(
    {
      type: "navigate-to-path",
      id: "${id}",
      path,
    },
    "*"
  );
};

const onUpdateContent = (content) => {
  window.parent.postMessage(
    {
      type: "update-file",
      id: "${id}",
      content: content,
    },
    "*"
  );
};

const pendingRequests = {};

let uniqueId = 0;
const getUniqueId = () => {
  uniqueId++;
  return uniqueId;
};

const onRequestGitHubData = (path, params) => {
  // for responses to this specific request
  const requestId = `github-data--request--${getUniqueId()}`;

  window.parent.postMessage(
    {
      type: "github-data--request",
      id: "${id}",
      requestId,
      path,
      params,
    },
    "*"
  );

  return new Promise((resolve, reject) => {
    pendingRequests[requestId] = { resolve, reject };
    const maxDelay = 1000 * 5;
    window.setTimeout(() => {
      delete pendingRequests[requestId];
      reject(new Error("Timeout"));
    }, maxDelay);
  });
};

const Page = ({ assets }: { assets: Asset[] }) => {
  const [props, setProps] = useState(undefined);
  const [Block, setBlock] = useState(undefined);

  const jsString =
    assets.find((asset) => asset.name.endsWith(".js"))?.content || "";

  useEffect(() => {
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
          setProps(data.props);
          break;

        case "github-data--response":
          const request = pendingRequests[event.data.requestId];
          if (!request) return;
          delete pendingRequests[event.data.requestId];

          if ("error" in event.data) {
            request.reject(event.data.error);
          } else {
            request.resolve(event.data.data);
          }
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
      {Block && props && (
        <ThemeProvider>
          <BaseStyles>
            <Block.default
              // recreate the block if we change file or version
              key={props.context.sha}
              {...props}
              onUpdateMetadata={onUpdateMetadata}
              onNavigateToPath={onNavigateToPath}
              onUpdateContent={onUpdateContent}
              onRequestUpdateContent={onUpdateContent} // for backwards compatibility
              onRequestGitHubData={onRequestGitHubData}
            />
          </BaseStyles>
        </ThemeProvider>
      )}
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
      case "@primer/components":
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

  context.res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=60"
  );

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
