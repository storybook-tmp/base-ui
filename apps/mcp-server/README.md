# @storybook-tmp/baseui-mcp

A self-contained Storybook MCP server for the Base UI design system: `@storybook/mcp`
bundled into a single Node CLI, with the Storybook build's MCP manifests baked into the
package. It exists so agentic reference experiments can serve the design-system MCP
locally (one private server per run) instead of depending on a shared hosted endpoint.

## Published previews

CI (`.github/workflows/storybook-mcp-preview.yml`) builds the Storybook and publishes
this package to [pkg.pr.new](https://pkg.pr.new) on every push to `research` and
`experiment/*` branches. Each branch's package contains that branch's manifests, a
branch-derived version (`0.0.0-<branch-slug>.<short-sha>`), and a `provenance.json`
recording the exact repo/branch/sha the manifests were built from.

Install URLs (long form; the package is not on npm):

```bash
# By commit sha (immutable — preferred for pinned experiment runs)
npm i https://pkg.pr.new/storybook-tmp/base-ui/@storybook-tmp/baseui-mcp@<sha>

# By branch name (mutable — resolves to the branch's latest published commit)
npm i https://pkg.pr.new/storybook-tmp/base-ui/@storybook-tmp/baseui-mcp@experiment/empty
```

The tarball is fully self-contained: extracting it and running `node package/dist/cli.js`
works without an `npm install`.

## Usage

```bash
baseui-mcp [--host 127.0.0.1] [--port 6006] [--manifests <dir>]
```

- `--manifests`: directory containing `components.json` (and optionally `docs.json`).
  Defaults to the package's baked `manifests/` directory. For split/ref manifests
  (`experimentalDocgenServer` builds), the referenced `services/` payloads are resolved
  from the sibling of the manifests directory.
- MCP endpoint: `http://<host>:<port>/mcp` (streamable HTTP).

## Local development

```bash
# Build the Storybook so there are manifests to serve
pnpm --filter base-ui-storybook build-storybook

# Serve them straight from apps/storybook/storybook-static
pnpm --filter @storybook-tmp/baseui-mcp dev

# Or the production bundle
pnpm --filter @storybook-tmp/baseui-mcp build
pnpm --filter @storybook-tmp/baseui-mcp serve
```

`pnpm --filter @storybook-tmp/baseui-mcp prepare-publish` reproduces what CI does before
packing: it copies the manifests into the package, writes `provenance.json`, stamps the
version, and lifts the `private` flag. It mutates `package.json` in place — never commit
its output.
