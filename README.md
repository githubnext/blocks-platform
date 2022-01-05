# GitHub Blocks

GitHub Blocks is an exploration of the question:

> What if developers could customize GitHub, not only to present their code and data, but to make it a living, interactive platform?

Instead of feeling like a storage locker for code, can we bring that content to life? What if a designer could view styles from a CSS file instead of having to wait for a developer to transform it? Or if journalists could visualize data right on GitHub, along with how it's changed over time? There are so many possibilities!

This sounds like a lot of work to build, right? With such an enthusiastic & active community, GitHub could build a flexible API that allows users to take control, and help with building out any use case.

In our exploration we've created a first version of this API that let's anyone create their own custom Blocks.

> 🚀🚀🚀 Check out the Demo: [github-blocks.vercel.app](https://github-blocks.vercel.app)

## GitHub Blocks API

> 📣 Read this if you're a GitHub user interested in building your own custom Blocks!

A Block is a React component that receives a special set of props and returns JSX. We've implemented two type of Blocks: File Blocks and Folder Blocks. Their API is largely the same, receiving the following props:

```ts
interface BlockProps {
  block: {
    id: string;
    type: string;
    title: string;
    description: string;
    entry: string;
    extensions?: string[];
  };
  context: {
    path: string;
    file: string;
    repo: string;
    owner: string;
    sha: string;
  };
  metadata: any;

  // callback functions
  onUpdateMetadata: (
    newMetadata: any,
    path: string,
    block: Block,
    currentMetadata: any
  ) => void;
  onRequestUpdateContent: (newContent: string) => void;
  onRequestGitHubData: (type: string, config: any, id: string) => Promise<any>;
  onNavigateToPath: (path: string) => void;

  // if a File Block
  content: string;

  // if a Folder Block
  tree: {
    path?: string;
    mode?: string;
    type?: string;
    sha?: string;
    size?: number;
    url?: string;
  }[];
}
```

For simple use cases, the `content` (the content of the file) or `tree` (a list of the contained files & folders) prop will be the most useful, with info about the file or folder the user is looking at on the GitHub Blocks UI. But if you need additional context (such as the path to the file or the owner/repo in which the file lives), you can access it via the handy `context` prop.

`metadata` is a free-form prop that can be used to store arbitrary data about the file. It's up to you to decide what you want to store in this object: anywhere from definitions of data visualizations in a charts Block to annotations for a code Block. This is unique per file/folder per Block and stored within a [`.github/blocks/file/`](https://github.com/githubnext/blocks-tutorial/tree/main/.github/blocks) folder within the viewed repo. To update the metadata, you can call the `onUpdateMetadata` prop with the updated data, which creates a new commit on the repo.

A few caveats and callouts:

- You can use both third-party _and_ relative imports in your Block code! Simply put, feel free to install any dependencies from NPM, or import a local JS/CSS file and it should be included in the final bundle.
- Your Block entry file **must have the Block component as its default export**. If it does not, bad things will happen.

### Utility library for building custom blocks: @githunext/utils

To reduce the cognitive load associated with writing file and folder Block components, we've assembled a helper library called `@githunext/utils` that exposes interface definitions and a few helper functions. This list will undoubtedly change over time, so be sure to check out [the repository page](https://github.com/githubnext/utils) for more detail.

### Relevant repos

[Blocks examples](https://github.com/githubnext/blocks-examples)

Example blocks that we've built to showcase the API.

[Blocks template starter project](https://github.com/githubnext/blocks-template)

A template for creating your own custom Blocks.

[Blocks utility library](https://github.com/githubnext/utils)

To reduce the cognitive load associated with writing file and folder Block components, we've assembled a helper library called `@githunext/utils` that exposes interface definitions and a few helper functions. This list will undoubtedly change over time, so be sure to check out [the repository page](https://github.com/githubnext/utils) for more detail.

---

## GitHub Blocks Demo App

> 📣 Read this if you're part of the team creating the GitHub Blocks projects.

This repo contains the source code for a [prototype app](github-blocks.vercel.app/) that demos the GitHub Blocks project.

### Developing locally

To start working:

```bash
yarn      # install the deps
yarn dev  # start up the server
```

In the browser, you can choose the file on GitHub to view with url params:

```bash
owner  # the GitHub org
repo   # the GitHub repo
path   # the path to the file
```

You'll need a GitHub PAT to load data from the API. Add that to an .env.local file.

```
GITHUB_SECRET=X
GITHUB_ID=X
```

### Deploying to production

Just push to `main` and Vercel will handle the deployment.

### Syncing with example Blocks

To keep loading snappy, our example blocks are pulled in via a `preinstall` & `postinstall` script. To update the version of the examples that are pulled in:

1. Hop on to the [githubnext/blocks-examples](https://github.com/githubnext/blocks-examples) repo and push a new tag

```
git tag X.X.X
git push origin --tags
```

1. Wait for the action in that repo to end and generate a new release
2. Come back to this repo and update the version of the `githubnext/blocks-example` libary in `package.json`

```
yarn add @githubnext/blocks-examples@https://github.com/githubnext/blocks-examples.git#X.X.X
```

That's it! Upon building, the example blocks are synced to the `/blocks` folder (which is completely auto-generated), along with an `index.js` file that exports the blocks and an `index.css` file that exports the styles.
