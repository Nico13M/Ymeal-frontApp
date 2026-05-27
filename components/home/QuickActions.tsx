import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type QuickActionsProps = {
  isMobile: boolean;
};

export default function QuickActions({ isMobile }: QuickActionsProps) {
  return (
    <View style={[styles.actionsContainer, isMobile && styles.actionsContainerMobile]}>
      <Link href="/(tabs)/fridge" asChild>
        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="cube-outline" size={24} color="#2196F3" />
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </View>
          <Text style={styles.actionTitle}>Mon Frigo</Text>
          <Text style={styles.actionDesc}>Gère ton inventaire et génère des recettes</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/(tabs)/recipes" asChild>
        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="book-outline" size={24} color="#4CAF50" />
            </View>
          </View>
          <Text style={styles.actionTitle}>Recettes</Text>
          <Text style={styles.actionDesc}>Découvre des recettes adaptées à ton budget</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
    marginHorizontal: '3.60%',
    gap: 12,
    alignItems: 'stretch',
    flexDirection: 'row',
  },
  actionsContainerMobile: {
    flexDirection: 'column',
  },
  actionCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#FF6B6B',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 5,
  },
  actionDesc: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
});
