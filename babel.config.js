// File: babel.config.js (Definitive Final Version)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // This is the full, correct configuration for our '@/' alias
      [
        'babel-plugin-module-resolver',
        {
          alias: {
            // This tells Babel that '@/' means 'src/'
            '@': './src',
          },
        },
      ],
      // This plugin is required by react-native-reanimated
      'react-native-reanimated/plugin',
    ],
  };
};