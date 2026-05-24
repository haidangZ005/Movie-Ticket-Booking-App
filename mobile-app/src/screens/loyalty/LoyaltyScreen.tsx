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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
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
  const [currentPoints, setCurrentPoints] = useState(0);
  const [history, setHistory] = useState<LoyaltyHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchLoyalty = async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      const data = await loyaltyService.getPointsHistory(pageNum, 20);
      if (isRefresh || pageNum === 1) {
        setHistory(data.history);
      } else {
        setHistory(prev => [...prev, ...data.history]);
      }
      setCurrentPoints(data.currentPoints);
      setHasMore((data.history?.length ?? 0) === 20);
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

  const renderHeader = () => (
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn}>
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
});
