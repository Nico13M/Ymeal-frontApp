import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type DailyTipCardProps = {
  tip: string;
};

export default function DailyTipCard({ tip }: DailyTipCardProps) {
  return (
    <LinearGradient
      colors={['#D500F9', '#FF4081']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.tipContainer}
    >
      <View style={styles.tipHeader}>
        <Ionicons name="bulb" size={24} color="#FFF" style={styles.tipIcon} />
        <Text style={styles.tipTitle}>Astuce du jour</Text>
      </View>
      <Text style={styles.tipText}>{tip}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  tipContainer: {
    marginHorizontal: '3.80%',
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#D500F9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipIcon: {
    marginRight: 8,
  },
  tipTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  tipText: {
    color: '#FFF',
    fontSize: 15,
    lineHeight: 22,
  },
});
