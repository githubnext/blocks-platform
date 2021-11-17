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
