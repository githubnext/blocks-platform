# Composable GitHub

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

To debug different viewers, you can use a few query params:

```bash
debug           # to add the viewer picker to the top
viewerOverride  # to specify a specific viewer on lolad
```

For example:
http://localhost:3000/?owner=githubnext&repo=composable-github-test&path=data.csv&debug=true&viewerOverride=flat

You'll need a GitHub PAT to load data from the API. Add that to an .env.local file.

```
GITHUB_SECRET=X
GITHUB_ID=X
```
