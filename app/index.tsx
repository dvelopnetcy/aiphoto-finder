// File: app/index.tsx (Final, Simplified Version)

import { Redirect } from 'expo-router';

export default function RootIndex() {
  // This component's logic is now handled by the main app/_layout.tsx.
  // The root layout is the "traffic cop" that decides whether to show
  // onboarding or the main app, and it does so without any UI flicker.
  // This file now simply acts as a clean entry point that hands off control.
  return <Redirect href="/(onboarding)" />;
}