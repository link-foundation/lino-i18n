#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const jsRoot = resolve(scriptDir, '..');
const repoRoot = resolve(jsRoot, '..');
const siteRoot = resolve(jsRoot, 'site');

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function readMarkdown(path) {
  return escapeHtml(readFileSync(path, 'utf8'));
}

function page(title, sections) {
  const nav = sections
    .map(
      (section) => `<a href="#${section.id}">${escapeHtml(section.title)}</a>`
    )
    .join('');
  const body = sections
    .map(
      (section) => `
        <section id="${section.id}">
          <h2>${escapeHtml(section.title)}</h2>
          <pre>${section.markdown}</pre>
        </section>`
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.55;
      }
      body {
        margin: 0;
        color: #1d2430;
        background: #f7f8fb;
      }
      header {
        padding: 32px clamp(20px, 5vw, 64px);
        background: #ffffff;
        border-bottom: 1px solid #d9dee8;
      }
      main {
        max-width: 1120px;
        margin: 0 auto;
        padding: 24px clamp(16px, 4vw, 40px) 56px;
      }
      nav {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 16px;
      }
      nav a {
        color: #175ca8;
        text-decoration: none;
        font-weight: 650;
      }
      section {
        margin-top: 28px;
      }
      pre {
        overflow-x: auto;
        white-space: pre-wrap;
        padding: 20px;
        background: #ffffff;
        border: 1px solid #d9dee8;
        border-radius: 8px;
      }
      @media (prefers-color-scheme: dark) {
        body {
          color: #edf1f7;
          background: #10141b;
        }
        header,
        pre {
          background: #171d26;
          border-color: #313a48;
        }
        nav a {
          color: #8bc3ff;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>${escapeHtml(title)}</h1>
      <p>Generated documentation for the JavaScript package and shared repository docs.</p>
      <nav>${nav}</nav>
    </header>
    <main>${body}</main>
  </body>
</html>
`;
}

mkdirSync(siteRoot, { recursive: true });

writeFileSync(
  resolve(siteRoot, 'index.html'),
  page('lino-i18n JavaScript Docs', [
    {
      id: 'package',
      title: 'JavaScript Package',
      markdown: readMarkdown(resolve(jsRoot, 'README.md')),
    },
    {
      id: 'root',
      title: 'Repository Overview',
      markdown: readMarkdown(resolve(repoRoot, 'README.md')),
    },
    {
      id: 'changelog',
      title: 'Changelog',
      markdown: readMarkdown(resolve(jsRoot, 'CHANGELOG.md')),
    },
  ])
);

console.log(`Generated JavaScript docs site at ${siteRoot}`);
