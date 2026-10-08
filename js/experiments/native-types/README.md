# Actual React Native type probe

This fixture passed against React Native 0.87.1 and React 19.3.0. Install that
optional framework in the JS workspace and run
`npx tsc --project experiments/native-types/tsconfig.json` to repeat it.
The adapter accepts an injected component and keeps its props; the standard
strict type suite verifies that inference without installing Metro. Runtime
tests and the browser example use real React Native Web 0.21.4 components.

This isolated probe excludes DOM globals, which conflict with React Native's
platform declarations. `skipLibCheck` applies only to this optional probe:
React Native 0.87.1 itself has incompatible generated declarations with the
installed React/TypeScript versions. The ordinary type suite does not use it.
