
import { Image, StyleSheet } from 'react-native';

export function Logo() {
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={styles.logo}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    marginBottom: 8,
  },
});