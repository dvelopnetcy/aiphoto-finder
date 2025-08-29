// babel.config.js
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
      // ΠΡΕΠΕΙ να είναι το τελευταίο:
      'react-native-reanimated/plugin',
    ],
  };
};
