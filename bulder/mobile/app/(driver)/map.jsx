import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

export default function DriverMap() {
  const [currentLocation, setCurrentLocation] = useState({ lat: 24.7136, lng: 46.6753 });
  const [isTracking, setIsTracking] = useState(true);

  useEffect(() => {
    if (!isTracking) return;
    
    // Simulate moving around Riyadh
    const interval = setInterval(async () => {
      const newLat = currentLocation.lat + (Math.random() - 0.5) * 0.01;
      const newLng = currentLocation.lng + (Math.random() - 0.5) * 0.01;
      setCurrentLocation({ lat: newLat, lng: newLng });
      
      try {
        await api.post('/tracking/update_location/', {
          latitude: newLat.toString(),
          longitude: newLng.toString()
        });
      } catch (e) {
        console.error('Failed to update location', e);
      }
    }, 15000); // Update every 15s for demo purposes

    return () => clearInterval(interval);
  }, [currentLocation, isTracking]);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>خريطة المسار</Text>
        <Text style={styles.subtitle}>مواقع المشتركين المجدولين لليوم</Text>
      </View>
      <View style={styles.mapBox}>
        <Ionicons name="map" size={48} color={Colors.textMuted} />
        <Text style={styles.mapText}>يتم إرسال الموقع الحالي تلقائياً</Text>
        <Text style={{color: Colors.primary, fontFamily: 'monospace', marginVertical: 10}}>
          {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
        </Text>
        <View style={styles.badge}><Text style={styles.badgeText}>محاكاة GPS مفعلة 🟢</Text></View>
      </View>
      <View style={styles.stats}>
        <View style={styles.statItem}><Text style={styles.emoji}>📍</Text><Text style={styles.statVal}>6</Text><Text style={styles.statLabel}>نقاط توقف</Text></View>
        <View style={styles.divider} />
        <View style={styles.statItem}><Text style={styles.emoji}>🛣️</Text><Text style={styles.statVal}>12 كم</Text><Text style={styles.statLabel}>المسافة</Text></View>
        <View style={styles.divider} />
        <View style={styles.statItem}><Text style={styles.emoji}>⏱️</Text><Text style={styles.statVal}>45 د</Text><Text style={styles.statLabel}>الوقت المقدر</Text></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'right' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right' },
  mapBox: {
    flex: 1, margin: Spacing.md, borderRadius: Radius.lg,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center', gap: 12, borderStyle: 'dashed',
  },
  mapText: { fontSize: FontSize.md, color: Colors.textMuted },
  badge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radius.full },
  badgeText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: '700' },
  stats: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.md,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  divider: { width: 1, backgroundColor: Colors.border },
  emoji: { fontSize: 18 },
  statVal: { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
});
