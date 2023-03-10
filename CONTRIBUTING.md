## Project setup

This project is written in Typescript. It uses:

- [yarn](https://yarnpkg.com/) for package management
- [swc](https://swc.rs/docs/) to compile Typescript to Javascript,
- [tsc](https://www.typescriptlang.org/docs/handbook/compiler-options.html) to
  check type correctness and generate type declaration (`.d.ts`) files,
- [prettier](https://prettier.io/docs/en/index.html) for auto-formatting
- [eslint](https://eslint.org/docs/latest/) for static code analysis

We use
[conditional exports](https://nodejs.org/api/packages.html#conditional-exports)
to provide both ESM and CJS builds of the library, in addition to type
declarations.

All of the source code lives in `src/`.

## Local development

You must have Node.js v16.9 or higher installed on your development machine, as
well as Yarn v1. If you don't have Yarn installed, you can do so by running
`corepack enable`.

Run `yarn` or `yarn install` to install dependencies locally.

You can check type correctness, eslint validation, and formatting with
`yarn check`. You can auto-fix all automatically fixable issues with `yarn fix`.
And you can build output files with `yarn build`.

You can run tests with `yarn test`. If you want to run tests in "watch" mode,
use `yarn test -w`. See the [Jest CLI docs](https://jestjs.io/docs/cli) for more
information.

## Version management

We use yarn's "deferred versioning" release flow, documented
[here](https://yarnpkg.com/features/release-workflow#deferred-versioning). For
any change that affects source code files, developers will be asked at
`git push` time to use `yarn version check -i` to specify what kind of change
(`patch`, `minor`, or `major`) is contained within the release. This version
type will be documented in the form of a new YAML file added to the
`.yarn/versions` directory, which can be reviewed during code review.

Maintainers can then later use `yarn version apply --all` to aggregate the
proposed version bumps and apply them to the `package.json` file.
