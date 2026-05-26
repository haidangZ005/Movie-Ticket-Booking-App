import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import BottomNavBar from '../../components/common/BottomNavBar';
import { voucherService, Voucher } from '../../services/voucherService';

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatVND = (amount: number) => amount.toLocaleString('vi-VN') + 'đ';

const isExpiringSoon = (endDate: string) => {
  const now = new Date();
  const end = new Date(endDate);
  const diffDays = Math.floor((end.getTime() - now.getTime()) / 86400000);
  return diffDays <= 3;
};

const getDaysRemaining = (endDate: string) => {
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();
  if (diffMs < 0) return 'Đã hết hạn';
  const days = Math.floor(diffMs / 86400000);
  if (days === 0) return 'Hết hạn hôm nay';
  if (days === 1) return 'Còn 1 ngày';
  return `Còn ${days} ngày`;
};

export default function MyVouchersScreen() {
  const navigation = useNavigation<any>();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'used' | 'expired'>('all');

  const fetchVouchers = async (isRefresh: boolean = false) => {
    try {
      const data = await voucherService.getMyVouchers();
      setVouchers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[MyVouchers] Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchVouchers();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVouchers(true);
  };

  const filteredVouchers = vouchers.filter(v => {
    const now = new Date();
    const end = new Date(v.EndDate);
    const start = new Date(v.StartDate);
    const isExpired = end < now;
    const isNotStarted = start > now;
    const isUsed = !!v.UsageLimit && (v.UsageCount ?? 0) >= v.UsageLimit;

    switch (filter) {
      case 'available': return !isExpired && !isNotStarted && !isUsed;
      case 'used': return isUsed;
      case 'expired': return isExpired || isNotStarted;
      default: return true;
    }
  });

  const renderVoucher = ({ item }: { item: Voucher }) => {
    const now = new Date();
    const end = new Date(item.EndDate);
    const start = new Date(item.StartDate);
    const isExpired = end < now;
    const isNotStarted = start > now;
    const isUsed = !!item.UsageLimit && (item.UsageCount ?? 0) >= item.UsageLimit;
    const isSoon = isExpiringSoon(item.EndDate);
    const remaining = getDaysRemaining(item.EndDate);

    let statusColor = Colors.primary;
    let statusBg = 'rgba(252, 196, 52, 0.1)';
    if (isExpired || isNotStarted) {
      statusColor = Colors.muted;
      statusBg = 'rgba(179, 179, 179, 0.1)';
    } else if (isUsed) {
      statusColor = '#4CAF50';
      statusBg = 'rgba(76, 175, 80, 0.1)';
    } else if (isSoon) {
      statusColor = '#FF9800';
      statusBg = 'rgba(255, 152, 0, 0.1)';
    }

    const discountLabel = item.DiscountType === 'PERCENT'
      ? `${item.DiscountValue}%`
      : formatVND(item.DiscountValue);
    const maxLabel = item.DiscountType === 'PERCENT' && item.MaxDiscount
      ? ` (tối đa ${formatVND(item.MaxDiscount)})`
      : '';

    return (
      <View style={[styles.voucherCard, (isExpired || isUsed || isNotStarted) && styles.voucherCardDisabled]}>
        <View style={[styles.discountBox, { backgroundColor: `${statusColor}20` }]}>
          <Text style={[styles.discountValue, { color: statusColor }]}>{discountLabel}</Text>
          {item.DiscountType === 'PERCENT' && (
            <Text style={styles.discountLabel}>GIẢM</Text>
          )}
        </View>
        <View style={styles.voucherInfo}>
          <Text style={styles.voucherCode}>{item.Code}</Text>
          <Text style={styles.voucherDesc}>
            {item.DiscountType === 'PERCENT' ? `Giảm ${item.DiscountValue}%${maxLabel}` : `Giảm ${formatVND(item.DiscountValue)}`}
          </Text>
          {!!item.MinOrderValue && item.MinOrderValue > 0 && (
            <Text style={styles.voucherCondition}>Đơn tối thiểu: {formatVND(item.MinOrderValue)}</Text>
          )}
          <Text style={styles.voucherExpiry}>HSD: {formatDate(item.EndDate)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {isNotStarted ? 'Chưa đến hạn' : isExpired ? 'Đã hết hạn' : isUsed ? 'Đã dùng' : remaining}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="pricetags-outline" size={64} color={Colors.muted} />
      <Text style={styles.emptyText}>Chưa có voucher nào</Text>
    </View>
  );

  const filterTabs: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'available', label: 'Còn hạn' },
    { key: 'used', label: 'Đã dùng' },
    { key: 'expired', label: 'Hết hạn' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kho voucher</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterRow}>
        {filterTabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[styles.filterText, filter === tab.key && styles.filterTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredVouchers}
        renderItem={renderVoucher}
        keyExtractor={item => String(item.VoucherID)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      />

      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingTop: 48,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#000',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  voucherCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(252, 196, 52, 0.2)',
    overflow: 'hidden',
  },
  voucherCardDisabled: {
    opacity: 0.6,
    borderColor: Colors.border,
  },
  discountBox: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  discountValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  discountLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    color: Colors.muted,
  },
  voucherInfo: {
    flex: 1,
    padding: 16,
  },
  voucherCode: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  voucherDesc: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  voucherCondition: {
    color: Colors.muted,
    fontSize: 12,
    marginBottom: 2,
  },
  voucherExpiry: {
    color: Colors.muted,
    fontSize: 12,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 16,
    marginTop: 16,
  },
});
