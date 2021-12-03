# GitHub Blocks 

👋 Hi friend!

## Working locally

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

## Syncing example Blocks

To keep loading snappy, our example blocks are pulled in via a `preinstall` & `postinstall` script. To update, push a new tag in the blocks-examples repo and bump the version number in [package.json:13](package.json:13).

Upon install, the example blocks are synced to the `/blocks` folder (which is completely auto-generated), along with an `index.js` file that exports the blocks and an `index.css` file that exports the styles.

Once you've updated a block example and pushed a new tag, you should change the tag number we're using for that repo in `package.json`:

`yarn add @githubnext/blocks-examples@https://github.com/githubnext/blocks-examples.git#0.6.21`
