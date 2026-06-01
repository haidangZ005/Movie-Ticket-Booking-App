import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../../constants/colors';
import BottomNavBar from '../../components/common/BottomNavBar';
import { loyaltyService, LoyaltyHistoryItem } from '../../services/loyaltyService';

const POINTS_RATE = 10000;

const formatPoints = (points: number) => points.toLocaleString('vi-VN');

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function LoyaltyScreen() {
  const navigation = useNavigation<any>();
  const [currentPoints, setCurrentPoints] = useState(0);
  const [history, setHistory] = useState<LoyaltyHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemedVoucher, setRedeemedVoucher] = useState<{ code: string; percent: number; expiresAt: string } | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  const fetchLoyalty = async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      const data = await loyaltyService.getPointsHistory(pageNum, 20);
      const historyItems = Array.isArray(data?.history) ? data.history : [];
      if (isRefresh || pageNum === 1) {
        setHistory(historyItems);
      } else {
        setHistory(prev => [...prev, ...historyItems]);
      }
      setCurrentPoints(Number(data?.currentPoints) || 0);
      setHasMore((historyItems.length ?? 0) === 20);
      setPage(pageNum);
    } catch (err) {
      console.error('[LoyaltyScreen] Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLoyalty(1);
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLoyalty(1, true);
  };

  const handleLoadMore = () => {
    if (!hasMore || loading) return;
    fetchLoyalty(page + 1);
  };

  const VOUCHER_TIERS = [
    { points: 50, percent: 10, label: 'Giảm 10%', color: '#4CAF50' },
    { points: 75, percent: 15, label: 'Giảm 15%', color: '#FF9800' },
    { points: 100, percent: 20, label: 'Giảm 20%', color: '#E91E63' },
  ];

  const handleCopyCode = async () => {
    if (!redeemedVoucher) return;
    await Clipboard.setStringAsync(redeemedVoucher.code);
    Alert.alert('Đã copy', `Mã voucher "${redeemedVoucher.code}" đã được copy.`);
  };

  const handleRedeem = async (pointCost: number) => {
    if (currentPoints < pointCost) {
      Alert.alert('Không đủ điểm', `Bạn cần tối thiểu ${pointCost} điểm để đổi voucher này.`);
      return;
    }
    setRedeeming(true);
    try {
      const result = await loyaltyService.redeemPointsForVoucher(pointCost);
      setRedeemedVoucher({
        code: result.voucherCode,
        percent: result.discountPercent,
        expiresAt: result.expiresAt,
      });
      setCurrentPoints(prev => prev - pointCost);
      setShowRedeemModal(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra';
      Alert.alert('Lỗi', msg);
    } finally {
      setRedeeming(false);
    }
  };

  const renderVoucherRedeem = () => (
    <View style={styles.redeemSection}>
      <Text style={styles.sectionTitle}>Đổi voucher</Text>
      <Text style={styles.sectionSubtitle}>Dùng điểm tích lũy để đổi voucher giảm giá</Text>

      {redeemedVoucher ? (
        <View style={styles.redeemedCard}>
          <View style={styles.redeemedHeader}>
            <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
            <Text style={styles.redeemedTitle}>Đổi thành công!</Text>
          </View>
          <View style={styles.voucherCodeRow}>
            <Text style={styles.voucherCodeLabel}>Mã voucher</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
              <Text style={styles.copyBtnText}>Copy</Text>
              <Ionicons name="copy-outline" size={14} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          <Text style={styles.voucherCodeValue}>{redeemedVoucher.code}</Text>
          <Text style={styles.voucherPercent}>
            Giảm {redeemedVoucher.percent}% (tối đa 100.000đ)
          </Text>
          <Text style={styles.voucherExpires}>
            HSD: {new Date(redeemedVoucher.expiresAt).toLocaleDateString('vi-VN')}
          </Text>
          <TouchableOpacity
            style={styles.useVoucherBtn}
            onPress={() => { setRedeemedVoucher(null); navigation.navigate('Home' as never); }}
          >
            <Text style={styles.useVoucherBtnText}>Dùng ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.tierList}>
          {VOUCHER_TIERS.map((tier) => {
            const canRedeem = currentPoints >= tier.points;
            return (
              <TouchableOpacity
                key={tier.points}
                style={[styles.tierCard, { borderColor: tier.color + '60' }]}
                onPress={() => setShowRedeemModal(true)}
                disabled={!canRedeem}
              >
                <View style={[styles.tierBadge, { backgroundColor: tier.color + '20' }]}>
                  <Text style={[styles.tierBadgeText, { color: tier.color }]}>
                    -{tier.percent}%
                  </Text>
                </View>
                <Text style={styles.tierLabel}>{tier.label}</Text>
                <Text style={[styles.tierPoints, !canRedeem && { color: Colors.muted }]}>
                  {tier.points} điểm
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderConfirmModal = () => (
    <View style={styles.confirmModal}>
      <Text style={styles.confirmTitle}>Chọn voucher để đổi</Text>
      {VOUCHER_TIERS.map((tier) => {
        const canRedeem = currentPoints >= tier.points;
        return (
          <TouchableOpacity
            key={tier.points}
            style={[styles.confirmTierRow, !canRedeem && styles.confirmTierDisabled]}
            onPress={() => handleRedeem(tier.points)}
            disabled={!canRedeem || redeeming}
          >
            <View style={[styles.confirmTierInfo, !canRedeem && { opacity: 0.5 }]}>
              <Text style={styles.confirmTierLabel}>{tier.label}</Text>
              <Text style={styles.confirmTierMeta}>
                {canRedeem
                  ? `${currentPoints} điểm hiện có`
                  : `Cần thêm ${tier.points - currentPoints} điểm`}
              </Text>
            </View>
            {redeeming ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <View style={[styles.confirmTierBtn, { backgroundColor: canRedeem ? tier.color : '#555' }]}>
                <Text style={styles.confirmTierBtnText}>{tier.points} điểm</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setShowRedeemModal(false)}>
        <Text style={styles.confirmCancelText}>Huỷ</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <>
      <View style={styles.headerCard}>
        <View style={styles.starsRow}>
          <Ionicons name="star" size={32} color={Colors.primary} />
          <Text style={styles.pointsLabel}>Điểm tích lũy</Text>
        </View>
        <Text style={styles.pointsValue}>{formatPoints(currentPoints)}</Text>
        <Text style={styles.pointsNote}>
          {formatPoints(currentPoints)} điểm = {formatPoints(currentPoints * POINTS_RATE)} VNĐ
        </Text>
        <View style={styles.dividerLine} />
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="ticket-outline" size={16} color={Colors.muted} />
            <Text style={styles.infoText}>1 điểm / {formatPoints(POINTS_RATE)} VNĐ</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color={Colors.muted} />
            <Text style={styles.infoText}>Tích lũy vô thời hạn</Text>
          </View>
        </View>
      </View>
      {renderVoucherRedeem()}
    </>
  );

  const renderHistoryItem = ({ item }: { item: LoyaltyHistoryItem }) => {
    const isEarned = item.Type === 'EARNED';
    const color = isEarned ? '#4CAF50' : '#F44336';
    const icon = isEarned ? 'add-circle' : 'remove-circle';
    const prefix = isEarned ? '+' : '';

    return (
      <View style={styles.historyCard}>
        <View style={[styles.historyIconBox, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <View style={styles.historyContent}>
          <Text style={styles.historyTitle}>
            {item.Type === 'EARNED' ? 'Tích lũy điểm' : 'Thu hồi điểm'}
          </Text>
          <Text style={styles.historyDesc} numberOfLines={2}>
            {item.Description || (item.Type === 'EARNED' ? 'Thanh toán thành công' : 'Hoàn tiền / Hủy vé')}
          </Text>
          <Text style={styles.historyDate}>{formatDate(item.CreatedAt)}</Text>
        </View>
        <View style={styles.historyPoints}>
          <Text style={[styles.pointsChange, { color }]}>
            {prefix}{formatPoints(Math.abs(item.Points))}
          </Text>
          <Text style={styles.pointsUnit}>điểm</Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="ribbon-outline" size={64} color={Colors.muted} />
      <Text style={styles.emptyText}>Chưa có lịch sử tích lũy</Text>
    </View>
  );

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
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Điểm tích lũy</Text>
          <View style={{ width: 40 }} />
        </View>

        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={item => String(item.HistoryID)}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            hasMore && !refreshing ? (
              <ActivityIndicator size="small" color={Colors.primary} style={styles.footer} />
            ) : null
          }
        />

        <BottomNavBar />
      </SafeAreaView>

      {showRedeemModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalBackdrop}
            onPress={() => setShowRedeemModal(false)}
          />
          <View style={styles.modalCard}>
            {renderConfirmModal()}
          </View>
        </View>
      )}
    </>
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  headerCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(252, 196, 52, 0.3)',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsLabel: {
    color: Colors.muted,
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  pointsValue: {
    color: Colors.primary,
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 4,
  },
  pointsNote: {
    color: Colors.muted,
    fontSize: 13,
  },
  dividerLine: {
    height: 1,
    backgroundColor: Colors.border,
    width: '100%',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: Colors.muted,
    fontSize: 12,
    marginLeft: 4,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  historyDesc: {
    color: Colors.muted,
    fontSize: 12,
    marginBottom: 2,
  },
  historyDate: {
    color: Colors.muted,
    fontSize: 11,
    opacity: 0.7,
  },
  historyPoints: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  pointsChange: {
    fontSize: 16,
    fontWeight: '700',
  },
  pointsUnit: {
    color: Colors.muted,
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 16,
    marginTop: 16,
  },
  footer: {
    paddingVertical: 16,
  },
  redeemSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(252, 196, 52, 0.2)',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: Colors.muted,
    fontSize: 12,
    marginBottom: 16,
  },
  tierList: {
    flexDirection: 'row',
    gap: 10,
  },
  tierCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    minHeight: 100,
    justifyContent: 'center',
  },
  tierBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tierBadgeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  tierLabel: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  tierPoints: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  redeemedCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    alignItems: 'center',
    gap: 8,
  },
  redeemedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  redeemedTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '700',
  },
  voucherCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  voucherCodeLabel: {
    color: Colors.muted,
    fontSize: 12,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyBtnText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '700',
  },
  voucherCodeValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
  },
  voucherPercent: {
    color: Colors.text,
    fontSize: 14,
  },
  voucherExpires: {
    color: Colors.muted,
    fontSize: 12,
  },
  useVoucherBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  useVoucherBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  confirmModal: {
    gap: 0,
  },
  confirmTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmTierDisabled: {
    opacity: 0.5,
  },
  confirmTierInfo: {
    flex: 1,
  },
  confirmTierLabel: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  confirmTierMeta: {
    color: Colors.muted,
    fontSize: 12,
  },
  confirmTierBtn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  confirmTierBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmCancelBtn: {
    marginTop: 8,
    alignItems: 'center',
    padding: 12,
  },
  confirmCancelText: {
    color: Colors.muted,
    fontSize: 15,
    fontWeight: '500',
  },
});
