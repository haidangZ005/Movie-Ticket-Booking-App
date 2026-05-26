
import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { customerService } from '../../services/customerService';

const DEFAULT_AVATAR_FEMALE = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';
const DEFAULT_AVATAR_MALE = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80';
const DEFAULT_AVATAR_OTHER = 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=256&q=80';

type GenderCode = 'MALE' | 'FEMALE' | 'OTHER';

const normalizeGender = (value?: string | null): GenderCode => {
  const normalized = value?.trim().toUpperCase();
  if (normalized === 'MALE' || normalized === 'NAM') return 'MALE';
  if (normalized === 'FEMALE' || normalized === 'NU' || normalized === 'NỮ') return 'FEMALE';
  return 'OTHER';
};

const genderOptions: { label: string; value: GenderCode }[] = [
  { label: 'Nam', value: 'MALE' },
  { label: 'Nữ', value: 'FEMALE' },
  { label: 'Khác', value: 'OTHER' },
];

const parseProfileDate = (value?: string | Date | null) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const dateOnly = value.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, refreshProfile } = useContext(AuthContext);

  const [fullName, setFullName] = useState(user?.FullName || '');
  const [phone, setPhone] = useState(user?.PhoneNumber || '');
  const [gender, setGender] = useState<GenderCode>(normalizeGender(user?.Gender?.toString()));
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(parseProfileDate(user?.DateOfBirth));
  const [tempDate, setTempDate] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.AvatarUrl || null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  // Xác định avatar mặc định để hiển thị
  const fillForm = (profile: any) => {
    setFullName(profile?.FullName || '');
    setPhone(profile?.PhoneNumber || '');
    setGender(normalizeGender(profile?.Gender?.toString()));
    setDateOfBirth(parseProfileDate(profile?.DateOfBirth));
    setAvatarUri(profile?.AvatarUrl || null);
  };

  useEffect(() => {
    if (user) {
      fillForm(user);
    }
  }, [user]);

  useEffect(() => {
    const loadLatestProfile = async () => {
      try {
        const response = await customerService.getProfile();
        if (!isMountedRef.current) return;

        if (response?.data) {
          fillForm(response.data);
        }
      } catch (err) {
        console.log('Load profile for edit failed', err);
      }
    };

    loadLatestProfile();
  }, []);

  const getDefaultAvatar = () => {
    const g = gender.toLowerCase();
    if (gender === 'MALE') return DEFAULT_AVATAR_MALE;
    if (g === 'nữ' || g === 'nu' || g === 'female' || g === 'f') return DEFAULT_AVATAR_FEMALE;
    return DEFAULT_AVATAR_OTHER;
  };

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

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh để cập nhật avatar!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) { setError('Vui lòng nhập họ tên'); return; }
    
    setError('');
    setIsLoading(true);

    try {
      // payload data
      const payload: any = {
        FullName: fullName,
        PhoneNumber: phone,
        Gender: gender,
      };
      if (dateOfBirth) {
        payload.DateOfBirth = formatDatePayload(dateOfBirth);
      }
      
      // Pass local URI directly for demo (Wait for proper backend S3 upload in production)
      if (avatarUri && !avatarUri.startsWith('http')) {
        payload.AvatarUrl = avatarUri;
      }

      await customerService.updateProfile(payload);
      
      if (!isMountedRef.current) return;
      
      // Refresh context to sync new avatar and details globally
      await refreshProfile();
      
      if (isMountedRef.current) {
        navigation.goBack();
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.');
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false);

    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonArea}>
              <Feather name="chevron-left" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cập nhật thông tin</Text>
            <View style={styles.backButtonArea} />
          </View>

          {/* Avatar Picker */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper} activeOpacity={0.8}>
              <Image 
                source={{ uri: avatarUri || getDefaultAvatar() }} 
                style={styles.avatarImage} 
              />
              <View style={styles.editIconBadge}>
                <Feather name="camera" size={16} color="#000000" />
              </View>
            </TouchableOpacity>
            <Text style={styles.emailText}>{user?.Email}</Text>
          </View>

          <View style={styles.content}>
            
            {/* Form Fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Họ và tên</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập họ và tên"
                placeholderTextColor={COLORS.muted}
                value={fullName}
                onChangeText={(text) => { setFullName(text); if (error) setError(''); }}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập số điện thoại"
                placeholderTextColor={COLORS.muted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(text) => { setPhone(text); if (error) setError(''); }}
              />
            </View>

            {/* Gender Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Giới tính</Text>
              <View style={styles.genderRow}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.genderButton, gender === option.value && styles.genderButtonActive]}
                    onPress={() => setGender(option.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.genderText, gender === option.value && styles.genderTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ngày sinh</Text>
              <TouchableOpacity style={[styles.input, styles.dateInput]} onPress={openPicker}>
                <Text style={[styles.dateText, !dateOfBirth && { color: COLORS.muted }]}>
                  {dateOfBirth ? formatDateDisplay(dateOfBirth) : 'Chọn ngày sinh'}
                </Text>
              </TouchableOpacity>

              {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker 
                  value={dateOfBirth || new Date(2000, 0, 1)} 
                  mode="date" 
                  display="spinner" 
                  maximumDate={new Date()} 
                  onChange={onDateChange} 
                />
              )}

              <Modal transparent animationType="slide" visible={Platform.OS === 'ios' && showDatePicker} onRequestClose={() => setShowDatePicker(false)}>
                <View style={styles.modalOverlay}>
                  <View style={styles.pickerContainer}>
                    <View style={styles.pickerHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.pickerCancelText}>Hủy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setDateOfBirth(tempDate);
                          setShowDatePicker(false);
                        }}
                      >
                        <Text style={styles.pickerConfirmText}>Xác nhận</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker 
                      value={tempDate} 
                      mode="date" 
                      display="spinner" 
                      maximumDate={new Date()} 
                      onChange={onDateChange} 
                      textColor="#FFFFFF" 
                    />
                  </View>
                </View>
              </Modal>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <TouchableOpacity 
              style={[styles.primaryButton, isLoading && styles.disabledButton]} 
              onPress={handleSave} 
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingTop: 16, 
    paddingBottom: 20 
  },
  backButtonArea: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary || '#FCC434',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000000',
  },
  emailText: {
    color: '#A1A1AA',
    fontSize: 14,
  },

  content: { paddingHorizontal: 24, flex: 1 },
  inputGroup: { marginBottom: 24 },
  label: { color: '#FFFFFF', fontSize: 14, marginBottom: 10, fontWeight: '500' },
  input: { 
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    padding: 16, 
    color: '#FFFFFF', 
    fontSize: 16 
  },
  dateInput: { justifyContent: 'center' },
  dateText: { color: '#FFFFFF', fontSize: 16 },
  
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  genderButtonActive: {
    borderColor: COLORS.primary || '#FCC434',
    backgroundColor: 'rgba(252, 196, 52, 0.1)',
  },
  genderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  genderTextActive: {
    color: COLORS.primary || '#FCC434',
    fontWeight: 'bold',
  },

  errorText: { color: COLORS.error || '#FF4D4D', marginBottom: 20, fontSize: 14, textAlign: 'center' },
  primaryButton: { backgroundColor: COLORS.primary || '#FCC434', paddingVertical: 18, borderRadius: 30, alignItems: 'center', marginTop: 10 },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
  pickerContainer: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
  pickerCancelText: { color: '#A1A1AA', fontSize: 16 },
  pickerConfirmText: { color: COLORS.primary || '#FCC434', fontSize: 16, fontWeight: 'bold' },

});
