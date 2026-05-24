import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import BottomNavBar from '../../components/common/BottomNavBar';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const DEFAULT_AVATAR_FEMALE = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';
const DEFAULT_AVATAR_MALE = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80';
const DEFAULT_AVATAR_OTHER = 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=256&q=80';

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const displayName = user?.FullName || user?.Email?.split('@')[0] || 'Người dùng';
  const email = user?.CustomerEmail || user?.Email || 'Chưa cập nhật email';
  const phone = user?.PhoneNumber || 'Chưa cập nhật SĐT';
  
  // Xử lý avatar theo giới tính
  let defaultAvatar = DEFAULT_AVATAR_OTHER;
  const gender = user?.Gender?.toString().toLowerCase();
  if (gender === 'nam' || gender === 'male' || gender === 'm') {
    defaultAvatar = DEFAULT_AVATAR_MALE;
  } else if (gender === 'nữ' || gender === 'nu' || gender === 'female' || gender === 'f') {
    defaultAvatar = DEFAULT_AVATAR_FEMALE;
  }

  const avatarUrl = user?.AvatarUrl || defaultAvatar;

  const renderMenuItem = (
    iconElement: React.ReactNode,
    label: string,
    onPress?: () => void,
    hideBottomBorder?: boolean
  ) => (
    <TouchableOpacity
      style={[styles.menuItem, hideBottomBorder && styles.noBorder]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconContainer}>{iconElement}</View>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#FFFFFF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{displayName}</Text>
              <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
                <Feather name="edit-2" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.contactRow}>
              <Feather name="phone" size={14} color="#A1A1AA" />
              <Text style={styles.contactText}>{phone}</Text>
            </View>
            
            <View style={styles.contactRow}>
              <Feather name="mail" size={14} color="#A1A1AA" />
              <Text style={styles.contactText}>{email}</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {renderMenuItem(
            <MaterialCommunityIcons name="ticket-confirmation-outline" size={24} color="#FFFFFF" />,
            'Vé của tôi',
            () => console.log('My ticket')
          )}
          {renderMenuItem(
            <Ionicons name="cart-outline" size={24} color="#FFFFFF" />,
            'Lịch sử thanh toán',
            () => console.log('Payment history')
          )}
          {renderMenuItem(
            <Feather name="lock" size={24} color="#FFFFFF" />,
            'Đổi mật khẩu',
            () => navigation.navigate('ChangePassword')
          )}
        </View>

        {/* Settings / Toggles */}
        <View style={styles.toggleSection}>
          <TouchableOpacity
            style={[styles.menuItem, styles.noBorder, { marginTop: 16 }]}
            onPress={logout}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <Feather name="log-out" size={24} color={COLORS.error || '#FF4D4D'} />
              </View>
              <Text style={[styles.menuLabel, { color: COLORS.error || '#FF4D4D' }]}>
                Đăng xuất
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Nav Bar */}
      <BottomNavBar />
    </SafeAreaView>
  );
}

const COLORS = {
  error: '#FF4D4D'
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 },
  avatar: { width: 86, height: 86, borderRadius: 43, marginRight: 20 },
  userDetails: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  userName: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF', flex: 1 },
  editButton: { paddingLeft: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  contactText: { color: '#A1A1AA', fontSize: 14, marginLeft: 10, fontWeight: '400' },
  menuSection: { paddingHorizontal: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 72, borderBottomWidth: 1, borderBottomColor: '#1C1C1E' },
  noBorder: { borderBottomWidth: 0 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIconContainer: { width: 36, alignItems: 'flex-start' },
  menuLabel: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginLeft: 12 },
  toggleSection: { paddingHorizontal: 24 },
});
