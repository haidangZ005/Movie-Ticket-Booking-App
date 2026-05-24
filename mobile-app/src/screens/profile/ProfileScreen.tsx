import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import BottomNavBar from '../../components/common/BottomNavBar';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';

// Dummy profile image
const PROFILE_IMAGE_URL = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useContext(AuthContext);
  const [isFaceIdEnabled, setIsFaceIdEnabled] = useState(false);
  const displayName = user?.FullName || user?.Email?.split('@')[0] || 'Người dùng';
  const email = user?.CustomerEmail || user?.Email || 'khachhang@example.com';
  const phone = user?.PhoneNumber || 'Chưa có SĐT';

  const toggleFaceId = () => setIsFaceIdEnabled((previousState) => !previousState);

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
          <View style={styles.userInfoRow}>
            <Image source={{ uri: PROFILE_IMAGE_URL }} style={styles.avatar} />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{displayName}</Text>
              
              <View style={styles.contactRow}>
                <Feather name="phone" size={14} color="#A1A1AA" />
                <Text style={styles.contactText}>{phone}</Text>
              </View>
              
              <View style={styles.contactRow}>
                <Feather name="mail" size={14} color="#A1A1AA" />
                <Text style={styles.contactText}>{email}</Text>
              </View>
              <View style={styles.loyaltyBadge}>
                <Ionicons name="star" size={12} color="#FFC107" />
                <Text style={styles.loyaltyText}>
                  {(user as any)?.LoyaltyPoints?.toLocaleString('vi-VN') || 0} điểm
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile' as never)}
          >
            <Feather name="edit-2" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {renderMenuItem(
            <MaterialCommunityIcons name="ticket-confirmation-outline" size={24} color="#FFFFFF" />,
            'Vé của tôi',
            () => navigation.navigate('Ticket')
          )}
          {renderMenuItem(
            <Ionicons name="pricetags-outline" size={24} color="#FFFFFF" />,
            'Kho voucher',
            () => navigation.navigate('MyVouchers')
          )}
          {renderMenuItem(
            <Ionicons name="ribbon-outline" size={24} color="#FFFFFF" />,
            'Điểm tích lũy',
            () => navigation.navigate('Loyalty')
          )}
          {renderMenuItem(
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />,
            'Thông báo',
            () => navigation.navigate('NotificationList')
          )}
          {renderMenuItem(
            <Ionicons name="cart-outline" size={24} color="#FFFFFF" />,
            'Lịch sử thanh toán',
            () => console.log('Payment history')
          )}
          {renderMenuItem(
            <MaterialIcons name="translate" size={24} color="#FFFFFF" />,
            'Đổi ngôn ngữ',
            () => console.log('Change language')
          )}
          {renderMenuItem(
            <Feather name="lock" size={24} color="#FFFFFF" />,
            'Đổi mật khẩu',
            () => console.log('Change password')
          )}
          {renderMenuItem(
            <Feather name="log-out" size={24} color="#FFFFFF" />,
            'Đăng xuất',
            logout,
            true
          )}
        </View>

        {/* Settings / Toggles */}
        <View style={styles.toggleSection}>
          <View style={[styles.menuItem, styles.noBorder]}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <MaterialCommunityIcons name="face-recognition" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.menuLabel}>Sinh trắc học</Text>
            </View>
            <Switch
              trackColor={{ false: '#27272A', true: Colors.primary }}
              thumbColor={'#FFFFFF'}
              ios_backgroundColor="#27272A"
              onValueChange={toggleFaceId}
              value={isFaceIdEnabled}
              style={styles.switch}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Nav Bar */}
      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for Bottom Nav
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#27272A',
    marginRight: 20,
  },
  userDetails: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    color: '#A1A1AA',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  loyaltyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#332b00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#665200',
  },
  loyaltyText: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  editButton: {
    padding: 8,
  },
  // Menu styles
  menuSection: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 72,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1B1B',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 32, // Fixed width for icon alignment
    alignItems: 'flex-start',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 16,
  },
  // Toggle section styles
  toggleSection: {
    paddingHorizontal: 20,
    marginTop: 8, // Space after the password item divider
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
});
