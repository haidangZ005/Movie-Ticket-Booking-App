import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

export default function BottomNavBar() {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const TAB_ORDER = ['Home', 'Ticket', 'Movie', 'Profile'];

  const handleNavigate = (targetScreen: string) => {
    if (route.name === targetScreen) return;

    const currentIndex = TAB_ORDER.indexOf(route.name);
    const nextIndex = TAB_ORDER.indexOf(targetScreen);

    let animation = 'none';
    if (currentIndex !== -1 && nextIndex !== -1) {
      if (nextIndex > currentIndex) {
        animation = 'slide_from_right';
      } else {
        animation = 'slide_from_left';
      }
    }

    navigation.navigate({
      name: targetScreen,
      params: { animation },
      merge: true,
    });
  };

  const getIconColor = (routeName: string) => {
    return route.name === routeName ? Colors.primary : Colors.textMuted;
  };

  const getTextColor = (routeName: string) => {
    return route.name === routeName ? Colors.primary : Colors.textMuted;
  };

  return (
    <View style={styles.bottomNavContainer}>
      <TouchableOpacity style={styles.navItem} onPress={() => handleNavigate('Home')}>
        <Ionicons name="home-outline" size={24} color={getIconColor('Home')} style={styles.navIcon} />
        <Text style={[styles.navLabel, { color: getTextColor('Home') }]}>Trang chủ</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.navItem} onPress={() => handleNavigate('Ticket')}>
        <FontAwesome5 name="ticket-alt" size={22} color={getIconColor('Ticket')} style={styles.navIcon} />
        <Text style={[styles.navLabel, { color: getTextColor('Ticket') }]}>Vé</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.navItem} onPress={() => handleNavigate('Movie')}>
        <Ionicons name="videocam-outline" size={26} color={getIconColor('Movie')} style={styles.navIcon} />
        <Text style={[styles.navLabel, { color: getTextColor('Movie') }]}>Phim</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.navItem} onPress={() => handleNavigate('Profile')}>
        <Ionicons name={route.name === 'Profile' ? 'person' : 'person-outline'} size={24} color={getIconColor('Profile')} style={styles.navIcon} />
        <Text style={[styles.navLabel, { color: getTextColor('Profile') }]}>Tài khoản</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderTopWidth: 0.5,
    borderTopColor: '#1C1B1B',
    paddingBottom: 24,
    paddingTop: 12,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { marginBottom: 4 },
  navLabel: { fontSize: 11, fontWeight: '600' },
});
