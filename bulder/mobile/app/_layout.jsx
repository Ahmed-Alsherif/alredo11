import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/theme';
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'status code 401',
  'Unauthorized',
  'Tracking error',
  'Failed to fetch notifications',
  'SafeAreaView has been deprecated',
]);

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bg },
          animation: 'slide_from_left',
        }}
      />
    </>
  );
}
