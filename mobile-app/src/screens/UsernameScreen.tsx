import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

export default function UsernameScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleDone = () => {
    if (username.trim().length < 2) {
      setError('Tên người dùng phải có ít nhất 2 ký tự');
      return;
    }
    setError('');
    // Navigate to Home screen after successful login/signup
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  // Custom number pad keys (same layout as design)
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'del'],
  ];
  const subLabels: Record<string, string> = {
    '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL',
    '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ',
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Enter Username</Text>
        <Text style={styles.subtitle}>Latin characters, no emoji/symbols</Text>

        <TextInput
          style={[styles.usernameInput, error ? styles.inputError : null]}
          placeholder="Angelina"
          placeholderTextColor={Colors.textMuted}
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            if (error) setError('');
          }}
          autoCapitalize="words"
          autoFocus
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.doneBtn, !username && styles.doneBtnDisabled]}
          onPress={handleDone}
        >
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Number Pad (visual match) */}
      <View style={styles.numpad}>
        {keys.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.numpadRow}>
            {row.map((key, keyIdx) => (
              <TouchableOpacity
                key={keyIdx}
                style={[styles.numKey, key === '' && styles.numKeyEmpty]}
                disabled={key === ''}
              >
                {key === 'del' ? (
                  <Text style={styles.numKeyText}>⌫</Text>
                ) : (
                  <View style={styles.numKeyContent}>
                    <Text style={styles.numKeyText}>{key}</Text>
                    {subLabels[key] && (
                      <Text style={styles.numKeySub}>{subLabels[key]}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backArrow: { fontSize: 24, color: Colors.white },

  content: { paddingHorizontal: 24, flex: 1 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: 24 },

  usernameInput: {
    fontSize: 22, fontWeight: '600', color: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingBottom: 12, marginBottom: 30,
  },
  inputError: {
    borderBottomColor: Colors.error || '#FF4D4D',
  },
  errorText: {
    color: Colors.error || '#FF4D4D',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },

  doneBtn: {
    backgroundColor: Colors.primary, borderRadius: 30,
    paddingVertical: 16, alignItems: 'center',
  },
  doneBtnDisabled: { opacity: 0.6 },
  doneText: { fontSize: 17, fontWeight: '700', color: Colors.background },

  numpad: { paddingHorizontal: 24, paddingBottom: 20 },
  numpadRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  numKey: {
    width: 90, height: 56, marginHorizontal: 6,
    borderRadius: 8, backgroundColor: Colors.surfaceLight,
    alignItems: 'center', justifyContent: 'center',
  },
  numKeyEmpty: { backgroundColor: 'transparent' },
  numKeyContent: { alignItems: 'center' },
  numKeyText: { fontSize: 24, fontWeight: '600', color: Colors.white },
  numKeySub: { fontSize: 10, color: Colors.textMuted, marginTop: -2, letterSpacing: 2 },
});
