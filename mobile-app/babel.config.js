module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Unistyles 3 babel plugin: rewrites StyleSheet/ThemedComponent usage inside `root`.
      // Route files in src/app intentionally contain no styles, so `src` is the root needed.
      ['react-native-unistyles/plugin', { root: 'src' }],
    ],
  };
};
