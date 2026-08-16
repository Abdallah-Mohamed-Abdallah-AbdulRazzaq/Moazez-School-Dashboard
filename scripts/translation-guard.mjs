#!/usr/bin/env node
/*
  Translation Guard for Next.js + next-intl projects.

  Checks:
  1. Message key parity between Arabic and English JSON files.
  2. Potential hardcoded user-facing strings in TSX/JSX files.

  Usage:
    node scripts/translation-guard.mjs
    node scripts/translation-guard.mjs --messages src/messages --src src
*/

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const root = process.cwd();
const messagesDir = path.resolve(root, getArg('messages', 'src/messages'));
const srcDir = path.resolve(root, getArg('src', 'src'));
const locales = ['ar', 'en'];

const allowedStringPatterns = [
  /^$/, // empty
  /^[a-zA-Z0-9_.:/?&=#%{}\-\[\](), ]+$/, // technical-ish, routes, keys, ids
  /^#[a-fA-F0-9]{3,8}$/,
  /^https?:\/\//,
  /^\/[a-zA-Z0-9_./:[\]-]*$/,
  /^[A-Z0-9_]+$/,
];

const userFacingAttributeNames = new Set([
  'title',
  'placeholder',
  'aria-label',
  'alt',
  'label',
  'description',
]);

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Could not read JSON file: ${filePath}\n${error.message}`);
  }
}

function flattenKeys(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, nested]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return flattenKeys(nested, next);
    }
    return [next];
  });
}

function walkFiles(dir, extensions, ignored = new Set(['node_modules', '.next', 'dist', 'build', 'coverage'])) {
  if (!fs.existsSync(dir)) return [];

  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      output.push(...walkFiles(fullPath, extensions, ignored));
      continue;
    }

    if (extensions.some((ext) => entry.name.endsWith(ext))) {
      output.push(fullPath);
    }
  }
  return output;
}

function isAllowedLiteral(text) {
  const trimmed = text.trim();
  if (trimmed.length < 2) return true;
  if (allowedStringPatterns.some((pattern) => pattern.test(trimmed))) return true;
  if (!/[A-Za-z\u0600-\u06FF]/.test(trimmed)) return true;
  return false;
}

function findHardcodedText(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const findings = [];
  const lines = source.split(/\r?\n/);
  const isExampleFile = filePath.toLowerCase().includes('example.tsx') || filePath.toLowerCase().includes('example.jsx');

  if (isExampleFile) {
    return [];
  }

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('*') ||
      trimmed.includes('console.') ||
      trimmed.includes('data-testid') ||
      trimmed.includes('className=') ||
      trimmed.includes('import ') ||
      trimmed.includes('Promise<') ||
      trimmed.includes('Record<') ||
      trimmed.includes('typeof ') ||
      trimmed.includes('&bull;') ||
      trimmed.includes('void ')
    ) {
      return;
    }

    if (trimmed.includes('=>') && !/<[A-Za-z][\w.-]*(\s|>|\/)/.test(trimmed)) {
      return;
    }

    // JSX text between tags: <Button>Save</Button>
    const jsxTextMatches = [...line.matchAll(/>([^<>{}][^<>{}]*)</g)];
    for (const match of jsxTextMatches) {
      const text = match[1].replace(/\s+/g, ' ').trim();
      if (text && !isAllowedLiteral(text)) {
        findings.push({ lineNumber, text, reason: 'JSX text node' });
      }
    }

    // User-facing attributes: placeholder="Search students"
    const attrMatches = [...line.matchAll(/([a-zA-Z-]+)=["']([^"']+)["']/g)];
    for (const match of attrMatches) {
      const [, attrName, text] = match;
      if (userFacingAttributeNames.has(attrName) && !isAllowedLiteral(text)) {
        findings.push({ lineNumber, text, reason: `user-facing attribute: ${attrName}` });
      }
    }
  });

  return findings;
}

function checkMessageParity() {
  const files = Object.fromEntries(
    locales.map((locale) => [locale, path.join(messagesDir, `${locale}.json`)]),
  );

  const missingFiles = Object.values(files).filter((file) => !fs.existsSync(file));
  if (missingFiles.length > 0) {
    return {
      ok: false,
      errors: missingFiles.map((file) => `Missing message file: ${path.relative(root, file)}`),
    };
  }

  const keysByLocale = Object.fromEntries(
    locales.map((locale) => [locale, new Set(flattenKeys(readJson(files[locale])))]),
  );

  const allKeys = new Set([...keysByLocale.ar, ...keysByLocale.en]);
  const errors = [];

  for (const key of [...allKeys].sort()) {
    for (const locale of locales) {
      if (!keysByLocale[locale].has(key)) {
        errors.push(`Missing ${locale} translation key: ${key}`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

function main() {
  const parity = checkMessageParity();
  const uiFiles = walkFiles(srcDir, ['.tsx', '.jsx']);
  const textFindings = [];

  for (const file of uiFiles) {
    const findings = findHardcodedText(file);
    for (const finding of findings) {
      textFindings.push({ file, ...finding });
    }
  }

  const hasErrors = !parity.ok || textFindings.length > 0;

  if (!hasErrors) {
    console.log('✅ Translation guard passed.');
    return;
  }

  console.error('\n❌ Translation guard failed.\n');

  if (!parity.ok) {
    console.error('Message key parity issues:');
    for (const error of parity.errors) {
      console.error(`  - ${error}`);
    }
    console.error('');
  }

  if (textFindings.length > 0) {
    console.error('Potential hardcoded user-facing strings:');
    for (const finding of textFindings) {
      console.error(
        `  - ${path.relative(root, finding.file)}:${finding.lineNumber} [${finding.reason}] "${finding.text}"`,
      );
    }
    console.error('');
  }

  process.exit(1);
}

main();
