import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Alert, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { API_ORIGIN } from '../../config/api';
import { AuthContext } from '../../context/AuthContext';

const PAYMENT_METHOD = 'FLICKTICKETS_PAY';

type PaymentRouteParams = {
  PaymentScreen: {
    showInfo: {
      ShowID: number;
      MovieTitle: string;
      CinemaName?: string;
      HallName?: string;
      ShowDate?: string;
      ShowTime?: string;
      Format?: string;
      PosterUrl?: string;
    };
    selectedSeats: {
      SeatID: number;
      SeatNumber: string;
      SeatPrice?: number;
    }[];
    ticketTotal: number;
    addonItems: {
      ProductID: number;
      ProductName: string;
      Price: number;
      quantity: number;
      subtotal: number;
      ImageUrl?: string;
    }[];
    addonTotal: number;
    grandTotal: number;
  };
};

const resolvePosterUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads/')) return `${API_ORIGIN}${url}`;
  return `${API_ORIGIN}/uploads/movies/${url}`;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
};

const formatTime = (timeStr?: string) => {
  if (!timeStr) return '';
  return timeStr.slice(0, 5); 
};

const formatVND = (amount: number) => {
  return amount.toLocaleString('vi-VN') + 'đ';
};

export default function PaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<PaymentRouteParams, 'PaymentScreen'>>();
  const { user } = React.useContext(AuthContext);
  
  const params = route.params;

  const [voucherCode, setVoucherCode] = useState('');

  if (!params || !params.showInfo || !params.selectedSeats) {
    return (
      <SafeAreaView style={S.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
        <Text style={S.errorText}>Thiếu dữ liệu thanh toán.</Text>
        <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()}>
          <Text style={S.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const {
    showInfo,
    selectedSeats,
    ticketTotal,
    addonItems,
    addonTotal,
    grandTotal,
  } = params;

  const posterUrl = resolvePosterUrl(showInfo.PosterUrl);
  const seatNumbers = selectedSeats.map(s => s.SeatNumber).join(', ');

  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã voucher');
      return;
    }
    Alert.alert('Thông báo', 'Tính năng voucher sẽ được kết nối sau');
  };

  const handlePayNow = () => {
    const paymentPayload = {
      showId: showInfo.ShowID,
      seatIds: selectedSeats.map(s => s.SeatID),
      products: addonItems.map(item => ({
        productId: item.ProductID,
        quantity: item.quantity,
        price: item.Price,
      })),
      ticketTotal,
      addonTotal,
      discountAmount: 0,
      serviceFee: 0,
      totalAmount: grandTotal,
      paymentMethod: PAYMENT_METHOD,
    };
    console.log('[PAYMENT PAYLOAD]', paymentPayload);
    Alert.alert('Thanh toán', 'Đang chuyển sang cổng thanh toán FlickTickets');
  };

  return (
    <SafeAreaView style={S.safeArea}>
      <View style={S.header}>
        <TouchableOpacity style={S.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Thanh toán</Text>
        <TouchableOpacity style={S.headerBtn} onPress={() => navigation.navigate('Home' as never)}>
          <Ionicons name="home-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={S.policyBanner}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.primary} style={{ marginTop: 2 }} />
        <Text style={S.policyText}>
          Vé đã mua sẽ không thể hoàn, hủy, đổi. Vui lòng kiểm tra kỹ thông tin.
        </Text>
      </View>

      <ScrollView contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Movie Info */}
        <View style={S.card}>
          <View style={S.movieRow}>
            {posterUrl ? (
              <Image source={{ uri: posterUrl }} style={S.poster} />
            ) : (
              <View style={[S.poster, S.posterPlaceholder]}>
                <Ionicons name="film-outline" size={24} color={Colors.textMuted} />
              </View>
            )}
            <View style={S.movieInfo}>
              <Text style={S.cinemaName}>{showInfo.CinemaName || 'Cinema'}</Text>
              <Text style={S.movieTitle} numberOfLines={2}>{showInfo.MovieTitle}</Text>
              <View style={S.tagsRow}>
                <View style={S.ageTag}><Text style={S.ageTagText}>13+</Text></View>
                {showInfo.Format && (
                  <View style={S.formatTag}><Text style={S.formatTagText}>{showInfo.Format}</Text></View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Showtime & Seat Info */}
        <View style={S.card}>
          <View style={S.gridContainer}>
            <View style={S.gridItem}>
              <Text style={S.gridLabel}>Thời gian</Text>
              <Text style={S.gridValue}>{formatTime(showInfo.ShowTime)}</Text>
            </View>
            <View style={S.gridItem}>
              <Text style={S.gridLabel}>Ngày chiếu</Text>
              <Text style={S.gridValue}>{formatDate(showInfo.ShowDate)}</Text>
            </View>
            <View style={S.gridItem}>
              <Text style={S.gridLabel}>Phòng chiếu</Text>
              <Text style={S.gridValue}>{showInfo.HallName}</Text>
            </View>
            <View style={S.gridItem}>
              <Text style={S.gridLabel}>Ghế</Text>
              <Text style={S.seatValue} numberOfLines={1}>{seatNumbers}</Text>
            </View>
          </View>
        </View>

        {/* Concessions */}
        <View style={S.card}>
          <Text style={S.cardTitle}>Combo bắp nước</Text>
          {addonItems.length > 0 ? (
            addonItems.map((item, idx) => (
              <View key={idx} style={S.addonRow}>
                <View style={S.addonLeft}>
                  <View style={S.addonIconBox}>
                    <Ionicons name="fast-food-outline" size={20} color={Colors.textMuted} />
                  </View>
                  <View>
                    <Text style={S.addonName}>{item.ProductName}</Text>
                    <Text style={S.addonQty}>x{item.quantity}</Text>
                  </View>
                </View>
                <Text style={S.addonPrice}>{formatVND(item.subtotal)}</Text>
              </View>
            ))
          ) : (
            <Text style={S.emptyText}>Không chọn đồ ăn kèm</Text>
          )}
        </View>

        {/* Recipient Info */}
        <View style={S.card}>
          <View style={S.cardHeaderRow}>
            <Text style={S.cardTitle}>Thông tin người nhận</Text>
            <TouchableOpacity>
              <Ionicons name="pencil-outline" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={S.recipientInfo}>
            <Text style={S.recipientName}>{user?.FullName || 'Khách hàng'}</Text>
            <Text style={S.recipientText}>{user?.PhoneNumber || '(Chưa có SĐT)'}</Text>
            <Text style={S.recipientText}>{user?.Email || '(Chưa có Email)'}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Phương thức thanh toán</Text>
          <View style={[S.card, S.selectedPaymentCard]}>
            <View style={S.paymentIconBox}>
              <Ionicons name="wallet-outline" size={18} color={Colors.primary} />
            </View>
            <View style={S.paymentInfo}>
              <Text style={S.paymentName}>FlickTickets Pay</Text>
              <Text style={S.paymentDesc}>Thanh toán qua cổng thanh toán nội bộ</Text>
            </View>
            <View style={S.radioInner} />
          </View>
        </View>

        {/* Voucher */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Mã giảm giá</Text>
          <View style={S.voucherRow}>
            <View style={S.voucherInputContainer}>
              <Ionicons name="ticket-outline" size={20} color={Colors.textMuted} style={S.voucherIcon} />
              <TextInput
                style={S.voucherInput}
                placeholder="Nhập mã voucher"
                placeholderTextColor={Colors.textMuted}
                value={voucherCode}
                onChangeText={setVoucherCode}
              />
            </View>
            <TouchableOpacity style={S.voucherBtn} onPress={handleApplyVoucher}>
              <Text style={S.voucherBtnText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={S.card}>
          <View style={S.breakdownRow}>
            <Text style={S.breakdownLabel}>Tiền vé</Text>
            <Text style={S.breakdownValue}>{formatVND(ticketTotal)}</Text>
          </View>
          <View style={S.breakdownRow}>
            <Text style={S.breakdownLabel}>Tiền bắp nước</Text>
            <Text style={S.breakdownValue}>{formatVND(addonTotal)}</Text>
          </View>
          <View style={S.breakdownRow}>
            <Text style={S.breakdownLabel}>Giảm giá</Text>
            <Text style={S.breakdownValue}>{formatVND(0)}</Text>
          </View>
          <View style={S.breakdownRow}>
            <Text style={S.breakdownLabel}>Phí dịch vụ</Text>
            <Text style={S.breakdownValue}>{formatVND(0)}</Text>
          </View>
          <View style={S.divider} />
          <View style={S.totalRow}>
            <Text style={S.totalLabel}>Tổng thanh toán</Text>
            <Text style={S.totalValue}>{formatVND(grandTotal)}</Text>
          </View>
        </View>

        <Text style={S.termsText}>
          Bằng cách bấm Tiếp tục, bạn đồng ý với <Text style={S.termsLink}>điều khoản</Text> thanh toán và chính sách của rạp.
        </Text>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={S.bottomBar}>
        <View style={S.bottomBarInner}>
          <View style={S.bottomTotalInfo}>
            <Text style={S.bottomTotalLabel}>Tổng cộng</Text>
            <Text style={S.bottomTotalValue}>{formatVND(grandTotal)}</Text>
          </View>
          <TouchableOpacity style={S.payBtn} onPress={handlePayNow}>
            <Text style={S.payBtnText}>Thanh toán ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: Colors.text,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  backBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  headerBtn: {
    padding: 8,
    marginHorizontal: -8,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  policyBanner: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 193, 7, 0.2)',
    gap: 8,
  },
  policyText: {
    color: 'rgba(255, 193, 7, 0.9)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120, // space for bottom bar
    gap: 24,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  movieRow: {
    flexDirection: 'row',
    gap: 16,
  },
  poster: {
    width: 72,
    height: 104,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
  },
  posterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cinemaName: {
    color: Colors.textMuted,
    fontSize: 13,
    marginBottom: 4,
  },
  movieTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ageTag: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ageTagText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  formatTag: {
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  formatTagText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
    columnGap: 8,
  },
  gridItem: {
    width: '48%',
  },
  gridLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  gridValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  seatValue: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addonIconBox: {
    width: 40,
    height: 40,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addonName: {
    color: Colors.text,
    fontSize: 14,
  },
  addonQty: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  addonPrice: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  recipientInfo: {
    gap: 4,
  },
  recipientName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  recipientText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  selectedPaymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 16,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 193, 7, 0.05)',
  },
  paymentIconBox: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    color: Colors.text,
    fontSize: 14,
  },
  paymentDesc: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  radioInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  voucherRow: {
    flexDirection: 'row',
    gap: 8,
  },
  voucherInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
  },
  voucherIcon: {
    marginRight: 8,
  },
  voucherInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    height: '100%',
  },
  voucherBtn: {
    height: 44,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  breakdownValue: {
    color: Colors.text,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  termsText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  termsLink: {
    color: Colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 16,
  },
  bottomBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  bottomTotalInfo: {
    flexDirection: 'column',
  },
  bottomTotalLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  bottomTotalValue: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  payBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payBtnText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: '700',
  },
});