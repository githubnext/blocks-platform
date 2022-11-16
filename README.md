# GitHub Blocks

> 📣 Read this if you're part of the team creating the GitHub Blocks projects.

This repo contains the source code for a [prototype app](https://blocks.githubnext.com/) that demos the GitHub Blocks project.

## Developing locally

This app uses a GitHub App to authenticate users and access resources on GitHub, with help from the [NextAuth](https://next-auth.js.org/) package. You'll need to create a GitHub App app and provide the required environment variables in the `.env.local` file.

Visit [Register new GitHub App](https://github.com/settings/apps/new) to set up a new app and provide the following information in the form fields:

- "GitHub App name": a name to uniquely identify your app
- "Homepage URL": http://localhost:3000/
- "Callback URL": http://localhost/api/auth/callback/github
- "Request user authorization (OAuth) during installation": checked
- "Webhook" / "Active": unchecked
- "Repository permissions":
  - "Administration": Read-only
  - "Contents": Read and write
  - "Pull requests": Read and write
- "Where can this GitHub App be installed?": Any account

After creating the app:

- "Generate a new client secret" and copy it to `.env.local` (see below)
- "Generate a private key" and copy it to `.env.local` (see below)

Now fill in `.env.local` as follows:

```
GITHUB_ID="..." # your app's "Client ID"
GITHUB_PRIVATE_KEY="""
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
""" # the contents of the private key file
GITHUB_SECRET="..." # your app's "Client secret"
GITHUB_APP_SLUG="..." # the last path segment of the "Public link"
NEXTAUTH_SECRET="secret"
NEXTAUTH_URL="http://localhost:3000"
# if you're running the sandbox app locally
NEXT_PUBLIC_SANDBOX_DOMAIN=http://localhost:3001
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

## Deploying to staging

Handled automatically by our GitHub action.

Our staging site is [HERE](https://githubnext-blocks-staging.azurewebsites.net/githubnext/blocks-tutorial?path=README.md).

## Deploy to production

1. Navigate to the azure project for [`githubnext-blocks/staging`](https://portal.azure.com/#@githubazure.onmicrosoft.com/resource/subscriptions/b394e68d-7472-42fd-bb1c-d73cb7f4fd3c/resourceGroups/githubnext-blocks-rg/providers/Microsoft.Web/sites/githubnext-blocks/slots/staging/appServices)
2. Click "Swap" button
3. Then swap" again on the sidebar

## Updating Stars List

Occasionally we'll need to update the list of GitHub Stars. To make this easier, I've added a script to package.json `stars:update` which fetches the list of stars from `https://api-stars.github.com/` and writes them to a file on disk, `stars.json`.
