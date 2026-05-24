import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { LanguageContext } from '../../context/LanguageContext';
import { authService } from '../../services/authService';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { t } = useContext(LanguageContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleRegister = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError(t('register.errorEmailEmpty'));
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      setError(t('register.errorEmailInvalid'));
      return;
    }
    if (!password) {
      setError(t('register.errorPasswordEmpty'));
      return;
    }
    if (password.length < 8) {
      setError(t('register.errorPasswordShort'));
      return;
    }
    if (!confirmPassword) {
      setError(t('register.errorConfirmPasswordEmpty'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('register.errorMatch'));
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const res = await authService.register(trimmedEmail, password);
      if (res && (res.success || (res.code >= 1000 && res.code < 3000))) {
        navigation.navigate('VerifyOtp', { email: trimmedEmail, password });
      } else {
        setError(res?.message || t('common.error'));
      }
    } catch (err: any) {
      if (err.response) setError(err.response.data?.message || t('common.error'));
      else if (err.request) setError(t('common.serverConnectionError'));
      else setError(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = () => {
    setError(t('social.notAvailable'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('register.title')}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>{t('register.createAccount')}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('register.email')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('register.email')}
                placeholderTextColor={COLORS.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('register.password')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('register.password')}
                placeholderTextColor={COLORS.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('register.confirmPassword')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('register.confirmPassword')}
                placeholderTextColor={COLORS.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={[styles.primaryButton, isLoading && styles.disabledButton]} onPress={handleRegister} disabled={isLoading}>
              <Text style={styles.primaryButtonText}>{isLoading ? t('common.loading') : t('register.submit')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('register.alreadyHaveAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>{t('register.signIn')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  backButton: { color: COLORS.text, fontSize: 24 },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
  formContainer: { paddingHorizontal: 24, flex: 1 },
  welcomeText: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', marginBottom: 32 },
  inputGroup: { marginBottom: 20 },
  label: { color: COLORS.text, fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, color: COLORS.text, fontSize: 16 },
  primaryButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center', marginTop: 12, marginBottom: 32 },
  disabledButton: { opacity: 0.7 },
  primaryButtonText: { color: COLORS.background, fontSize: 16, fontWeight: 'bold' },
  errorText: { color: COLORS.error, marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 24 },
  footerText: { color: COLORS.muted, fontSize: 14 },
  footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
});
