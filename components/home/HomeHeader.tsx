import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

type HomeHeaderProps = {
  displayName?: string;
};

export default function HomeHeader({ displayName }: HomeHeaderProps) {
  const greeting = displayName?.trim()
    ? `Bonjour ${displayName.trim()} !`
    : 'Bonjour !';

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <View style={styles.brandRow}>
          <Image
            source={require('@/assets/images/text_logo.svg')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>
      </View>
      <Text style={styles.greetingTitle}>{greeting}</Text>
      <Text style={styles.greetingSub}>Prêt cuisiner quelque chose de délicieux ?</Text>
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
  brandLogo: {
    marginTop: 5,
    marginLeft: 10,
    width: 150,
    height: 30,
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

