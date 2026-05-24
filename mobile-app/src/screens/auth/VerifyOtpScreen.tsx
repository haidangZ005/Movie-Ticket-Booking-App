import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/authService';

export default function VerifyOtpScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = route.params?.email || '';
  const password = route.params?.password || '';

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (!email) navigation.navigate('Login');
  }, [email, navigation]);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      setError('Mã OTP không hợp lệ');
      return;
    }

    setError('');
    setIsLoading(true);
    let isMounted = true;
    try {
      const res = await authService.verifyOtp(email, otp);
      if (!isMounted) return;

      if (res && (res.success || (res.code >= 1000 && res.code < 3000))) {
        navigation.navigate('CompleteProfile', { email, password });
      } else {
        setError(res?.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      if (isMounted) {
        setError(err.response?.data?.message || 'Lỗi kết nối máy chủ');
      }
    } finally {
      if (isMounted) setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Xác thực OTP</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Nhập mã xác thực</Text>
            <Text style={styles.subtitle}>Chúng tôi đã gửi mã xác thực đến {email}</Text>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.otpInput}
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
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.resendContainer}>
              <Text style={styles.resendText}>Chưa nhận được mã? </Text>
              <Text style={styles.resendLink}>Gửi lại</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.primaryButton, isLoading && styles.disabledButton]} 
              onPress={handleVerify}
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>{isLoading ? 'Đang xử lý...' : 'Tiếp tục'}</Text>
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
  content: { paddingHorizontal: 24, flex: 1, paddingTop: 20 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { color: COLORS.muted, fontSize: 16, marginBottom: 40, lineHeight: 24 },
  inputGroup: { marginBottom: 24, alignItems: 'center' },
  otpInput: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, color: COLORS.text, fontSize: 32, letterSpacing: 10, width: '100%' },
  errorText: { color: COLORS.error, marginBottom: 16, textAlign: 'center' },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
  resendText: { color: COLORS.muted, fontSize: 14 },
  resendLink: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
  primaryButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center', marginBottom: 32 },
  disabledButton: { opacity: 0.7 },
  primaryButtonText: { color: COLORS.background, fontSize: 16, fontWeight: 'bold' },
});
