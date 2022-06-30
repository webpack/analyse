# Change log

## 0.1.0 (2022-06-30)
- chore: update devDependencies to latest versions
- chore: update webpack 5 beta to v5.73
- chore: update imports-loader to v4.0 and update usage in code
- chore: remove needless Gruntfile.js, because all same commands do webpack 5 via package.json
- fix: issue when used "webpack 5 test cases", on Hints page occurs the TypeError: splittedModule is undefined
- refactor: replace legacy pug-loader that gives install errors with modern pug-plugin
- refactor: optimize webpack.config.js for local dev and build
- docs: update readme
- docs: add CHANGELOG.md

## 0.0.0 (2020-01-03)
- fix: latest previous commit, without changelog, is [webpack 5 stats fixes](https://github.com/webpack/analyse/commit/9637830d718935841bc2539e5741c1b617f8ea08)