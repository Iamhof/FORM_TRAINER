// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix: react/jsx-runtime entry file branches on process.env.NODE_ENV
// which fails in EAS production Hermes bundles. Resolve directly to
// the production CJS file to bypass the broken branching.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react/jsx-runtime') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/react/cjs/react-jsx-runtime.production.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'react/jsx-dev-runtime') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/react/cjs/react-jsx-dev-runtime.development.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
