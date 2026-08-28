# analyse

A browser-based dashboard for exploring webpack bundle statistics. It reads a webpack stats JSON file and visualizes modules, chunks, assets, warnings, errors, and optimization hints so you can understand bundle size and dependency structure.

This project is a lightweight front-end viewer for webpack output generated with `--profile --json`.

## Features

- Overview of build timing, module counts, chunk counts, and assets
- Module dependency graph and chunk relationships
- Asset and bundle size breakdowns
- Filter the module list and graph by name or regexp, or hide `node_modules`
- Sort any table of modules, chunks or assets by size, name or id
- Turn the graphs off, for builds too large to lay one out
- Warning and error inspection
- Hints for common optimization issues, including circular dependencies
- Upload a generated stats file directly in the app

## Requirements

- Node.js 24 (the current Active LTS, "Krypton") — pinned in [`.nvmrc`](.nvmrc)
- npm 11.x (ships with Node 24)
- A webpack project whose build can emit a stats JSON file
- Or Docker on its own, if you would rather not install Node at all — Docker
  Desktop on macOS and Windows, Docker Engine on Linux. See [Docker](#docker)

The Node version is enforced: `engines` in `package.json` requires `^24.20.0`,
and `engine-strict=true` in `.npmrc` makes npm abort the install on a mismatched
runtime. CI reads the same `.nvmrc`, so bumping that file and `engines.node`
together is all it takes to move versions.

## Quick start

1. Select the pinned Node version:

   ```bash
   nvm use
   ```

   Run `nvm install` first if you do not have it yet. Both commands read
   `.nvmrc`, so neither needs a version argument.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Generate a webpack stats file from your app or library:

   ```bash
   npx webpack --profile --json > stats.json
   ```

   If you are already running webpack in a project, this is the standard output format this tool expects.

4. Start the viewer locally:

   ```bash
   npm run dev
   ```

5. Open the local dev server in your browser and upload the generated `stats.json` file.

## Available scripts

```bash
npm run dev
```

Starts the webpack dev server for the analysis UI.

```bash
npm run build
```

Creates a production bundle for the app.

Deployment is automatic: every push to `master` builds the site and publishes it
to GitHub Pages via `.github/workflows/ci.yml`. Pull requests build but never
publish. There is no manual deploy step.

```bash
npm test
```

Runs the unit tests in [`test/`](test). They check the circular dependency
detection against [`app/pages/upload/example3.json`](app/pages/upload/example3.json),
a small hand-written stats file that covers every hint of the hints page and is
loadable in the app as the "hint test cases" example. CI runs this before the
build, so a failing test stops the run and nothing is deployed.

## Docker

The [`Dockerfile`](Dockerfile) builds two things from this repository: the
production site behind nginx, and the webpack dev server for working on the app.

These commands talk to a Docker daemon, so one has to be running first. On macOS
and Windows that means [Docker Desktop][docker-desktop] — installing it is not
enough, it has to be launched, or `docker build` fails with `Cannot connect to
the Docker daemon`. On Linux, Docker Engine with a running `docker` service does
the same job. Check with:

```bash
docker info
```

Serve the built site:

```bash
docker build -t webpack-analyse .
```

```bash
docker run --rm -p 8080:80 webpack-analyse
```

Then open <http://localhost:8080> and upload a `stats.json`. The file is read in
the browser and never reaches the container, so nothing needs to be mounted to
analyze a build. Node only exists in the build stage; the image that runs is
nginx serving the static `dist/`, with the content-hashed bundles marked
immutable and `index.html` and `web.js` marked `no-cache` so a redeploy is never
served half from cache.

Work on the app instead, with the source mounted and live rebuilds:

```bash
docker build -t webpack-analyse-dev --target dev .
```

```bash
docker run --rm -p 8080:8080 -v "$PWD:/app" -v /app/node_modules -e WATCHPACK_POLLING=true webpack-analyse-dev
```

Two details in that command are worth knowing. The bare `-v /app/node_modules`
keeps the dependencies that were installed inside the image, so the mount of the
host directory over `/app` cannot hide them or replace them with binaries built
for a different platform. `WATCHPACK_POLLING=true` makes webpack poll for
changes, because file system events from a bind mount do not reliably reach a
container on macOS or Windows; on Linux it can be dropped.

The image builds the site the same way the GitHub Pages deploy does, analytics
snippet included. For a self-hosted copy that should not report to webpack's
analytics property, build it without that flag:

```bash
docker build --build-arg WEBPACK_ENV="--env longTermCaching" -t webpack-analyse .
```

The Node version is pinned by the `NODE_VERSION` build argument, which tracks
[`.nvmrc`](.nvmrc) and `engines.node`. Because `engine-strict=true` is set in
`.npmrc`, a mismatch fails the install rather than building something untested.

[docker-desktop]: https://www.docker.com/products/docker-desktop/

## Reading the graphs

The module and chunk graphs carry their meaning in colour, size and direction.
Each one draws a legend underneath itself, and it says the same as this:

| What you see | What it means |
| --- | --- |
| Dot colour and radius | The size of the module or chunk, green for the smallest and red for the largest in the build |
| Arrow | Points from the module that requires to the module required, and from a parent chunk to the chunk it loads |
| Edge colour (module graph) | When the module the arrow points at finished building, cyan early through magenta late. Only with `--profile`; without it the edge takes the colour of the module it points at |
| Edge width | Thinner when many modules require the same module, and thinner again when that module is loaded from an async chunk. In the chunk graph, thicker when a chunk has many parents |
| Black, red, green (module graph) | With a module open: the module itself, what requires it, and what it requires. With a chunk open: the modules in the chunk, and the edges into and out of it |
| Grey | Everything outside the current selection |

A graph is only worth drawing while it can be read, and on a very large build
the force layout can take long enough to look like a hang. The control under
each graph turns it off and on, the choice is remembered in this browser, and
a build of more than 5000 modules or chunks starts with the graphs off. With
them off the graph is never built at all, so the rest of the app stays quick.

## Typical workflow

1. Build your application with webpack in profiling mode.
2. Save the output to `stats.json`.
3. Open the analyse app and load that file.
4. Inspect modules, chunks, and assets to find large bundles or suspicious dependency patterns.

## Notes

- The app expects the webpack stats JSON, not a raw asset bundle.
- For large projects, generate the file from the app you want to analyze and then upload it to the UI.
- If you want to publish the dashboard itself, use the production build and deploy script above.
