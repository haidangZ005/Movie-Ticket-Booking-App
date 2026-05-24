import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Alert, SafeAreaView, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { API_ORIGIN } from '../../config/api';
import { AuthContext } from '../../context/AuthContext';
import { paymentService, InitPaymentResponse } from '../../services/paymentService';
import { voucherService } from '../../services/voucherService';

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
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedVoucherId, setAppliedVoucherId] = useState<number | undefined>(undefined);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('FLICKTICKETS_PAY');
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

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

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã voucher');
      return;
    }
    setIsApplyingVoucher(true);
    try {
      const vouchers = await voucherService.getAvailableVouchers({
        totalAmount: grandTotal,
        totalSeats: selectedSeats.length,
        showFormat: showInfo.Format || '2D',
      });
      const matched = vouchers.find(v => v.Code.toUpperCase() === voucherCode.trim().toUpperCase());
      if (!matched) {
        Alert.alert('Voucher không hợp lệ', 'Mã voucher không tồn tại hoặc không đủ điều kiện sử dụng cho đơn hàng này.');
        setIsApplyingVoucher(false);
        return;
      }
      const result = await voucherService.applyVoucher({
        voucherId: matched.VoucherID,
        totalAmount: grandTotal,
        totalSeats: selectedSeats.length,
        showFormat: showInfo.Format || '2D',
      });
      setDiscountAmount(result.discountAmount);
      setAppliedVoucherId(matched.VoucherID);
      Alert.alert('Thành công', `Đã áp dụng voucher giảm ${result.discountAmount.toLocaleString('vi-VN')}đ`);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra';
      Alert.alert('Lỗi voucher', message);
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const finalTotal = grandTotal - discountAmount;

  const handlePayNow = async () => {
    if (isPaying) return;

    if (selectedPaymentMethod === 'CREDIT_CARD') {
      if (!cardNumber.trim() || !cardHolder.trim() || !cardExpiry.trim() || !cardCvv.trim()) {
        Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin thẻ');
        return;
      }
      if (cardNumber.replace(/\s/g, '').length < 13) {
        Alert.alert('Thông báo', 'Số thẻ không hợp lệ');
        return;
      }
      if (cardCvv.length < 3) {
        Alert.alert('Thông báo', 'CVV không hợp lệ');
        return;
      }
    }

    setIsPaying(true);
    try {
      const payload = {
        showId: showInfo.ShowID,
        seatIds: selectedSeats.map(s => s.SeatID),
        products: addonItems.map(item => ({
          productId: item.ProductID,
          quantity: item.quantity,
          price: item.Price,
        })),
        ticketTotal,
        addonTotal,
        discountAmount,
        serviceFee: 0,
        totalAmount: finalTotal,
        paymentMethod: selectedPaymentMethod,
        voucherId: appliedVoucherId,
      };

      if (selectedPaymentMethod === 'CREDIT_CARD') {
        payload.cardNumber = cardNumber.replace(/\s/g, '');
        payload.cardHolder = cardHolder;
        payload.cardExpiry = cardExpiry;
        payload.cardCvv = cardCvv;
      }

      const paymentData: InitPaymentResponse = await paymentService.initPayment({
        bookingId: showInfo.ShowID,
        amount: finalTotal,
        method: selectedPaymentMethod,
        currency: 'VND',
        voucherId: appliedVoucherId,
        discountAmount,
      });

      navigation.navigate('PaymentResultScreen' as never, {
        status: 'success',
        bookingId: paymentData.orderId,
        amount: finalTotal,
        message: paymentData.message,
      } as never);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra';
      Alert.alert('Thanh toán thất bại', message);
      navigation.navigate('PaymentResultScreen' as never, {
        status: 'failed',
        message,
      } as never);
    } finally {
      setIsPaying(false);
    }
  };

  const handleOpenCardModal = () => {
    if (selectedPaymentMethod === 'CREDIT_CARD') {
      setShowCardModal(true);
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    return cleaned;
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

          <TouchableOpacity
            style={[S.paymentCard, selectedPaymentMethod === 'FLICKTICKETS_PAY' && S.paymentCardSelected]}
            onPress={() => setSelectedPaymentMethod('FLICKTICKETS_PAY')}
          >
            <View style={S.paymentIconBox}>
              <Ionicons name="wallet-outline" size={18} color={selectedPaymentMethod === 'FLICKTICKETS_PAY' ? Colors.primary : Colors.textMuted} />
            </View>
            <View style={S.paymentInfo}>
              <Text style={S.paymentName}>FlickTickets Pay</Text>
              <Text style={S.paymentDesc}>Thanh toán qua cổng nội bộ</Text>
            </View>
            <View style={[S.radioOuter, selectedPaymentMethod === 'FLICKTICKETS_PAY' && S.radioOuterSelected]}>
              {selectedPaymentMethod === 'FLICKTICKETS_PAY' && <View style={S.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[S.paymentCard, selectedPaymentMethod === 'QR_MOMO' && S.paymentCardSelected]}
            onPress={() => setSelectedPaymentMethod('QR_MOMO')}
          >
            <View style={[S.paymentIconBox, { backgroundColor: 'rgba(161, 42, 128, 0.15)', borderColor: 'rgba(161, 42, 128, 0.3)' }]}>
              <Text style={{ color: '#A12A80', fontSize: 14, fontWeight: '800' }}>Mo</Text>
            </View>
            <View style={S.paymentInfo}>
              <Text style={S.paymentName}>MoMo</Text>
              <Text style={S.paymentDesc}>Quét mã QR MoMo</Text>
            </View>
            <View style={[S.radioOuter, selectedPaymentMethod === 'QR_MOMO' && S.radioOuterSelected]}>
              {selectedPaymentMethod === 'QR_MOMO' && <View style={S.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[S.paymentCard, selectedPaymentMethod === 'QR_VNPAY' && S.paymentCardSelected]}
            onPress={() => setSelectedPaymentMethod('QR_VNPAY')}
          >
            <View style={[S.paymentIconBox, { backgroundColor: 'rgba(0, 100, 180, 0.15)', borderColor: 'rgba(0, 100, 180, 0.3)' }]}>
              <Text style={{ color: '#0064B4', fontSize: 12, fontWeight: '800' }}>VN</Text>
            </View>
            <View style={S.paymentInfo}>
              <Text style={S.paymentName}>VNPay</Text>
              <Text style={S.paymentDesc}>Quét mã QR VNPay</Text>
            </View>
            <View style={[S.radioOuter, selectedPaymentMethod === 'QR_VNPAY' && S.radioOuterSelected]}>
              {selectedPaymentMethod === 'QR_VNPAY' && <View style={S.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[S.paymentCard, selectedPaymentMethod === 'CREDIT_CARD' && S.paymentCardSelected]}
            onPress={() => setSelectedPaymentMethod('CREDIT_CARD')}
          >
            <View style={[S.paymentIconBox, { backgroundColor: 'rgba(255, 152, 0, 0.15)', borderColor: 'rgba(255, 152, 0, 0.3)' }]}>
              <Ionicons name="card-outline" size={18} color={selectedPaymentMethod === 'CREDIT_CARD' ? '#FF9800' : Colors.textMuted} />
            </View>
            <View style={S.paymentInfo}>
              <Text style={S.paymentName}>Thẻ tín dụng</Text>
              <Text style={S.paymentDesc}>Visa / Mastercard / JCB</Text>
            </View>
            <View style={[S.radioOuter, selectedPaymentMethod === 'CREDIT_CARD' && S.radioOuterSelected]}>
              {selectedPaymentMethod === 'CREDIT_CARD' && <View style={S.radioInner} />}
            </View>
          </TouchableOpacity>
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
            <TouchableOpacity style={[S.voucherBtn, isApplyingVoucher && S.voucherBtnDisabled]} onPress={handleApplyVoucher} disabled={isApplyingVoucher}>
              {isApplyingVoucher ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <Text style={S.voucherBtnText}>Áp dụng</Text>
              )}
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
            <Text style={[S.breakdownValue, discountAmount > 0 && { color: '#4CAF50' }]}>-{formatVND(discountAmount)}</Text>
          </View>
          <View style={S.breakdownRow}>
            <Text style={S.breakdownLabel}>Phí dịch vụ</Text>
            <Text style={S.breakdownValue}>{formatVND(0)}</Text>
          </View>
          <View style={S.divider} />
          <View style={S.totalRow}>
            <Text style={S.totalLabel}>Tổng thanh toán</Text>
            <Text style={S.totalValue}>{formatVND(finalTotal)}</Text>
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
            <Text style={S.bottomTotalValue}>{formatVND(finalTotal)}</Text>
          </View>
          <TouchableOpacity
            style={[S.payBtn, isPaying && S.payBtnDisabled]}
            onPress={() => selectedPaymentMethod === 'CREDIT_CARD' ? handleOpenCardModal() : handlePayNow()}
            disabled={isPaying}
          >
            {isPaying ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={S.payBtnText}>Thanh toán ngay</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Credit Card Modal */}
      <Modal
        visible={showCardModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCardModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={S.modalOverlay}
        >
          <View style={S.modalContent}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Thông tin thẻ</Text>
              <TouchableOpacity onPress={() => setShowCardModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={S.cardTypeRow}>
              <View style={S.cardTypeBadge}>
                <Ionicons name="card" size={20} color="#1565C0" />
                <Text style={S.cardTypeText}>Visa / Mastercard / JCB</Text>
              </View>
            </View>

            <View style={S.inputGroup}>
              <Text style={S.inputLabel}>Số thẻ</Text>
              <TextInput
                style={S.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={Colors.textMuted}
                value={cardNumber}
                onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                keyboardType="number-pad"
                maxLength={19}
              />
            </View>

            <View style={S.inputGroup}>
              <Text style={S.inputLabel}>Tên chủ thẻ</Text>
              <TextInput
                style={S.input}
                placeholder="NGUYEN VAN A"
                placeholderTextColor={Colors.textMuted}
                value={cardHolder}
                onChangeText={setCardHolder}
                autoCapitalize="characters"
              />
            </View>

            <View style={S.inputRow}>
              <View style={[S.inputGroup, { flex: 1 }]}>
                <Text style={S.inputLabel}>Ngày hết hạn</Text>
                <TextInput
                  style={S.input}
                  placeholder="MM/YY"
                  placeholderTextColor={Colors.textMuted}
                  value={cardExpiry}
                  onChangeText={(t) => setCardExpiry(formatExpiry(t))}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
              <View style={[S.inputGroup, { flex: 1 }]}>
                <Text style={S.inputLabel}>CVV</Text>
                <TextInput
                  style={S.input}
                  placeholder="123"
                  placeholderTextColor={Colors.textMuted}
                  value={cardCvv}
                  onChangeText={setCardCvv}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

            <Text style={S.cardSecurityNote}>
              <Ionicons name="lock-closed-outline" size={12} color={Colors.textMuted} /> Thông tin thẻ được mã hóa, không lưu trữ trên máy chủ.
            </Text>

            <TouchableOpacity
              style={[S.modalPayBtn, isPaying && S.payBtnDisabled]}
              onPress={handlePayNow}
              disabled={isPaying}
            >
              {isPaying ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={S.modalPayBtnText}>Xác nhận thanh toán {formatVND(finalTotal)}</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.card,
  },
  paymentCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(252, 196, 52, 0.05)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  cardTypeRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  cardTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(21, 101, 192, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(21, 101, 192, 0.3)',
  },
  cardTypeText: {
    color: '#1565C0',
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 15,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardSecurityNote: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalPayBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalPayBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
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
  voucherBtnDisabled: {
    opacity: 0.6,
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
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  payBtnDisabled: {
    opacity: 0.6,
  },
});