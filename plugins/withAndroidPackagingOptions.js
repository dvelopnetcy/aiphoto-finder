// File: plugins/withAndroidPackagingOptions.js (The Final, Complete Version)

const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidPackagingOptions(config) {
  return withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    
    // These are the complete, definitive instructions for the "Foreman" (Gradle)
    const packagingOptions = `
    packagingOptions {
        // This rule handles the C++ library conflict
        pickFirst 'lib/arm64-v8a/libc++_shared.so'
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
        pickFirst 'lib/x86/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'

        // This new rule handles the ONNX Runtime library conflict
        pickFirst 'lib/arm64-v8a/libonnxruntime.so'
        pickFirst 'lib/armeabi-v7a/libonnxruntime.so'
        pickFirst 'lib/x86/libonnxruntime.so'
        pickFirst 'lib/x86_64/libonnxruntime.so'
    }
    `;

    if (!buildGradle.includes('pickFirst')) {
      config.modResults.contents = buildGradle.replace(
        /android\s*{/,
        `android {
${packagingOptions}`
      );
    }

    return config;
  });
};