import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';
import { messageVariables } from './message-schema.js';

function validateOptions(source, { maxBytes, maxVariants, timeout }) {
  if (
    typeof source !== 'string' ||
    !Number.isInteger(maxBytes) ||
    maxBytes < 1 ||
    maxBytes > 10 * 1024 * 1024
  ) {
    throw new TypeError(
      'Python source requires a string and a byte limit from 1 to 10 MiB'
    );
  }
  if (Buffer.byteLength(source) > maxBytes) {
    throw new Error(`Python source exceeds ${maxBytes} bytes`);
  }
  if (
    !Number.isInteger(maxVariants) ||
    maxVariants < 1 ||
    maxVariants > 1000 ||
    !Number.isInteger(timeout) ||
    timeout < 1 ||
    timeout > 60000
  ) {
    throw new TypeError(
      'Python extraction requires 1–1000 variants and a timeout from 1–60000 ms'
    );
  }
}

export async function extractPythonMessages(
  source,
  {
    file = '<source.py>',
    python = process.platform === 'win32' ? 'python' : 'python3',
    maxBytes = 1024 * 1024,
    maxVariants = 100,
    timeout = 30000,
  } = {}
) {
  validateOptions(source, { maxBytes, maxVariants, timeout });
  const manifest = await new Promise((resolve, reject) => {
    const child = execFile(
      python,
      ['-I', fileURLToPath(new URL('./python-extract.py', import.meta.url))],
      {
        timeout,
        maxBuffer: 4 * 1024 * 1024,
        encoding: 'utf8',
      },
      (error, stdout) => {
        if (error) {
          reject(
            new Error(`Python 3.11+ extraction failed: ${error.message}`, {
              cause: error,
            })
          );
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch (cause) {
          reject(new Error('Invalid Python extraction result', { cause }));
        }
      }
    );
    child.stdin.on('error', () => {}); // The process callback reports an early exit.
    child.stdin.end(JSON.stringify({ source, file, maxVariants }));
  });
  manifest.messages = manifest.messages.filter((message) => {
    try {
      message.variables = messageVariables(message.source);
      return true;
    } catch (error) {
      manifest.diagnostics.push({
        file,
        line: message.line,
        message: error.message,
      });
      return false;
    }
  });
  return manifest;
}

export async function extractPythonProject(sources, options = {}) {
  const { projectLimits } = await import('./extract-project.js');
  const limits = projectLimits(options);
  const entries = Object.entries(sources);
  if (
    entries.length > limits.maxFiles ||
    entries.some(([, code]) => typeof code !== 'string')
  ) {
    throw new Error(
      'Python project requires source strings within the file limit'
    );
  }
  if (
    entries.reduce((bytes, [, code]) => bytes + Buffer.byteLength(code), 0) >
    limits.maxBytes
  ) {
    throw new Error('Python project byte limit exceeded');
  }
  const messages = new Map();
  const diagnostics = [];
  for (const [file, source] of entries.sort(([a], [b]) => a.localeCompare(b))) {
    const result = await extractPythonMessages(source, {
      ...options,
      file,
      maxBytes: Math.min(limits.maxBytes, 1024 * 1024),
    });
    diagnostics.push(...result.diagnostics);
    for (const message of result.messages) {
      const previous = messages.get(message.id);
      if (previous && previous.source !== message.source) {
        diagnostics.push({
          file,
          line: message.line,
          message: `Conflicting source messages for id ${message.id}`,
        });
      } else {
        messages.set(message.id, previous || message);
      }
    }
  }
  return {
    version: 1,
    messages: [...messages.values()].sort((a, b) => a.id.localeCompare(b.id)),
    diagnostics,
  };
}
