#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
import { getJsRoot, parseJsRootConfig } from './js-paths.mjs';
import { readPackageInfo } from './package-info.mjs';
import { isPackageVersionPublished } from './npm-registry.mjs';
import { publishWithRetry } from './publish-retry.mjs';
import { runCommand } from './run-command.mjs';

function setOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  }
}

try {
  // Versioning already synchronized a clean, validated checkout. Pulling here
  // could silently publish source that did not pass this run's checks.
  const jsRoot = getJsRoot({ jsRoot: parseJsRootConfig() });
  const { name, version } = readPackageInfo({ jsRoot });
  const verify = () => isPackageVersionPublished(name, version);
  if (!(await verify())) {
    const result = await publishWithRetry({
      publish: async () => {
        const command = await runCommand('npm', ['run', 'changeset:publish'], {
          cwd: jsRoot,
        });
        const output = `${command.stdout}\n${command.stderr}`;
        const failed =
          command.code !== 0 ||
          /(?:error (?:while|when) publishing|failed to publish|npm error)/i.test(
            output
          );
        const error = failed
          ? new Error(`npm publish failed (exit ${command.code}): ${output}`)
          : null;
        if (error) {
          error.nonRetryable =
            /(?:E40[134]|ENEEDAUTH|authentication|access token expired)/i.test(
              output
            );
        }
        return { success: !failed, output, error };
      },
      verify,
      log: console.log,
    });
    if (!result.success) {
      throw result.error;
    }
  }
  console.log(`${name}@${version} is publicly available on npm.`);
  setOutput('published_version', version);
  setOutput('published', 'true');
} catch (error) {
  console.error(`::error::${error.message}`);
  process.exitCode = 1;
}
