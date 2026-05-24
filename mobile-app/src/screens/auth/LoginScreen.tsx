import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { authService } from '../../services/authService';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { setSession } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const res = await authService.login(trimmedEmail, password);
      if (res && (res.success || (res.code >= 1000 && res.code < 3000)) && res.data) {
        await setSession(res.data.accessToken, res.data.refreshToken, {
          accountId: res.data.accountId,
          customerId: res.data.customerId,
          accountType: res.data.accountType,
          Email: trimmedEmail,
        });
      } else {
        setError(res?.message || 'Email hoặc mật khẩu không đúng');
      }
    } catch (err: any) {
      if (err.response) setError(err.response.data?.message || 'Email hoặc mật khẩu không đúng');
      else if (err.request) setError('Lỗi kết nối máy chủ');
      else setError('Email hoặc mật khẩu không đúng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = () => {
    setError('Tính năng chưa khả dụng');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Đăng nhập</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Chào mừng quay lại!</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={COLORS.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu</Text>
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                placeholderTextColor={COLORS.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.primaryButton, isLoading && styles.disabledButton]} onPress={handleLogin} disabled={isLoading}>
              <Text style={styles.primaryButtonText}>{isLoading ? 'Đang tải...' : 'Đăng nhập'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Bạn chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Đăng ký</Text>
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
  forgotPassword: { color: COLORS.primary, alignSelf: 'flex-end', marginBottom: 32, fontSize: 14 },
  primaryButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center', marginBottom: 32 },
  disabledButton: { opacity: 0.7 },
  primaryButtonText: { color: COLORS.background, fontSize: 16, fontWeight: 'bold' },
  errorText: { color: COLORS.error, marginBottom: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 24 },
  footerText: { color: COLORS.muted, fontSize: 14 },
  footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
});
