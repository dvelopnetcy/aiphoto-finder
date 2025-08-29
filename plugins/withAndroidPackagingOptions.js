// File: plugins/withAndroidPackagingOptions.js (The Final, Definitive Version)

const { withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

// This function modifies the root build.gradle to specify the correct Android Gradle Plugin version.
function withAndroidGradlePluginVersion(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      // Find the line that specifies the classpath and replace the version.
      config.modResults.contents = config.modResults.contents.replace(
        /classpath\(["']com\.android\.tools\.build:gradle:.*?["']\)/,
        "classpath('com.android.tools.build:gradle:8.3.2')"
      );
    } else {
      throw new Error("Cannot modify an unexpected build.gradle language.");
    }
    return config;
  });
}

// This function modifies the app's build.gradle to handle native library conflicts.
function withPackagingOptions(config) {
  return withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    
    const packagingOptions = `
    packagingOptions {
        pickFirst 'lib/arm64-v8a/libc++_shared.so'
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
        pickFirst 'lib/x86/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'
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
}

// We chain the plugins together. Expo will run them in order.
module.exports = (config) => {
  config = withAndroidGradlePluginVersion(config);
  config = withPackagingOptions(config);
  return config;
};