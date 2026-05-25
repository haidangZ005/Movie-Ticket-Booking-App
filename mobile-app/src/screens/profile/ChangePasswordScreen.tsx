import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/authService';

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const handleChangePassword = async () => {
    if (!oldPassword) { setError('Vui lòng nhập mật khẩu hiện tại'); return; }
    if (!newPassword) { setError('Vui lòng nhập mật khẩu mới'); return; }
    if (newPassword.length < 8) { setError('Mật khẩu mới phải có ít nhất 8 ký tự'); return; }
    if (!confirmPassword) { setError('Vui lòng xác nhận mật khẩu mới'); return; }
    if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return; }
    if (oldPassword === newPassword) { setError('Mật khẩu mới không được trùng với mật khẩu cũ'); return; }

    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await authService.changePassword(oldPassword, newPassword);
      if (!isMountedRef.current) return;
      
      setSuccessMessage('Đổi mật khẩu thành công!');
      setTimeout(() => {
        if (isMountedRef.current) {
          navigation.goBack();
        }
      }, 1500);
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
              <Feather name="chevron-left" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
            <View style={styles.backButtonArea} />
          </View>

          <View style={styles.content}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu hiện tại</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, error && !oldPassword ? styles.inputError : null]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.muted}
                  secureTextEntry={!showOldPassword}
                  value={oldPassword}
                  onChangeText={(text) => { setOldPassword(text); if (error) setError(''); }}
                />
                <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)} style={styles.eyeIcon}>
                  <Feather name={showOldPassword ? "eye" : "eye-off"} size={20} color={COLORS.muted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu mới</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, error && (!newPassword || newPassword === oldPassword) ? styles.inputError : null]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.muted}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={(text) => { setNewPassword(text); if (error) setError(''); }}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                  <Feather name={showNewPassword ? "eye" : "eye-off"} size={20} color={COLORS.muted} />
                </TouchableOpacity>
              </View>
              <Text style={styles.hintText}>Phải có ít nhất 8 ký tự.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Xác nhận mật khẩu</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, error && (newPassword !== confirmPassword || !confirmPassword) ? styles.inputError : null]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.muted}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => { setConfirmPassword(text); if (error) setError(''); }}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={20} color={COLORS.muted} />
                </TouchableOpacity>
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            {successMessage ? (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity 
              style={[styles.primaryButton, isLoading && styles.disabledButton]} 
              onPress={handleChangePassword} 
              disabled={isLoading || !!successMessage}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Đang xử lý...' : 'Lưu'}
              </Text>
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
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingTop: 16, 
    paddingBottom: 24 
  },
  backButtonArea: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  content: { paddingHorizontal: 24, flex: 1 },
  inputGroup: { marginBottom: 24 },
  label: { color: '#FFFFFF', fontSize: 14, marginBottom: 10, fontWeight: '500' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  input: { 
    flex: 1, 
    padding: 16, 
    color: '#FFFFFF', 
    fontSize: 16 
  },
  inputError: { borderColor: COLORS.error || '#FF4D4D' },
  eyeIcon: { padding: 16 },
  hintText: { color: '#888888', fontSize: 13, marginTop: 8 },
  errorText: { color: COLORS.error || '#FF4D4D', marginBottom: 20, fontSize: 14, textAlign: 'center' },
  successContainer: { backgroundColor: 'rgba(76, 217, 100, 0.1)', padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(76, 217, 100, 0.3)' },
  successText: { color: '#4CD964', fontSize: 14, textAlign: 'center', fontWeight: '500' },
  primaryButton: { backgroundColor: COLORS.primary || '#FCC434', paddingVertical: 18, borderRadius: 30, alignItems: 'center', marginTop: 8, marginBottom: 32 },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
});
