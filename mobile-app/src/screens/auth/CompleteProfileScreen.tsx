import React, { useContext, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import { authService } from '../../services/authService';
import { customerService } from '../../services/customerService';
import { saveAuthSession } from '../../utils/token';

export default function CompleteProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { setSession } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const email = route.params?.email;
  const password = route.params?.password;
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [tempDate, setTempDate] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePhoneNumber = (phone: string) => /^(0|\+84)(3|5|7|8|9|1[2|6|8|9])([0-9]{8})$/.test(phone.replace(/\s/g, ''));
  const translateOrFallback = (key: string, fallback: string) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  const genderOptions = [
    { value: 'MALE', labelKey: 'completeProfile.genderMale', fallback: 'Nam' },
    { value: 'FEMALE', labelKey: 'completeProfile.genderFemale', fallback: 'Nữ' },
    { value: 'OTHER', labelKey: 'completeProfile.genderOther', fallback: 'Khác' },
  ];

  const formatDateDisplay = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}/${date.getFullYear()}`;
  };

  const formatDatePayload = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  };

  const handleComplete = async () => {
    if (!email || !password) {
      setError(translateOrFallback('register.invalidSession', 'Phiên đăng ký không hợp lệ.'));
      setTimeout(() => navigation.navigate('Login'), 2000);
      return;
    }

    const trimmedName = fullName.trim();
    const trimmedPhone = phoneNumber.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError(t('validation.fullNameRequired'));
      return;
    }
    if (!trimmedPhone || !validatePhoneNumber(trimmedPhone)) {
      setError(translateOrFallback('validation.invalidPhoneNumber', 'Số điện thoại không hợp lệ.'));
      return;
    }
    if (!gender) {
      setError(t('validation.genderRequired'));
      return;
    }
    if (!dateOfBirth) {
      setError(t('validation.dateOfBirthRequired'));
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const loginRes = await authService.login(email, password);
      if (!loginRes?.data) throw new Error('AUTO_LOGIN_FAILED');

      const { accessToken, refreshToken } = loginRes.data;
      await saveAuthSession(accessToken, refreshToken);

      const profileRes = await customerService.updateProfile({
        FullName: trimmedName,
        PhoneNumber: trimmedPhone,
        Gender: gender,
        DateOfBirth: formatDatePayload(dateOfBirth),
      });

      if (profileRes && (profileRes.success || profileRes.code === 1000)) {
        await setSession(accessToken, refreshToken, profileRes.data);
      } else {
        setError(profileRes?.message || t('profile.updateFailed'));
      }
    } catch (err: any) {
      if (err.message === 'AUTO_LOGIN_FAILED') {
        setError(t('auth.autoLoginFailed'));
        setTimeout(() => navigation.navigate('Login'), 3000);
      } else if (err.response?.data?.code === 1006) {
        setError(t('profile.phoneExisted'));
      } else {
        setError(err.response?.data?.message || t('profile.updateFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (selectedDate) setDateOfBirth(selectedDate);
    } else if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const openPicker = () => {
    setTempDate(dateOfBirth || new Date(2000, 0, 1));
    setShowDatePicker(true);
  };

  const renderInput = (label: string, value: string, onChangeText: (text: string) => void, fieldKey: string, options: any = {}) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label} *</Text>
      <TextInput
        style={[styles.input, focusedField === fieldKey && styles.inputFocused, error && !value && styles.inputError]}
        placeholder={options.placeholder}
        placeholderTextColor={COLORS.muted}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocusedField(fieldKey)}
        onBlur={() => setFocusedField(null)}
        {...options}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
              <Text style={styles.backButtonText}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('completeProfile.title')}</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{t('completeProfile.title')}</Text>
            <Text style={styles.subtitle}>{t('completeProfile.subtitle')}</Text>

            {renderInput(t('completeProfile.fullName'), fullName, setFullName, 'fullName', { placeholder: t('completeProfile.fullNamePlaceholder') })}
            {renderInput(t('completeProfile.phoneNumber'), phoneNumber, setPhoneNumber, 'phoneNumber', { placeholder: t('completeProfile.phonePlaceholder'), keyboardType: 'phone-pad' })}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('completeProfile.gender')} *</Text>
              <View style={styles.genderContainer}>
                {genderOptions.map((option) => (
                  <TouchableOpacity key={option.value} style={[styles.genderButton, gender === option.value && styles.genderButtonActive]} onPress={() => setGender(option.value)}>
                    <Text style={[styles.genderText, gender === option.value && styles.genderTextActive]}>{translateOrFallback(option.labelKey, option.fallback)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('completeProfile.dateOfBirth')} *</Text>
              <TouchableOpacity style={[styles.input, styles.dateInput]} onPress={openPicker}>
                <Text style={[styles.dateText, !dateOfBirth && { color: COLORS.muted }]}>{dateOfBirth ? formatDateDisplay(dateOfBirth) : t('completeProfile.datePlaceholder')}</Text>
              </TouchableOpacity>

              {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker value={dateOfBirth || new Date(2000, 0, 1)} mode="date" display="default" maximumDate={new Date()} onChange={onDateChange} />
              )}

              <Modal transparent animationType="slide" visible={Platform.OS === 'ios' && showDatePicker} onRequestClose={() => setShowDatePicker(false)}>
                <View style={styles.modalOverlay}>
                  <View style={styles.pickerContainer}>
                    <View style={styles.pickerHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.pickerCancelText}>{t('completeProfile.cancel')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setDateOfBirth(tempDate);
                          setShowDatePicker(false);
                        }}
                      >
                        <Text style={styles.pickerConfirmText}>{t('completeProfile.confirm')}</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker value={tempDate} mode="date" display="spinner" maximumDate={new Date()} onChange={onDateChange} textColor={COLORS.text} />
                  </View>
                </View>
              </Modal>
            </View>

            {error ? <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View> : null}

            <TouchableOpacity style={[styles.primaryButton, isLoading && styles.disabledButton]} onPress={handleComplete} disabled={isLoading}>
              <Text style={styles.primaryButtonText}>{isLoading ? t('common.loading') : t('completeProfile.done')}</Text>
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
  backButtonContainer: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { color: COLORS.text, fontSize: 24 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  content: { paddingHorizontal: 24, flex: 1, paddingTop: 10, paddingBottom: 32 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: COLORS.muted, fontSize: 15, marginBottom: 32, lineHeight: 22 },
  inputGroup: { marginBottom: 20 },
  label: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 10 },
  input: { backgroundColor: '#1C1C1C', borderRadius: 12, padding: 16, color: COLORS.text, fontSize: 16, borderWidth: 1, borderColor: 'transparent' },
  inputFocused: { borderColor: COLORS.primary },
  inputError: { borderColor: COLORS.error },
  dateInput: { justifyContent: 'center' },
  dateText: { color: COLORS.text, fontSize: 16 },
  genderContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  genderButton: { flex: 0.31, backgroundColor: '#1C1C1C', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  genderButtonActive: { borderColor: COLORS.primary, backgroundColor: '#1C1C1C' },
  genderText: { color: COLORS.muted, fontSize: 15 },
  genderTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  errorContainer: { backgroundColor: 'rgba(255, 77, 77, 0.1)', padding: 12, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255, 77, 77, 0.3)' },
  errorText: { color: COLORS.error, fontSize: 14, textAlign: 'center' },
  primaryButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center', marginTop: 10 },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
  pickerContainer: { backgroundColor: '#1C1C1C', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#333333' },
  pickerCancelText: { color: COLORS.muted, fontSize: 16 },
  pickerConfirmText: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold' },
});
