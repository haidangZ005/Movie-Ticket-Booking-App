import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCinemas } from '../../store/slices/cinemaSlice';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Cinema } from '../../services/cinemaService';
import type { AppDispatch, RootState } from '../../store/store';

// ============================================
// CinemaListScreen — Hiển thị danh sách cụm rạp
// ============================================

const CinemaListScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const { cinemas, loading, error } = useSelector((state: RootState) => state.cinema);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch cinemas khi component mount
  useEffect(() => {
    dispatch(fetchCinemas());
  }, [dispatch]);

  // Kéo xuống để làm mới
  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchCinemas());
    setRefreshing(false);
  };

  // Điều hướng tới chi tiết rạp
  const handleCinemaPress = (cinemaId: number) => {
    navigation.navigate('Showtime', { cinemaId });
  };

  // Render từng thẻ rạp
  const renderCinemaItem = ({ item }: { item: Cinema }) => (
    <TouchableOpacity
      style={styles.cinemaCard}
      onPress={() => handleCinemaPress(item.CinemaID)}
      activeOpacity={0.8}
    >
      <View style={styles.cinemaIcon}>
        <Ionicons name="business-outline" size={28} color={Colors.primary} />
      </View>
      <View style={styles.cinemaInfo}>
        <Text style={styles.cinemaName}>{item.CinemaName}</Text>
        <Text style={styles.cinemaAddress} numberOfLines={2}>{item.CinemaAddress}</Text>
        {item.CityName && (
          <View style={styles.cityBadge}>
            <Ionicons name="location-outline" size={12} color={Colors.primary} />
            <Text style={styles.cityText}>{item.CityName}</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  if (loading && cinemas.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách rạp...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cụm rạp chiếu phim</Text>
        <Text style={styles.headerSubtitle}>{cinemas.length} rạp</Text>
      </View>

      {/* Danh sách rạp */}
      <FlatList
        data={cinemas}
        keyExtractor={(item) => item.CinemaID.toString()}
        renderItem={renderCinemaItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="film-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Chưa có cụm rạp nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cinemaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cinemaIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(252, 196, 52, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cinemaInfo: {
    flex: 1,
  },
  cinemaName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  cinemaAddress: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  cityText: {
    fontSize: 12,
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: Colors.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
});

export default CinemaListScreen;
