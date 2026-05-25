import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/authService';

export default function ResetPasswordScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = route.params?.email || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!email) navigation.navigate('Login');
  }, [email, navigation]);

  const handleResetPassword = async () => {
    if (!newPassword) { setError('Vui lòng nhập mật khẩu mới'); return; }
    if (newPassword.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự'); return; }
    if (!confirmPassword) { setError('Vui lòng xác nhận mật khẩu mới'); return; }
    if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return; }

    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      const res = await authService.resetPassword(email, newPassword);
      if (!isMountedRef.current) return;
      if (__DEV__) console.log('[Reset Password Response]', res);
      setSuccessMessage('Cập nhật mật khẩu thành công');
      setTimeout(() => { 
        if (isMountedRef.current) navigation.navigate('Login'); 
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
            <Text style={styles.stepText}>Bước 3/3</Text>
            <Text style={styles.title}>Tạo mật khẩu mới</Text>
            <Text style={styles.subtitle}>Mật khẩu mới của bạn phải khác với mật khẩu đã sử dụng trước đó.</Text>
            <View style={styles.emailChip}>
              <Text style={styles.emailText}>{email}</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu mới</Text>
              <TextInput style={[styles.input, error && !newPassword ? styles.inputError : null]} placeholder="Mật khẩu mới" placeholderTextColor={COLORS.muted} value={newPassword} onChangeText={(text) => { setNewPassword(text); if (error) setError(''); }} secureTextEntry />
              <Text style={styles.hintText}>Phải có ít nhất 8 ký tự.</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Xác nhận mật khẩu</Text>
              <TextInput style={[styles.input, error && (newPassword !== confirmPassword || !confirmPassword) ? styles.inputError : null]} placeholder="Xác nhận mật khẩu" placeholderTextColor={COLORS.muted} value={confirmPassword} onChangeText={(text) => { setConfirmPassword(text); if (error) setError(''); }} secureTextEntry />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {successMessage ? (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}
            <TouchableOpacity style={[styles.primaryButton, isLoading && styles.disabledButton]} onPress={handleResetPassword} disabled={isLoading || !!successMessage}>
              <Text style={styles.primaryButtonText}>{isLoading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}</Text>
            </TouchableOpacity>
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
  emailChip: { backgroundColor: '#1C1C1C', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginBottom: 32 },
  emailText: { color: COLORS.primary || '#FCC434', fontSize: 14, fontWeight: '600' },
  inputGroup: { marginBottom: 24 },
  label: { color: '#FFFFFF', fontSize: 14, marginBottom: 10, fontWeight: '500' },
  input: { backgroundColor: '#1C1C1C', borderRadius: 16, padding: 18, color: '#FFFFFF', fontSize: 16 },
  inputError: { borderWidth: 1, borderColor: COLORS.error || '#FF4D4D' },
  hintText: { color: '#888888', fontSize: 13, marginTop: 6 },
  errorText: { color: COLORS.error || '#FF4D4D', marginBottom: 16, fontSize: 13 },
  successContainer: { backgroundColor: 'rgba(76, 217, 100, 0.1)', padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(76, 217, 100, 0.3)' },
  successText: { color: '#4CD964', fontSize: 14, textAlign: 'center', fontWeight: '500' },
  primaryButton: { backgroundColor: COLORS.primary || '#FCC434', paddingVertical: 18, borderRadius: 30, alignItems: 'center', marginTop: 8, marginBottom: 32 },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
});
