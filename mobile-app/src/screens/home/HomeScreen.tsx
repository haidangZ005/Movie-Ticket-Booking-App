import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';

export default function HomeScreen() {
  const { user, logout } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const displayName = user?.FullName || (user?.Email ? user.Email.split('@')[0] : 'User');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.welcomeText}>{t('home.hi', { name: displayName })}</Text>
        <Text style={styles.subtitle}>{t('home.welcomeBack')}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>{t('home.logout')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  welcomeText: { color: COLORS.text, fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: COLORS.muted, fontSize: 16, marginBottom: 40 },
  logoutButton: { backgroundColor: COLORS.card, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 30, borderWidth: 1, borderColor: COLORS.border },
  logoutButtonText: { color: COLORS.error, fontSize: 16, fontWeight: 'bold' },
});
