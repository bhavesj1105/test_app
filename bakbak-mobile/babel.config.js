module.exports = function (api) {
  // Determine platform first, then set cache using a stable key to avoid conflicts
  const platform = api.caller((caller) => (caller && caller.platform) || 'native');
  api.cache(() => platform);
  const isWeb = platform === 'web';

  let preset = null;
  try {
    // Prefer Expo's preset when available
    preset = require.resolve('babel-preset-expo');
  } catch (e) {
    try {
      // Fallback to React Native's preset if Expo preset isn't installed
      preset = require.resolve('@react-native/babel-preset');
    } catch (e2) {
      // As a last resort, leave presets empty to avoid hard crashes
      preset = null;
    }
  }

  return {
    presets: preset ? [preset] : [],
    plugins: [
  // Include NativeWind's Babel plugin for native platforms; skip on web to avoid PostCSS sync issues
  ...(isWeb ? [] : ['nativewind/babel']),
    ],
  };
};
