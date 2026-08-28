# analyse

A browser-based dashboard for exploring webpack bundle statistics. It reads a webpack stats JSON file and visualizes modules, chunks, assets, warnings, errors, and optimization hints so you can understand bundle size and dependency structure.

This project is a lightweight front-end viewer for webpack output generated with `--profile --json`.

## Features

- Overview of build timing, module counts, chunk counts, and assets
- Module dependency graph and chunk relationships
- Asset and bundle size breakdowns
- Warning and error inspection
- Hints for common optimization issues, including circular dependencies
- Upload a generated stats file directly in the app

## Requirements

- Node.js 24 (the current Active LTS, "Krypton") — pinned in [`.nvmrc`](.nvmrc)
- npm 11.x (ships with Node 24)
- A webpack project whose build can emit a stats JSON file

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

## Typical workflow

1. Build your application with webpack in profiling mode.
2. Save the output to `stats.json`.
3. Open the analyse app and load that file.
4. Inspect modules, chunks, and assets to find large bundles or suspicious dependency patterns.

## Notes

- The app expects the webpack stats JSON, not a raw asset bundle.
- For large projects, generate the file from the app you want to analyze and then upload it to the UI.
- If you want to publish the dashboard itself, use the production build and deploy script above.
