import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../docs/.vitepress/config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');

export function resolveInternalDocPath(baseDocsDir, routeLink) {
  if (!routeLink || typeof routeLink !== 'string') {
    return null;
  }
  if (/^https?:\/\//i.test(routeLink) || routeLink.startsWith('mailto:')) {
    return { external: true, exists: true, resolvedPath: null };
  }
  const cleanRoute = routeLink.split('#')[0].split('?')[0].trim();
  if (!cleanRoute.startsWith('/')) {
    return null;
  }
  if (cleanRoute === '/') {
    const indexMd = path.join(baseDocsDir, 'index.md');
    return { external: false, exists: fs.existsSync(indexMd), resolvedPath: indexMd };
  }
  const rel = cleanRoute.replace(/^\/+/, '').replace(/\/+$/, '');
  const directMd = path.join(baseDocsDir, `${rel}.md`);
  if (fs.existsSync(directMd)) {
    return { external: false, exists: true, resolvedPath: directMd };
  }
  const nestedIndexMd = path.join(baseDocsDir, rel, 'index.md');
  return { external: false, exists: fs.existsSync(nestedIndexMd), resolvedPath: nestedIndexMd };
}

function collectMarkdownFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.vitepress' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

test('VitePress config navigation and sidebar links resolve to existing markdown files', () => {
  const navLinks = config.themeConfig?.nav ?? [];
  assert.ok(navLinks.length > 0, 'Expected themeConfig.nav to have items');

  for (const item of navLinks) {
    const res = resolveInternalDocPath(docsDir, item.link);
    assert.ok(res?.exists, `Nav link "${item.link}" (${item.text}) does not resolve to an existing file`);
  }

  const sidebarGroups = config.themeConfig?.sidebar ?? [];
  assert.ok(sidebarGroups.length > 0, 'Expected themeConfig.sidebar to have groups');

  for (const group of sidebarGroups) {
    for (const item of group.items ?? []) {
      const res = resolveInternalDocPath(docsDir, item.link);
      assert.ok(res?.exists, `Sidebar link "${item.link}" (${item.text}) does not resolve to an existing file`);
    }
  }
});

test('All frontmatter links and markdown links across docs resolve without dead links', () => {
  const mdFiles = collectMarkdownFiles(docsDir);
  assert.ok(mdFiles.length >= 5, 'Expected at least 5 markdown files in docs/');

  for (const file of mdFiles) {
    const content = fs.readFileSync(file, 'utf8');

    // Frontmatter link: /... entries
    for (const match of content.matchAll(/^\s*link:\s*([^\s#]+.*)$/gm)) {
      const linkVal = match[1].trim().replace(/^['"]|['"]$/g, '');
      if (linkVal.startsWith('/')) {
        const res = resolveInternalDocPath(docsDir, linkVal);
        assert.ok(res?.exists, `Broken frontmatter link "${linkVal}" in ${path.relative(rootDir, file)}`);
      }
    }

    // Markdown inline links [text](/route)
    for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const href = match[1].trim();
      if (href.startsWith('/')) {
        const res = resolveInternalDocPath(docsDir, href);
        assert.ok(res?.exists, `Broken markdown link "${href}" in ${path.relative(rootDir, file)}`);
      }
    }
  }
});

test('resolveInternalDocPath handles edge cases (empty, external, anchors, missing routes)', () => {
  assert.equal(resolveInternalDocPath(docsDir, ''), null);
  assert.equal(resolveInternalDocPath(docsDir, null), null);
  assert.equal(resolveInternalDocPath(docsDir, 'relative/path'), null);
  assert.deepEqual(resolveInternalDocPath(docsDir, 'https://github.com/Eccys/nahw-docs'), {
    external: true,
    exists: true,
    resolvedPath: null
  });
  assert.equal(resolveInternalDocPath(docsDir, '/guide/getting-started#core-curriculum-path')?.exists, true);
  assert.equal(resolveInternalDocPath(docsDir, '/guide/non-existent-page')?.exists, false);
});

test('.gitignore excludes VitePress dist, cache, and node_modules artifacts', () => {
  const gitignore = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf8');
  assert.match(gitignore, /node_modules\//);
  assert.match(gitignore, /docs\/\.vitepress\/dist\//);
  assert.match(gitignore, /docs\/\.vitepress\/cache\//);
});
