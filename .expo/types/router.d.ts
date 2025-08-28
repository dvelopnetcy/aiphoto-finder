/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(modals)` | `/(modals)/about` | `/(modals)/help` | `/(modals)/photo-viewer` | `/(modals)/plans` | `/(modals)/settings` | `/(onboarding)` | `/(onboarding)/` | `/(onboarding)/analyze` | `/(tabs)` | `/(tabs)/folders` | `/(tabs)/profile` | `/(tabs)/recent` | `/(tabs)/search` | `/_sitemap` | `/about` | `/analyze` | `/folders` | `/help` | `/photo-viewer` | `/plans` | `/profile` | `/recent` | `/search` | `/settings`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
