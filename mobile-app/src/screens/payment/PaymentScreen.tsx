import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SQRCode from 'react-native-qrcode-svg';
import { Colors } from '../../constants/colors';
import { API_ORIGIN } from '../../config/api';
import { AuthContext } from '../../context/AuthContext';
import { paymentService, InitPaymentResponse } from '../../services/paymentService';
import { voucherService, Voucher } from '../../services/voucherService';
import bookingService from '../../services/bookingService';

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
    holdUntil?: string;
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
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<PaymentRouteParams, 'PaymentScreen'>>();
  const { user } = React.useContext(AuthContext);

  const params = route.params;

  const [voucherCode, setVoucherCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedVoucherId, setAppliedVoucherId] = useState<number | undefined>(undefined);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('FLICKTICKETS_PAY');
  const [showCardModal, setShowCardModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState<InitPaymentResponse | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const paymentCompletedRef = useRef(false);
  const releasingRef = useRef(false);

  const showInfo = params?.showInfo;
  const selectedSeats = params?.selectedSeats || [];
  const ticketTotal = params?.ticketTotal || 0;
  const addonItems = params?.addonItems || [];
  const addonTotal = params?.addonTotal || 0;
  const grandTotal = params?.grandTotal || 0;
  const posterUrl = resolvePosterUrl(showInfo?.PosterUrl);
  const seatNumbers = selectedSeats.map(s => s.SeatNumber).join(', ');
  const heldSeatIds = selectedSeats.map(seat => seat.SeatID);

  useEffect(() => {
    if (!showInfo || selectedSeats.length === 0) return;

    let isMounted = true;
    const loadVouchers = async () => {
      setIsLoadingVouchers(true);
      try {
        const data = await voucherService.getAvailableVouchers({
          totalAmount: grandTotal,
          totalSeats: selectedSeats.length,
          showFormat: showInfo.Format || '2D',
        });
        if (isMounted) setAvailableVouchers(data);
      } catch (err) {
        console.error('[PaymentScreen] Load vouchers error:', err);
        if (isMounted) setAvailableVouchers([]);
      } finally {
        if (isMounted) setIsLoadingVouchers(false);
      }
    };

    loadVouchers();
    return () => {
      isMounted = false;
    };
  }, [grandTotal, selectedSeats.length, showInfo?.Format]);

  const releaseHeldSeats = async () => {
    if (!showInfo?.ShowID || heldSeatIds.length === 0) return;
    try {
      await bookingService.releaseSeats(showInfo.ShowID, heldSeatIds);
    } catch (err) {
      console.log('[PaymentScreen] release held seats failed:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
      if (paymentCompletedRef.current || releasingRef.current) return;

      event.preventDefault();
      releasingRef.current = true;

      releaseHeldSeats().finally(() => {
        navigation.dispatch(event.data.action);
      });
    });

    return unsubscribe;
  }, [navigation, showInfo?.ShowID, heldSeatIds.join(',')]);

  if (!params || !showInfo || selectedSeats.length === 0) {
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

  const getVoucherDiscountLabel = (voucher: Voucher) => {
    if (voucher.DiscountType === 'PERCENT') {
      const maxLabel = voucher.MaxDiscount ? `, tối đa ${formatVND(voucher.MaxDiscount)}` : '';
      return `Giảm ${voucher.DiscountValue}%${maxLabel}`;
    }
    return `Giảm ${formatVND(voucher.DiscountValue)}`;
  };

  const handleSelectVoucher = async (voucher: Voucher) => {
    setVoucherCode(voucher.Code);
    setIsApplyingVoucher(true);
    try {
      const result = await voucherService.applyVoucher({
        voucherId: voucher.VoucherID,
        totalAmount: grandTotal,
        totalSeats: selectedSeats.length,
        showFormat: showInfo.Format || '2D',
      });
      setDiscountAmount(result.discountAmount);
      setAppliedVoucherId(voucher.VoucherID);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra';
      Alert.alert('Lỗi voucher', message);
    } finally {
      setIsApplyingVoucher(false);
    }
  };

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
      const payload: any = {
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

      const bookingData = await bookingService.createBooking({
        showId: showInfo.ShowID,
        seatIds: selectedSeats.map(s => s.SeatID),
        totalAmount: finalTotal,
        products: payload.products,
      });

      const paymentData: InitPaymentResponse = await paymentService.initPayment({
        bookingId: bookingData.bookingId,
        amount: finalTotal,
        method: selectedPaymentMethod,
        currency: 'VND',
        voucherId: appliedVoucherId,
        discountAmount,
      });

      paymentCompletedRef.current = true;
      navigation.navigate('PaymentResultScreen' as any, {
        status: 'success',
        bookingId: paymentData.orderId,
        amount: finalTotal,
        message: paymentData.message,
      } as any);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra';
      Alert.alert('Thanh toán thất bại', message);
      await releaseHeldSeats();
      releasingRef.current = true;
      navigation.navigate('PaymentResultScreen' as any, {
        status: 'failed',
        message,
      } as any);
    } finally {
      setIsPaying(false);
    }
  };

  const handleOpenCardModal = () => {
    if (selectedPaymentMethod === 'CREDIT_CARD') {
      setShowCardModal(true);
    }
  };

  const isQRMethod = selectedPaymentMethod === 'QR_MOMO' || selectedPaymentMethod === 'QR_VNPAY';

  const handleOpenQRModal = async () => {
    if (isQRMethod) {
      setShowQRModal(true);
      setQrLoading(true);
      setQrData(null);
      try {
        const bookingData = await bookingService.createBooking({
          showId: showInfo.ShowID,
          seatIds: selectedSeats.map(s => s.SeatID),
          totalAmount: finalTotal,
          products: addonItems.map(item => ({
            productId: item.ProductID,
            quantity: item.quantity,
            price: item.Price,
          })),
        });
        const paymentData: InitPaymentResponse = await paymentService.initPayment({
          bookingId: bookingData.bookingId,
          amount: finalTotal,
          method: selectedPaymentMethod,
          currency: 'VND',
          voucherId: appliedVoucherId,
          discountAmount,
        });
        setQrData(paymentData);
        paymentCompletedRef.current = true;
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra';
        Alert.alert('Lỗi thanh toán', message);
        setShowQRModal(false);
        await releaseHeldSeats();
        releasingRef.current = true;
        navigation.navigate('PaymentResultScreen' as any, { status: 'failed', message } as any);
      } finally {
        setQrLoading(false);
      }
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
            onPress={() => { setSelectedPaymentMethod('QR_MOMO'); }}
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
            onPress={() => { setSelectedPaymentMethod('QR_VNPAY'); }}
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
          {isLoadingVouchers ? (
            <View style={S.voucherListState}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={S.voucherStateText}>Đang tải voucher...</Text>
            </View>
          ) : availableVouchers.length > 0 ? (
            <View style={S.availableVoucherList}>
              {availableVouchers.map(voucher => {
                const isSelected = appliedVoucherId === voucher.VoucherID;
                return (
                  <TouchableOpacity
                    key={voucher.VoucherID}
                    style={[S.availableVoucherCard, isSelected && S.availableVoucherCardSelected]}
                    onPress={() => handleSelectVoucher(voucher)}
                    disabled={isApplyingVoucher}
                  >
                    <View style={S.availableVoucherIcon}>
                      <Ionicons name="ticket" size={18} color={isSelected ? '#000' : Colors.primary} />
                    </View>
                    <View style={S.availableVoucherInfo}>
                      <Text style={S.availableVoucherCode}>{voucher.Code}</Text>
                      <Text style={S.availableVoucherDesc}>{getVoucherDiscountLabel(voucher)}</Text>
                      {!!voucher.MinOrderValue && voucher.MinOrderValue > 0 && (
                        <Text style={S.availableVoucherMeta}>Don toi thieu {formatVND(voucher.MinOrderValue)}</Text>
                      )}
                    </View>
                    <Text style={S.availableVoucherSaving}>
                      -{formatVND(voucher.discountAmount || 0)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={S.voucherStateText}>Không có voucher phù hợp với đơn hàng này.</Text>
          )}
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
            onPress={() => {
              if (isQRMethod) {
                handleOpenQRModal();
              } else if (selectedPaymentMethod === 'CREDIT_CARD') {
                handleOpenCardModal();
              } else {
                handlePayNow();
              }
            }}
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

      {/* QR Payment Modal */}
      <Modal
        visible={showQRModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          Alert.alert(
            'Huỷ thanh toán?',
            'Bạn có chắc muốn huỷ thanh toán? Ghế đang được giữ sẽ được giải phóng.',
            [
              { text: 'Ở lại', style: 'cancel' },
              {
                text: 'Huỷ',
                style: 'destructive',
                onPress: async () => {
                  setShowQRModal(false);
                  await releaseHeldSeats();
                  releasingRef.current = true;
                  navigation.goBack();
                },
              },
            ]
          );
        }}
      >
        <View style={S.qrModalOverlay}>
          <View style={S.qrModalContent}>
            <View style={S.qrModalHeader}>
              <Text style={S.qrModalTitle}>
                {selectedPaymentMethod === 'QR_MOMO' ? 'MoMo' : 'VNPay'}
              </Text>
              <TouchableOpacity onPress={() => { setShowQRModal(false); }}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {qrLoading ? (
              <View style={S.qrLoadingBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={S.qrLoadingText}>Đang tạo mã QR...</Text>
              </View>
            ) : qrData ? (
              <ScrollView contentContainerStyle={S.qrScrollContent} showsVerticalScrollIndicator={false}>
                <View style={S.qrMethodBadge}>
                  <Text style={S.qrMethodBadgeText}>
                    {selectedPaymentMethod === 'QR_MOMO' ? 'MoMo' : 'VNPay'}
                  </Text>
                </View>

                <Text style={S.qrAmountLabel}>Quét mã để thanh toán</Text>
                <Text style={S.qrAmountValue}>{formatVND(finalTotal)}</Text>

                <View style={S.qrCodeBox}>
                  <SQRCode
                    value={qrData.qrUrl || qrData.qrData || qrData.paymentUrl || qrData.orderId?.toString() || ''}
                    size={200}
                    backgroundColor="#FFFFFF"
                    color="#000000"
                  />
                </View>

                <Text style={S.qrHint}>
                  {selectedPaymentMethod === 'QR_MOMO'
                    ? 'Mở ứng dụng MoMo và quét mã QR'
                    : 'Mở ứng dụng VNPay và quét mã QR'}
                </Text>

                <View style={S.qrDivider} />

                <View style={S.qrInfoCard}>
                  <Text style={S.qrInfoTitle}>Thông tin thanh toán</Text>

                  <View style={S.qrInfoRow}>
                    <Text style={S.qrInfoLabel}>Phim</Text>
                    <Text style={S.qrInfoValue} numberOfLines={1}>{showInfo?.MovieTitle}</Text>
                  </View>

                  <View style={S.qrInfoRow}>
                    <Text style={S.qrInfoLabel}>Ghế</Text>
                    <Text style={S.qrInfoSeatValue}>{seatNumbers}</Text>
                  </View>

                  {selectedSeats.map((seat) => (
                    <View key={`seat-${seat.SeatID}`} style={S.qrSeatPriceRow}>
                      <Text style={S.qrSeatPriceLabel}>Ghế {seat.SeatNumber}</Text>
                      <Text style={S.qrSeatPriceValue}>{formatVND(seat.SeatPrice || 0)}</Text>
                    </View>
                  ))}

                  <View style={S.qrTotalRow}>
                    <Text style={S.qrTotalLabel}>Tổng cộng</Text>
                    <Text style={S.qrTotalValue}>{formatVND(finalTotal)}</Text>
                  </View>
                </View>

                <Text style={S.qrNote}>
                  Mã QR có hiệu lực trong 10 phút. Vui lòng thanh toán trước khi hết thời gian.
                </Text>

                <TouchableOpacity
                  style={S.qrDoneBtn}
                  onPress={async () => {
                    setQrLoading(true);
                    try {
                      const status = await paymentService.checkPaymentStatus(qrData.orderId);
                      setQrLoading(false);
                      setShowQRModal(false);
                      const isSuccess = status?.Status === 'SUCCESS' || status?.Status === 'CONFIRMED';
                      navigation.navigate('PaymentResultScreen' as any, {
                        status: isSuccess ? 'success' : 'failed',
                        bookingId: qrData.orderId,
                        amount: finalTotal,
                        message: isSuccess ? 'Thanh toán thành công!' : 'Thanh toán đang được xử lý',
                      } as any);
                    } catch {
                      setQrLoading(false);
                      Alert.alert('Thông báo', 'Chưa nhận được thanh toán. Vui lòng quét lại và thử lại.');
                    }
                  }}
                >
                  <Text style={S.qrDoneBtnText}>Kiểm tra thanh toán</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

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
  voucherListState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  voucherStateText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  availableVoucherList: {
    gap: 8,
  },
  availableVoucherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.card,
  },
  availableVoucherCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(252, 196, 52, 0.08)',
  },
  availableVoucherIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(252, 196, 52, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  availableVoucherInfo: {
    flex: 1,
    gap: 2,
  },
  availableVoucherCode: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  availableVoucherDesc: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  availableVoucherMeta: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  availableVoucherSaving: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '700',
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
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  qrModalContent: {
    backgroundColor: '#1C1B1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: '60%',
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  qrModalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  qrLoadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  qrLoadingText: {
    color: Colors.textMuted,
    fontSize: 15,
    marginTop: 8,
  },
  qrScrollContent: {
    padding: 20,
    paddingBottom: 48,
    alignItems: 'center',
  },
  qrMethodBadge: {
    backgroundColor: 'rgba(252, 196, 52, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(252, 196, 52, 0.3)',
    marginBottom: 16,
  },
  qrMethodBadgeText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  qrAmountLabel: {
    color: Colors.textMuted,
    fontSize: 14,
    marginBottom: 4,
  },
  qrAmountValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 20,
  },
  qrCodeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrHint: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrDivider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 20,
  },
  qrInfoCard: {
    width: '100%',
    backgroundColor: '#252328',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  qrInfoTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  qrInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  qrInfoLabel: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  qrInfoValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  qrInfoSeatValue: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  qrSeatPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  qrSeatPriceLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    flex: 1,
  },
  qrSeatPriceValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  qrTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 4,
  },
  qrTotalLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  qrTotalValue: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  qrNote: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  qrDoneBtn: {
    width: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  qrDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
