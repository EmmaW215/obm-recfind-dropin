// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Optimize file watching to prevent EMFILE errors
// Only watch the mobile directory, not the entire project
config.watchFolders = [__dirname];

// Block watching unnecessary directories (but allow nested node_modules for react-native)
config.resolver = {
  ...config.resolver,
  blockList: [
    // Block backend directory
    /.*\/backend\/.*/,
    // Block other unnecessary directories
    /.*\/\.git\/.*/,
    /.*\/\.idea\/.*/,
    /.*\/\.vscode\/.*/,
    // Note: Do NOT block nested node_modules - React Native needs them
  ],
};

// Note: Metro automatically uses watchman if available

module.exports = config;

