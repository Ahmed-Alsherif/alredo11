import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

export default function SubscriberLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 66,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.roles.subscriber,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'بيتي', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="tracking" options={{ title: 'الشاحنة', tabBarIcon: ({ color, size }) => <Ionicons name="location" size={size} color={color} /> }} />
      <Tabs.Screen name="recycling" options={{ title: 'التدوير', tabBarIcon: ({ color, size }) => <Ionicons name="leaf" size={size} color={color} /> }} />
      <Tabs.Screen name="subscription" options={{ title: 'اشتراكي', tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} /> }} />
      <Tabs.Screen name="complaints" options={{ title: 'شكوى', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses" size={size} color={color} /> }} />
      <Tabs.Screen name="rating" options={{ title: 'تقييم', tabBarIcon: ({ color, size }) => <Ionicons name="star" size={size} color={color} /> }} />
      <Tabs.Screen name="education" options={{ title: 'الفرز', tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'حسابي', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tabs>
  );
}
