import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import BottomNavBar from '../../components/common/BottomNavBar';

type ResultRouteParams = {
  PaymentResultScreen: {
    status: 'success' | 'failed' | 'pending';
    bookingId?: number;
    amount?: number;
    message?: string;
  };
};

export default function PaymentResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ResultRouteParams, 'PaymentResultScreen'>>();
  const params = route.params?.status ?? 'pending';

  const [countdown, setCountdown] = useState(5);

  const status = params;

  const resultConfig = {
    success: {
      icon: 'checkmark-circle' as const,
      iconColor: '#4CAF50',
      title: 'Thanh toán thành công!',
      subtitle: 'Vé điện tử đã được gửi đến email của bạn',
      bgColor: 'rgba(76, 175, 80, 0.1)',
      borderColor: 'rgba(76, 175, 80, 0.3)',
    },
    failed: {
      icon: 'close-circle' as const,
      iconColor: '#F44336',
      title: 'Thanh toán thất bại',
      subtitle: 'Vui lòng thử lại hoặc chọn phương thức khác',
      bgColor: 'rgba(244, 67, 54, 0.1)',
      borderColor: 'rgba(244, 67, 54, 0.3)',
    },
    pending: {
      icon: 'time' as const,
      iconColor: '#FF9800',
      title: 'Đang xử lý...',
      subtitle: 'Vui lòng chờ trong giây lát',
      bgColor: 'rgba(255, 152, 0, 0.1)',
      borderColor: 'rgba(255, 152, 0, 0.3)',
    },
  };

  const config = resultConfig[status] || resultConfig.pending;

  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status]);

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const handleViewTicket = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Ticket' }],
    });
  };

  const handleRetry = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.resultCard, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
          <Ionicons name={config.icon} size={80} color={config.iconColor} />
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>

          {status === 'pending' && (
            <ActivityIndicator size="small" color={config.iconColor} style={{ marginTop: 16 }} />
          )}

          {status === 'success' && (
            <View style={styles.bookingInfo}>
              <View style={styles.bookingRow}>
                <Text style={styles.bookingLabel}>Mã đơn hàng</Text>
                <Text style={styles.bookingValue}>#{route.params?.bookingId ?? '—'}</Text>
              </View>
              <View style={styles.bookingRow}>
                <Text style={styles.bookingLabel}>Số tiền</Text>
                <Text style={styles.bookingValue}>
                  {route.params?.amount ? route.params.amount.toLocaleString('vi-VN') + 'đ' : '—'}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          {status === 'success' && (
            <>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleViewTicket}>
                <Ionicons name="ticket" size={20} color="#000" />
                <Text style={styles.primaryBtnText}>Xem vé điện tử</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleGoHome}>
                <Text style={styles.secondaryBtnText}>
                  Quay về trang chủ {countdown > 0 && `(${countdown}s)`}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {status === 'failed' && (
            <>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleRetry}>
                <Ionicons name="refresh" size={20} color="#000" />
                <Text style={styles.primaryBtnText}>Thử lại</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleGoHome}>
                <Text style={styles.secondaryBtnText}>Quay về trang chủ</Text>
              </TouchableOpacity>
            </>
          )}

          {status === 'pending' && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleGoHome}>
              <Text style={styles.secondaryBtnText}>Hủy bỏ</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 100,
  },
  resultCard: {
    width: '100%',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.muted,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  bookingInfo: {
    width: '100%',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingLabel: {
    color: Colors.muted,
    fontSize: 14,
  },
  bookingValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    width: '100%',
    marginTop: 32,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
