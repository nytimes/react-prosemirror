module.exports = {
  // Run ESLint and Prettier on typescript, javascript, and json
  // files. lint-staged automatically adds any updated files
  // to git, so it's safe to use `--fix` and `--write` flags,
  // which change source files.
  "*.{ts,js,json}": ["eslint --cache --fix", "prettier --write"],
  // If typescript files or json files (Typescript statically types .json
  // files, and package.json and tsconfig.json files can change type
  // correctness) change, we run tsc on the whole project. We use
  // incremental: true in our tsconfig, so this isn't very expensive if
  // only a few files have changed.
  //
  // Note that we use the function configuration option here, instead of
  // just a string or array of strings. lint-staged calls this function
  // with an array of filenames and expects us to produce an entire command
  // (including filename arguments). Since we just want to run check:types
  // on the whole project, not some specific files, we ignore this file list.
  "*.{ts,json}": () => "yarn check:types",
  // For markdown, HTML, and YAML files, we just run Prettier. ESLint doesn't have
  // anything to say about these.
  "*.{md,yml,html}": "prettier --write",
  "README.md": () => "yarn fix:toc",
};
