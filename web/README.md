# Word Flashcard — Frontend

React + TypeScript frontend for Word Flashcard, built with [Vite](https://vite.dev/) and tested with [Vitest](https://vitest.dev/).

For the full project (backend, Docker deployment, environment configuration), see the [root README](../README.md).

## Available Scripts

In the `web/` directory, you can run:

### `npm start`

Runs the app in development mode with Vite's dev server (hot module replacement).\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm test`

Launches Vitest in interactive watch mode.

### `npm run test:ci`

Runs all tests once with a coverage report (used in CI).

### `npm run test:ctrf`

Runs all tests once with a coverage report and additionally generates a CTRF JSON report at `ctrf/ctrf-report.json` (used by the Frontend Unit Tests GitHub Actions workflow to post results on pull requests).

### `npm run build`

Builds the app for production into the `build` folder (not Vite's default `dist` — kept as `build` so the output matches what `docker/web/Dockerfile` expects).\
The build is minified and the filenames include content hashes.

### `npm run preview`

Serves the production build from the `build` folder locally, for a quick sanity check before deploying.

### `npm run lint` / `npm run lint:fix` / `npm run lint:check`

Run ESLint (includes Prettier and Tailwind CSS class checks). `lint:fix` applies automatic fixes; `lint:check` fails on any warning (used in CI).

### `npm run format` / `npm run format:check` / `npm run format:diff`

Pure Prettier commands for formatting-only operations, faster than the ESLint commands when you don't need code-quality checks.

## Environment Variables

Vite only exposes environment variables prefixed with `VITE_` to client code, read via `import.meta.env.VITE_*` (not `process.env`). See `.env.example` for the variables this app uses, and the root README's [Environment Configuration](../README.md#2-environment-configuration) section for setup instructions.

## Learn More

- [Vite documentation](https://vite.dev/guide/)
- [Vitest documentation](https://vitest.dev/guide/)
- [React documentation](https://react.dev/)
