import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tokenPath = path.join(root, 'design-system', 'tokens.json');
const tokens = JSON.parse(await readFile(tokenPath, 'utf8'));
const kebab = (name) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
const objectLines = (object, render = (value) => JSON.stringify(value)) =>
  Object.entries(object).map(([key, value]) => `  ${key}: ${render(value)},`).join('\n');

const mobileColors = objectLines(tokens.colors, (value) => `'${value}'`);
const spacing = objectLines(tokens.spacing, (value) => String(value));
const radius = objectLines(tokens.radius, (value) => String(value));
const fontStyles = Object.entries(tokens.font.styles).map(([name, style]) => {
  const fields = Object.entries(style).map(([key, value]) => {
    const rendered = key === 'color' ? `colors.${value}` : key === 'fontWeight' ? `'${value}' as const` : String(value);
    return `    ${key}: ${rendered},`;
  });
  return `  ${name}: {\n${fields.join('\n')}\n  },`;
}).join('\n');

const mobile = `/** Generated from design-system/tokens.json. Do not edit by hand. */
export const colors = {
${mobileColors}
};

export const spacing = {
${spacing}
};

export const radius = {
${radius}
};

export const font = {
  // The font is specified by the design system; the app uses the system fallback until bundled.
${fontStyles}
};
`;

const adminColors = { ...tokens.colors, ...tokens.platforms.admin.colors };
const cssTokens = [
  `  --font-sans: ${JSON.stringify(tokens.font.family)}, ${tokens.font.fallback.join(', ')};`,
  ...Object.entries(adminColors).map(([name, value]) => `  --color-${kebab(name)}: ${value.toLowerCase()};`),
].join('\n');
const adminCss = `/* Generated from design-system/tokens.json. Do not edit by hand. */
@theme {
${cssTokens}
}
`;

const outputs = new Map([
  [path.join(root, 'apps', 'mobile', 'src', 'theme.ts'), mobile],
  [path.join(root, 'apps', 'admin', 'src', 'theme-tokens.css'), adminCss],
]);
const checkOnly = process.argv.includes('--check');
let stale = false;
for (const [filePath, expected] of outputs) {
  let current = '';
  try {
    current = await readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (current === expected) {
    console.log(`Up to date: ${path.relative(root, filePath)}`);
  } else if (checkOnly) {
    console.error(`Out of date: ${path.relative(root, filePath)} (run node scripts/generate-design-tokens.mjs)`);
    stale = true;
  } else {
    await writeFile(filePath, expected, 'utf8');
    console.log(`Generated: ${path.relative(root, filePath)}`);
  }
}
if (stale) process.exitCode = 1;
