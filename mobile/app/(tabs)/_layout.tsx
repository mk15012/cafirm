import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '@/lib/store';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type TabIconProps = {
  color: string;
  focused: boolean;
};

export default function TabsLayout() {
  const { user } = useAuthStore();
  const isCA = user?.role === 'CA';
  const isManager = user?.role === 'MANAGER';
  const isIndividual = user?.role === 'INDIVIDUAL';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
      }}
    >
      {/* Home/Dashboard Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <MaterialCommunityIcons 
              name={focused ? 'home' : 'home-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* Tasks/Reminders Tab */}
      <Tabs.Screen
        name="tasks"
        options={{
          title: isIndividual ? 'Reminders' : 'Tasks',
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <MaterialCommunityIcons 
              name={focused ? 'clipboard-check' : 'clipboard-check-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* Clients Tab - Hidden for Individual users */}
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          href: isIndividual ? null : undefined,
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <MaterialCommunityIcons 
              name={focused ? 'domain' : 'domain'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* Firms Tab - For CA/Team users, Documents Tab - For Individual users */}
      <Tabs.Screen
        name="firms"
        options={{
          title: isIndividual ? 'Docs' : 'Firms',
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <MaterialCommunityIcons 
              name={isIndividual 
                ? (focused ? 'file-document' : 'file-document-outline')
                : (focused ? 'office-building' : 'office-building-outline')
              } 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* Documents Tab - Hidden, accessible from More */}
      <Tabs.Screen
        name="documents"
        options={{
          href: null, // Hide from tab bar, accessible from More
        }}
      />

      {/* Tools/More Tab */}
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <MaterialCommunityIcons 
              name={focused ? 'dots-horizontal' : 'dots-horizontal'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0f172a',
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabBarIcon: {
    marginBottom: -4,
  },
});

