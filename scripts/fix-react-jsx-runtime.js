/* eslint-env node */
/* eslint-disable no-console */
/**
 * Postinstall script: patches react/jsx-runtime.js to remove the
 * process.env.NODE_ENV conditional that fails in EAS Hermes production bundles.
 *
 * The automatic JSX transform uses react/jsx-dev-runtime in dev and
 * react/jsx-runtime in production, so always loading the production CJS
 * file here is correct and safe.
 */
const fs = require('fs');
const path = require('path');

const jsxRuntimePath = path.resolve(
  process.cwd(),
  'node_modules',
  'react',
  'jsx-runtime.js'
);

if (!fs.existsSync(jsxRuntimePath)) {
  console.log('[postinstall] react/jsx-runtime.js not found, skipping patch');
  process.exit(0);
}

const current = fs.readFileSync(jsxRuntimePath, 'utf8');

// Guard: only patch if the file still has the conditional require
if (!current.includes('process.env.NODE_ENV')) {
  console.log('[postinstall] react/jsx-runtime.js already patched, skipping');
  process.exit(0);
}

const patched = `'use strict';

// Patched by scripts/fix-react-jsx-runtime.js
// Removes process.env.NODE_ENV conditional that fails in EAS Hermes bundles
module.exports = require('./cjs/react-jsx-runtime.production.js');
`;

fs.writeFileSync(jsxRuntimePath, patched);
console.log('[postinstall] Patched react/jsx-runtime.js → production CJS (bypasses process.env.NODE_ENV)');
