# GitHub Blocks

> 📣 Read this if you're part of the team creating the GitHub Blocks projects.

This repo contains the source code for a [prototype app](https://blocks.githubnext.com/) that demos the GitHub Blocks project.

## Developing locally

You'll need some environment variables to get started.

This app uses GitHub OAuth to authenticate users, with help from the [NextAuth](https://next-auth.js.org/) package. You'll need to create an OAuth app and provide the required environment variables (app secret and app ID) to the `.env.local` file.

```
GITHUB_SECRET=X
GITHUB_ID=X
NEXT_PUBLIC_MARKETPLACE_URL="https://blocks-marketplace.githubnext.com"
```

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

## Deploying to production

Just push to `main` and Vercel will handle the deployment.

## Syncing with example Blocks

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

Note: this is why we have a list of `optionalDependencies`: to separate the example Blocks dependencies in order to refresh the list and not cache old deps.

Note: the `postinstall` script also copies the Excalidraw assets to the `/public/excalidraw` folder to prevent from pulling then in from the unpkg CDN.
