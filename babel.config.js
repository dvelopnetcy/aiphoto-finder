// File: babel.config.js (Hardened Version)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'babel-plugin-module-resolver',
        {
          alias: { '@': './src' },
        },
      ],
      // CRITICAL: react-native-reanimated/plugin must be the last plugin.
      'react-native-reanimated/plugin',
    ],
  };
};