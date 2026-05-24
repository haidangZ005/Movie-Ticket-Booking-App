import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/authService';
import { LanguageContext } from '../../context/LanguageContext';

export default function VerifyOtpScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = route.params?.email || '';
  const password = route.params?.password || '';
  const { t } = useContext(LanguageContext);

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      setError(t('otp.invalid'));
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const res = await authService.verifyOtp(email, otp);
      if (__DEV__) {
        console.log('[Verify OTP Response]', res);
      }

      // Success codes are >= 1000 and < 3000. 1100 is "User created successfully".
      if (res && (res.success || (res.code >= 1000 && res.code < 3000))) {
        // We don't have tokens yet, so we navigate to CompleteProfile with credentials
        navigation.navigate('CompleteProfile', { email, password });
      } else {
        setError(res?.message || t('common.error'));
      }
    } catch (err: any) {
      if (__DEV__) {
        console.log('[Verify OTP Error]', err);
        if (err.response) {
          console.log('[Verify OTP Error Body]', err.response.data);
        }
      }
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('otp.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{t('otp.enterCode')}</Text>
          <Text style={styles.subtitle}>{t('otp.description', { email })}</Text>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor={COLORS.muted}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.resendContainer}>
            <Text style={styles.resendText}>{t('otp.resend')}</Text>
            <Text style={styles.resendLink}>{t('otp.resendLink')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.primaryButton, isLoading && styles.disabledButton]} 
            onPress={handleVerify}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>{isLoading ? t('common.loading') : t('otp.continue')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  backButton: { color: COLORS.text, fontSize: 24 },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
  content: { paddingHorizontal: 24, flex: 1, paddingTop: 20 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { color: COLORS.muted, fontSize: 16, marginBottom: 40, lineHeight: 24 },
  inputGroup: { marginBottom: 24, alignItems: 'center' },
  otpInput: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, color: COLORS.text, fontSize: 32, letterSpacing: 10, width: '100%' },
  errorText: { color: COLORS.error, marginBottom: 16, textAlign: 'center' },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
  resendText: { color: COLORS.muted, fontSize: 14 },
  resendLink: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
  primaryButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center' },
  disabledButton: { opacity: 0.7 },
  primaryButtonText: { color: COLORS.background, fontSize: 16, fontWeight: 'bold' },
});
