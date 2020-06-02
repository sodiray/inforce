# :cop: Inforcer
A simple function based test runner. Its not BDD. Does not include an assertion library - only a test collector and test runner.

## :package: Install
`npm install inforcer`  
or  
`yarn add inforcer`

## :wrench: Usage
Add as an npm script in `package.json`.
```
"scripts": {
  "test": "inforcer",
  "test-example": "inforcer  --targetPath ./example.test.js",
  "test-verbose": inforcer --level verbose
}
```

### :abacus: Options
Check out the main function's params/defaults [here](https://github.com/rayepps/inforcer/blob/6d400c01f1cddcf122b069ba6e0b29c1fa337af5/index.js#L10).

#### --targetPath
The relative path to search for tests. Can be directory or file. Deafults to `./src`.

#### --testFileRegex
The pattern to use when filtering test files. Defaults to `.*\.test\.js`.

#### -- testFnRegex
The pattern to use when filtering exported functions from test modules. Defaults to `^test.*`. If you want to execute all functions exported from a test module -- so you don't have to name test functions with `test` -- set this to something like `.+`.

#### --level
The log level to use.
- slient: log nothing
- default: log enough for normal dev use (default)
- verbose: log lots. helpful for debugging test collection/running not working as you expect
- debug: log everything. helpful for debugging issues with the inforcer project

## Example Output
<img width="1060" alt="Test output example" src="https://user-images.githubusercontent.com/15269623/83482718-37e72e00-a45e-11ea-8026-004de2eb148c.png">

## Example Test File
See [example.test.js](https://github.com/rayepps/inforcer/blob/master/example.test.js)
