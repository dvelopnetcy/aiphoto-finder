import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Icon } from '@/components/ui/Icon';

export default function TabsLayout() {
  const { theme, isDarkMode } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ color }) => <Icon name="Search" color={color} /> }} />
      <Tabs.Screen name="folders" options={{ title: 'Folders', tabBarIcon: ({ color }) => <Icon name="Folder" color={color} /> }} />
      <Tabs.Screen name="recent" options={{ title: 'Recent', tabBarIcon: ({ color }) => <Icon name="Clock" color={color} /> }} />
      
      {/* --- ΑΥΤΗ ΕΙΝΑΙ Η ΔΙΟΡΘΩΣΗ --- */}
      {/* Το όνομα του Screen πρέπει να ταιριάζει με το όνομα του FOLDER */}
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Icon name="User" color={color} /> }} />
      {/* --- ΤΕΛΟΣ ΔΙΟΡΘΩΣΗΣ --- */}
    </Tabs>
  );
}