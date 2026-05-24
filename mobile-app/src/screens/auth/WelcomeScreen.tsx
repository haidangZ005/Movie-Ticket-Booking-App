import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Modal, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
const heroImage = require('../../assets/images/hero.png');

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>M<Text style={styles.logoHighlight}>B</Text>ooking</Text>

      </View>

      <View style={styles.content}>
        <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
        <Text style={styles.title}>Xin chào!</Text>
        <Text style={styles.subtitle}>Đặt vé xem phim trực tuyến dễ dàng</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.primaryButtonText}>Đăng nhập</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.secondaryButtonText}>Đăng ký</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          Bằng việc tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của chúng tôi

        </Text>
      </View>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16 },
  logoText: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
  logoHighlight: { color: COLORS.primary },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  heroImage: { width: 300, height: 300, borderRadius: 20, marginBottom: 30 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: COLORS.text, fontSize: 16, marginBottom: 40 },
  footer: { paddingHorizontal: 16, paddingBottom: 30 },
  primaryButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { color: COLORS.background, fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.text, paddingVertical: 16, borderRadius: 30, alignItems: 'center', marginBottom: 24 },
  secondaryButtonText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  termsText: { color: COLORS.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
