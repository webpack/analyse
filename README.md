# analyse

A browser-based dashboard for exploring webpack bundle statistics. It reads a webpack stats JSON file and visualizes modules, chunks, assets, warnings, errors, and optimization hints so you can understand bundle size and dependency structure.

This project is a lightweight front-end viewer for webpack output generated with `--profile --json`.

## Features

- Overview of build timing, module counts, chunk counts, and assets
- Module dependency graph and chunk relationships
- Asset and bundle size breakdowns
- Warning and error inspection
- Hints for common optimization issues
- Upload a generated stats file directly in the app

## Requirements

- Node.js and npm
- A webpack project whose build can emit a stats JSON file

## Quick start

1. Install dependencies:

   ```bash
   yarn install
   ```

2. Generate a webpack stats file from your app or library:

   ```bash
   npx webpack --profile --json > stats.json
   ```

   If you are already running webpack in a project, this is the standard output format this tool expects.

3. Start the viewer locally:

   ```bash
   yarn dev
   ```

4. Open the local dev server in your browser and upload the generated `stats.json` file.

## Available scripts

```bash
yarn dev
```

Starts the webpack dev server for the analysis UI.

```bash
yarn build
```

Creates a production bundle for the app.

```bash
yarn deploy
```

Builds the site and publishes it to GitHub Pages.

## Typical workflow

1. Build your application with webpack in profiling mode.
2. Save the output to `stats.json`.
3. Open the analyse app and load that file.
4. Inspect modules, chunks, and assets to find large bundles or suspicious dependency patterns.

## Notes

- The app expects the webpack stats JSON, not a raw asset bundle.
- For large projects, generate the file from the app you want to analyze and then upload it to the UI.
- If you want to publish the dashboard itself, use the production build and deploy script above.
