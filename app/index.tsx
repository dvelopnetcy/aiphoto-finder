import { Redirect } from 'expo-router';
import { useAppState } from '@/hooks/useAppState';

export default function AppEntry() {
  const { hasCompletedOnboarding } = useAppState();

  if (hasCompletedOnboarding) {
    return <Redirect href="/search" />;
  } else {
    return <Redirect href="/analyze" />; // ✅ no (onboarding) in the URL
  }
}
