# Phlex.fun

The documentation site for [Phlex](https://github.com/yippee-fun/phlex), built with [VitePress](https://vitepress.dev).

The docs describe the latest released versions of `phlex` and `phlex-rails`, not the `main` branches.

## Contributing

You may need to [install bun](https://bun.sh/docs/installation) to run this project. Once bun is installed:

- `cd` into the project directory
- Run `bun install`
- Run `bun run docs:dev`
- Navigate to `http://localhost:5173/` in your browser
- Now you can make changes to the markdown files and when you save, the browser will automatically reload with the changes

New pages need an entry in the sidebar in `.vitepress/config.mts`.

## Checks

CI runs a spellcheck and a build on every pull request. To run them locally:

- `bun run spellcheck` — add legitimate new words to `project-words.txt`
- `bun run docs:build`
