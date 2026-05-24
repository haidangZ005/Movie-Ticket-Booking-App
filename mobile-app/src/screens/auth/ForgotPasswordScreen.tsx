import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/authService';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Vui lòng nhập email');
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      setError('Email không hợp lệ');
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(trimmedEmail);
      if (!isMountedRef.current) return;
      if (__DEV__) {
        console.log('[Forgot Password Response]', res);
      }

      setSuccessMessage('Thành công');
      setTimeout(() => {
        if (isMountedRef.current) {
          navigation.navigate('VerifyResetOtp', { email: trimmedEmail });
        }
      }, 2000);
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.response?.data?.message || 'Lỗi kết nối máy chủ');
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonArea}>
              <Text style={styles.backButton}>{'<'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.stepText}>Bước 1/3</Text>
            <Text style={styles.title}>Quên mật khẩu</Text>
            <Text style={styles.subtitle}>Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email đã đăng ký</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                placeholder=""
                placeholderTextColor={COLORS.muted}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            {successMessage ? (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleSendOtp}
              disabled={isLoading || !!successMessage}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Đang xử lý...' : 'Gửi mã OTP'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.noteText}>Chúng tôi sẽ gửi mã nếu email tồn tại trong hệ thống.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background || '#000000' },
  scrollContent: { flexGrow: 1 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  backButtonArea: { width: 44, height: 44, justifyContent: 'center' },
  backButton: { color: '#FFFFFF', fontSize: 28 },
  content: { paddingHorizontal: 24, flex: 1, paddingTop: 12 },
  stepText: { color: COLORS.primary || '#FCC434', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { color: '#B3B3B3', fontSize: 15, marginBottom: 40, lineHeight: 22 },
  inputGroup: { marginBottom: 32 },
  label: { color: '#FFFFFF', fontSize: 14, marginBottom: 10, fontWeight: '500' },
  input: { backgroundColor: '#1C1C1C', borderRadius: 16, padding: 18, color: '#FFFFFF', fontSize: 16 },
  inputError: { borderWidth: 1, borderColor: COLORS.error || '#FF4D4D' },
  errorText: { color: COLORS.error || '#FF4D4D', marginTop: 8, fontSize: 13 },
  successContainer: {
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.3)',
  },
  successText: { color: '#4CD964', fontSize: 14, textAlign: 'center', fontWeight: '500' },
  primaryButton: { backgroundColor: COLORS.primary || '#FCC434', paddingVertical: 18, borderRadius: 30, alignItems: 'center', marginTop: 16 },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
  noteText: { color: '#888888', fontSize: 13, textAlign: 'center', marginTop: 20, lineHeight: 18, paddingHorizontal: 16 },
});
