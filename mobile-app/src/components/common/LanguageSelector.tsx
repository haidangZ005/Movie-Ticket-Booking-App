import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { Colors } from '../../constants/colors';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
];

export default function LanguageSelector() {
  const [showLanguage, setShowLanguage] = useState(false);
  const [selectedLang, setSelectedLang] = useState('vi');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openLanguageModal = () => {
    setShowLanguage(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeLanguageModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowLanguage(false));
  };

  return (
    <>
      <TouchableOpacity style={styles.langBtn} onPress={openLanguageModal}>
        <Text style={styles.langIcon}>文A</Text>
        <Text style={styles.langText}>
          {selectedLang === 'en' ? 'English' : 'Tiếng Việt'}
        </Text>
      </TouchableOpacity>

      <Modal visible={showLanguage} transparent animationType="none">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeLanguageModal}>
          <Animated.View style={[styles.modalContent, { opacity: fadeAnim }]}>
            <TouchableOpacity activeOpacity={1}>
              <Text style={styles.modalTitle}>Chọn ngôn ngữ</Text>
              <Text style={styles.modalSubtitle}>Bạn muốn sử dụng ngôn ngữ nào?</Text>

              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={styles.langOption}
                  onPress={() => setSelectedLang(lang.code)}
                >
                  <Text style={[styles.langOptionText, selectedLang === lang.code && styles.langOptionActive]}>
                    {lang.label}
                  </Text>
                  <View style={[styles.radio, selectedLang === lang.code && styles.radioActive]}>
                    {selectedLang === lang.code && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.useLangBtn} onPress={closeLanguageModal}>
                <Text style={styles.useLangText}>
                  Dùng {selectedLang === 'en' ? 'English' : 'Tiếng Việt'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  langIcon: { fontSize: 14, color: Colors.white },
  langText: { fontSize: 14, color: Colors.white },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 24, fontWeight: '700', color: Colors.white },
  modalSubtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 4, marginBottom: 24 },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  langOptionText: { fontSize: 18, color: Colors.white, fontWeight: '500' },
  langOptionActive: { color: Colors.primary },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  useLangBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  useLangText: { fontSize: 17, fontWeight: '700', color: Colors.background },
});
