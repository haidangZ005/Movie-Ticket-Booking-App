import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { LanguageContext } from '../../context/LanguageContext';

const heroImage = require('../../assets/images/hero.png');

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const { t, language, setLanguage } = useContext(LanguageContext);
  const [langVisible, setLangVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>M<Text style={styles.logoHighlight}>B</Text>ooking</Text>
        <TouchableOpacity style={styles.langButton} onPress={() => setLangVisible(true)}>
          <Text style={styles.langButtonText}>A 文 {t('welcome.language')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
        <Text style={styles.title}>{t('welcome.title')}</Text>
        <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.primaryButtonText}>{t('welcome.signIn')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.secondaryButtonText}>{t('welcome.signUp')}</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          {t('welcome.terms')}
        </Text>
      </View>

      {/* Language Bottom Sheet Modal */}
      <Modal visible={langVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>{t('language.title')}</Text>
            <Text style={styles.sheetSubtitle}>{t('language.subtitle')}</Text>
            
            <TouchableOpacity style={styles.langOption} onPress={() => setLanguage('en')}>
              <Text style={[styles.langOptionText, language === 'en' && styles.langOptionSelectedText]}>{t('language.english')}</Text>
              <View style={[styles.radioOuter, language === 'en' && styles.radioOuterSelected]}>
                {language === 'en' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.langOption} onPress={() => setLanguage('vi')}>
              <Text style={[styles.langOptionText, language === 'vi' && styles.langOptionSelectedText]}>{t('language.vietnamese')}</Text>
              <View style={[styles.radioOuter, language === 'vi' && styles.radioOuterSelected]}>
                {language === 'vi' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetButton} onPress={() => setLangVisible(false)}>
              <Text style={styles.sheetButtonText}>{t('language.apply', { language: t(`language.${language === 'en' ? 'english' : 'vietnamese'}`) })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16 },
  logoText: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
  logoHighlight: { color: COLORS.primary },
  langButton: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  langButtonText: { color: COLORS.text, fontSize: 12 },
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
  
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  bottomSheet: { backgroundColor: COLORS.card, padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetTitle: { color: COLORS.text, fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  sheetSubtitle: { color: COLORS.muted, fontSize: 14, marginBottom: 24 },
  langOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  langOptionText: { color: COLORS.text, fontSize: 16, fontWeight: '500' },
  langOptionSelectedText: { color: COLORS.primary },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: COLORS.text, justifyContent: 'center', alignItems: 'center' },
  radioOuterSelected: { borderColor: COLORS.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  sheetButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center', marginTop: 32 },
  sheetButtonText: { color: COLORS.background, fontSize: 16, fontWeight: 'bold' },
});
