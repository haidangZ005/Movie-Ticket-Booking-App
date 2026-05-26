import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import paymentHistoryService, { PaymentHistoryItem } from '../../services/paymentHistoryService';

const formatVND = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')} d`;

const formatDate = (value?: string) => {
  if (!value) return 'Dang cap nhat';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusColor = (status?: string) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized.includes('SUCCESS')) return '#35D07F';
  if (normalized.includes('PENDING') || normalized.includes('CREATED') || normalized.includes('PROCESSING')) return '#F5C84C';
  if (normalized.includes('FAILED') || normalized.includes('EXPIRED') || normalized.includes('REFUNDED')) return '#E5484D';
  return Colors.textMuted;
};

export default function PaymentHistoryScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchHistory = async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (pageNum === 1 && !isRefresh) setLoading(true);
      const data = await paymentHistoryService.getHistory(pageNum, 20);
      const nextItems = Array.isArray(data.items) ? data.items : [];
      setItems(prev => (pageNum === 1 || isRefresh ? nextItems : [...prev, ...nextItems]));
      setHasMore(nextItems.length === 20);
      setPage(pageNum);
    } catch (err) {
      console.error('[PaymentHistoryScreen] Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory(1);
    }, [])
  );

  const renderItem = ({ item }: { item: PaymentHistoryItem }) => {
    const statusColor = getStatusColor(item.PaymentStatus);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.82}
        onPress={() => navigation.navigate('PaymentHistoryDetail', { bookingId: item.BookingID })}
      >
        <View style={styles.cardTop}>
          <View style={styles.iconBox}>
            <Ionicons name="card-outline" size={20} color={statusColor} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.movieTitle} numberOfLines={1}>{item.MovieTitle || `Don hang #${item.BookingID}`}</Text>
            <Text style={styles.metaText}>#{item.BookingID} - {item.PaymentMethod || 'N/A'}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}22` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.PaymentStatus}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Feather name="calendar" size={14} color={Colors.textMuted} />
          <Text style={styles.detailText}>{formatDate(item.PaymentDate)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="map-pin" size={14} color={Colors.textMuted} />
          <Text style={styles.detailText} numberOfLines={1}>{item.CinemaName} - {item.HallName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="film" size={14} color={Colors.textMuted} />
          <Text style={styles.detailText}>{item.TotalSeats} ve - Suat {item.ShowTime}</Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Tong thanh toan</Text>
          <Text style={styles.amount}>{formatVND(item.Amount)}</Text>
        </View>
        {Number(item.DiscountAmount) > 0 ? (
          <View style={styles.discountRow}>
            <Text style={styles.discountLabel}>Giam gia</Text>
            <Text style={styles.discount}>-{formatVND(item.DiscountAmount)}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lich su thanh toan</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.stateText}>Dang tai lich su...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.PaymentID)}
          renderItem={renderItem}
          contentContainerStyle={items.length === 0 ? styles.emptyContent : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchHistory(1, true);
              }}
              tintColor={Colors.primary}
            />
          }
          onEndReached={() => {
            if (hasMore && !loading) fetchHistory(page + 1);
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={46} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Chua co giao dich nao</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  backBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  listContent: { padding: 18, paddingBottom: 32 },
  card: { backgroundColor: '#171717', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#252525' },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#222222', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  titleBlock: { flex: 1 },
  movieTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  metaText: { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  statusText: { fontSize: 10, fontWeight: '800' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 7 },
  detailText: { color: '#D8D8D8', fontSize: 13, marginLeft: 8, flex: 1 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#252525', paddingTop: 10, marginTop: 12 },
  amountLabel: { color: Colors.textMuted, fontSize: 13 },
  amount: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  discountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  discountLabel: { color: Colors.textMuted, fontSize: 13 },
  discount: { color: '#35D07F', fontSize: 14, fontWeight: '800' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  stateText: { color: '#E5E5E5', fontSize: 14 },
  emptyContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyBox: { alignItems: 'center', gap: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 15, fontWeight: '600' },
});
