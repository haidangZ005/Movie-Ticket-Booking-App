import React, { useContext, useEffect, useState, useRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/authService';

export default function VerifyResetOtpScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = route.params?.email || '';
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!email) navigation.navigate('Login');
  }, [email, navigation]);

  const handleVerify = async () => {
    if (!otp) {
      setError('Vui lòng nhập mã OTP');
      return;
    }
    if (otp.length !== 6) {
      setError('Mã OTP phải có 6 chữ số');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const res = await authService.verifyResetOtp(email, otp);
      if (!isMountedRef.current) return;
      if (res && (res.success || (res.code >= 1000 && res.code < 3000))) {
        navigation.navigate('ResetPassword', { email });
      } else {
        setError(res?.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.response?.data?.message || 'Lỗi kết nối máy chủ');
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      if (isMountedRef.current) setError('');
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
            <Text style={styles.stepText}>Bước 2/3</Text>
            <Text style={styles.title}>Xác thực OTP</Text>
            <Text style={styles.subtitle}>Nhập mã OTP gồm 6 chữ số đã được gửi đến email của bạn.</Text>
            <View style={styles.emailChip}><Text style={styles.emailText}>{email}</Text></View>
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.otpInput, error ? styles.inputError : null]}
                placeholder="000000"
                placeholderTextColor={COLORS.muted}
                value={otp}
                onChangeText={(text) => {
                  setOtp(text);
                  if (error) setError('');
                }}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
            <TouchableOpacity style={[styles.primaryButton, isLoading && styles.disabledButton]} onPress={handleVerify} disabled={isLoading}>
              <Text style={styles.primaryButtonText}>{isLoading ? 'Đang xử lý...' : 'Tiếp tục'}</Text>
            </TouchableOpacity>
            <View style={styles.resendArea}>
              <Text style={styles.resendLabel}>Chưa nhận được mã? </Text>
              <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
                <Text style={styles.resendLink}>Gửi lại</Text>
              </TouchableOpacity>
            </View>
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
  subtitle: { color: '#B3B3B3', fontSize: 15, marginBottom: 20, lineHeight: 22 },
  emailChip: { backgroundColor: '#1C1C1C', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginBottom: 40 },
  emailText: { color: COLORS.primary || '#FCC434', fontSize: 14, fontWeight: '600' },
  inputGroup: { marginBottom: 32, alignItems: 'center' },
  otpInput: { backgroundColor: '#1C1C1C', borderRadius: 16, padding: 18, color: '#FFFFFF', fontSize: 32, letterSpacing: 10, width: '100%', fontWeight: 'bold' },
  inputError: { borderWidth: 1, borderColor: COLORS.error || '#FF4D4D' },
  errorText: { color: COLORS.error || '#FF4D4D', marginTop: 12, fontSize: 13, textAlign: 'center' },
  primaryButton: { backgroundColor: COLORS.primary || '#FCC434', paddingVertical: 18, borderRadius: 30, alignItems: 'center' },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
  resendArea: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  resendLabel: { color: '#888888', fontSize: 14 },
  resendLink: { color: COLORS.primary || '#FCC434', fontSize: 14, fontWeight: 'bold' },
});
