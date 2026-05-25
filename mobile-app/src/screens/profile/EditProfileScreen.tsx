import React, { useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import { customerService } from '../../services/customerService';

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

const toDateInput = (value?: string) => {
  if (!value) return '';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  return String(value);
};

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, refreshProfile } = useContext(AuthContext);
  const [fullName, setFullName] = useState(user?.FullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.PhoneNumber || '');
  const [gender, setGender] = useState(user?.Gender || 'OTHER');
  const [dateOfBirth, setDateOfBirth] = useState(toDateInput(user?.DateOfBirth));
  const [saving, setSaving] = useState(false);

  const email = useMemo(() => user?.CustomerEmail || user?.Email || '', [user]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ và tên.');
      return;
    }

    try {
      setSaving(true);
      await customerService.updateProfile({
        FullName: fullName.trim(),
        PhoneNumber: phoneNumber.trim(),
        Gender: gender,
        DateOfBirth: dateOfBirth.trim() || undefined,
      });
      await refreshProfile();
      Alert.alert('Thành công', 'Thông tin cá nhân đã được cập nhật.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Không thể cập nhật', error?.response?.data?.message || 'Vui lòng thử lại sau.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarCircle}>
          <Feather name="user" size={34} color={Colors.primary} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nhập họ và tên"
            placeholderTextColor={Colors.muted}
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput value={email} editable={false} style={[styles.input, styles.inputDisabled]} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Nhập số điện thoại"
            placeholderTextColor={Colors.muted}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Giới tính</Text>
          <View style={styles.genderRow}>
            {GENDER_OPTIONS.map((item) => {
              const active = gender === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.genderChip, active && styles.genderChipActive]}
                  onPress={() => setGender(item.value)}
                >
                  <Text style={[styles.genderText, active && styles.genderTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Ngày sinh</Text>
          <TextInput
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.muted}
            style={styles.input}
          />
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.saveText}>Lưu thay đổi</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 40 },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: 'rgba(252,196,52,0.35)',
    marginBottom: 28,
  },
  formGroup: { marginBottom: 18 },
  label: { color: Colors.text, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  input: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    color: Colors.text,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  inputDisabled: { color: Colors.muted, opacity: 0.8 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  genderChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  genderText: { color: Colors.muted, fontWeight: '700' },
  genderTextActive: { color: '#000' },
  saveBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveBtnDisabled: { opacity: 0.65 },
  saveText: { color: '#000', fontSize: 16, fontWeight: '800' },
});
