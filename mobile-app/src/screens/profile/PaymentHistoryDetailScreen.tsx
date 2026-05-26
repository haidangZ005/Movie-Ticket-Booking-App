import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import paymentHistoryService, { PaymentHistoryDetail } from '../../services/paymentHistoryService';

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

export default function PaymentHistoryDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const bookingId = Number(route.params?.bookingId);
  const [detail, setDetail] = useState<PaymentHistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await paymentHistoryService.getDetail(bookingId);
      setDetail(data);
    } catch (err) {
      console.error('[PaymentHistoryDetailScreen] Error:', err);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (bookingId) fetchDetail();
    }, [bookingId])
  );

  const summary = detail?.summary;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiet thanh toan</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.stateText}>Dang tai chi tiet...</Text>
        </View>
      ) : !detail || !summary ? (
        <View style={styles.centerState}>
          <Ionicons name="receipt-outline" size={44} color={Colors.textMuted} />
          <Text style={styles.stateText}>Khong tim thay giao dich</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.summaryCard}>
            <Text style={styles.movieTitle}>{summary.MovieTitle}</Text>
            <Text style={styles.metaText}>Don hang #{summary.BookingID}</Text>
            <Text style={styles.metaText}>{summary.CinemaName} - {summary.HallName}</Text>
            <Text style={styles.metaText}>{formatDate(summary.PaymentDate)} - Suat {summary.ShowTime}</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Trang thai</Text>
              <Text style={styles.statusValue}>{summary.PaymentStatus}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ve xem phim</Text>
            {detail.seats.map((seat) => (
              <View key={seat.BookingSeatID} style={styles.lineItem}>
                <View style={styles.itemLeft}>
                  <Ionicons name="ticket-outline" size={18} color={Colors.primary} />
                  <View>
                    <Text style={styles.itemName}>Ghe {seat.SeatNumber}</Text>
                    <Text style={styles.itemMeta}>{seat.SeatType} - {seat.Status}</Text>
                  </View>
                </View>
                <Text style={styles.itemPrice}>{formatVND(seat.TicketPrice)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Do an va san pham</Text>
            {detail.products.length === 0 ? (
              <Text style={styles.emptyText}>Khong mua them san pham nao</Text>
            ) : (
              detail.products.map((product) => (
                <View key={product.BookingProductID} style={styles.lineItem}>
                  <View style={styles.itemLeft}>
                    <Ionicons name="fast-food-outline" size={18} color={Colors.primary} />
                    <View>
                      <Text style={styles.itemName}>{product.ProductName}</Text>
                      <Text style={styles.itemMeta}>x{product.Quantity} - {product.ProductCategory}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemPrice}>{formatVND(product.Subtotal)}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tong tien ve</Text>
              <Text style={styles.totalValue}>{formatVND(detail.totals.ticketTotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Do an / san pham</Text>
              <Text style={styles.totalValue}>{formatVND(detail.totals.productTotal)}</Text>
            </View>
            {detail.totals.discountAmount > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Giam gia</Text>
                <Text style={styles.discount}>-{formatVND(detail.totals.discountAmount)}</Text>
              </View>
            ) : null}
            <View style={[styles.totalRow, styles.finalRow]}>
              <Text style={styles.finalLabel}>Da thanh toan</Text>
              <Text style={styles.finalValue}>{formatVND(detail.totals.paidAmount)}</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  backBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  stateText: { color: '#E5E5E5', fontSize: 14 },
  content: { padding: 18, paddingBottom: 36 },
  summaryCard: { backgroundColor: '#171717', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#252525' },
  movieTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  metaText: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#252525' },
  statusLabel: { color: Colors.textMuted, fontSize: 13 },
  statusValue: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  section: { marginTop: 18, backgroundColor: '#171717', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#252525' },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 10 },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#242424' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  itemName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  itemMeta: { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
  itemPrice: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginLeft: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 13, paddingVertical: 8 },
  totalCard: { marginTop: 18, backgroundColor: '#171717', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#252525' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  totalLabel: { color: Colors.textMuted, fontSize: 14 },
  totalValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  discount: { color: '#35D07F', fontSize: 14, fontWeight: '800' },
  finalRow: { borderTopWidth: 1, borderTopColor: '#252525', marginTop: 8, paddingTop: 12 },
  finalLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  finalValue: { color: Colors.primary, fontSize: 18, fontWeight: '900' },
});
