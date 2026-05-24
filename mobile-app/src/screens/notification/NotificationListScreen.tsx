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
import { notificationService, NotificationItem } from '../../services/notificationService';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'BOOKING': return 'ticket';
    case 'PAYMENT': return 'card';
    case 'CANCEL': return 'close-circle';
    case 'REFUND': return 'wallet';
    case 'PROMO': return 'pricetag';
    default: return 'notifications';
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'BOOKING': return '#4CAF50';
    case 'PAYMENT': return '#2196F3';
    case 'CANCEL': return '#F44336';
    case 'REFUND': return '#FF9800';
    case 'PROMO': return '#9C27B0';
    default: return Colors.primary;
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function NotificationListScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      const data = await notificationService.getNotifications(pageNum, 20);
      if (isRefresh || pageNum === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }
      setHasMore(data.notifications.length === 20);
      setPage(pageNum);
    } catch (err) {
      console.error('[NotificationList] Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('[NotificationList] Unread count error:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications(1);
      fetchUnreadCount();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(1, true);
  };

  const handleLoadMore = () => {
    if (!hasMore || loading) return;
    fetchNotifications(page + 1);
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.NotificationID === id ? { ...n, IsRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NotificationList] Mark as read error:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, IsRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationList] Mark all as read error:', err);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const iconName = getNotificationIcon(item.Type);
    const iconColor = getNotificationColor(item.Type);

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.IsRead && styles.unreadCard]}
        onPress={() => !item.IsRead && handleMarkAsRead(item.NotificationID)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={iconName as any} size={20} color={iconColor} />
        </View>
        <View style={styles.contentBox}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, !item.IsRead && styles.unreadTitle]} numberOfLines={1}>
              {item.Title}
            </Text>
            {!item.IsRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.message} numberOfLines={2}>{item.Message}</Text>
          <Text style={styles.date}>{formatDate(item.DateSend)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color={Colors.muted} />
      <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
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
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => {}} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông báo</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => String(item.NotificationID)}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  markAllText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unreadCard: {
    backgroundColor: '#1a1a0f',
    borderColor: 'rgba(252, 196, 52, 0.3)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentBox: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
  message: {
    color: Colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  date: {
    color: Colors.muted,
    fontSize: 12,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
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
