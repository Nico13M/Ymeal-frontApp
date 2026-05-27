import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeHeader() {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <View style={styles.brandRow}>
          <Text style={styles.brandName}>Ymeal</Text>
        </View>
      </View>
      <Text style={styles.greetingTitle}>Bonjour ! 👋</Text>
      <Text style={styles.greetingSub}>Prêt à cuisiner quelque chose de délicieux ?</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FF9F1C',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  greetingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  greetingSub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
});
