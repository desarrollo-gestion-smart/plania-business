const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

/**
 * Metro configuration for pnpm compatibility
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    ...defaultConfig.resolver,
    unstable_enableSymlinks: true,
    unstable_enablePackageExports: true,
    extraNodeModules: new Proxy(
      {},
      {
        get: (_target, name) =>
          path.join(__dirname, 'node_modules', String(name)),
      }
    ),
  },
};

module.exports = { ...defaultConfig, ...config };
