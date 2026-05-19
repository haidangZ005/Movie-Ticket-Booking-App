import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import cinemaService, { Cinema } from '../../services/cinemaService';

const CinemaListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadCinemas = async () => {
    try {
      setError('');
      const result = await cinemaService.getAll({ limit: 100 });
      setCinemas(result.data?.items || result.data || []);
    } catch {
      setError('Khong tai duoc danh sach rap.');
      setCinemas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCinemas();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCinemas();
    setRefreshing(false);
  };

  const handleCinemaPress = (cinema: Cinema) => {
    navigation.navigate('Showtime', { cinemaId: cinema.CinemaID, cinemaName: cinema.CinemaName });
  };

  const renderCinemaItem = ({ item }: { item: Cinema }) => (
    <TouchableOpacity style={styles.cinemaCard} onPress={() => handleCinemaPress(item)} activeOpacity={0.8}>
      <View style={styles.cinemaIcon}>
        <Ionicons name="business-outline" size={28} color={Colors.primary} />
      </View>
      <View style={styles.cinemaInfo}>
        <Text style={styles.cinemaName}>{item.CinemaName}</Text>
        <Text style={styles.cinemaAddress} numberOfLines={2}>{item.Address || '-'}</Text>
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
          <Text style={styles.loadingText}>Dang tai danh sach rap...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Rap chieu</Text>
          <Text style={styles.headerSubtitle}>{cinemas.length} rap chieu</Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={cinemas}
        keyExtractor={(item) => item.CinemaID.toString()}
        renderItem={renderCinemaItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="film-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Chua co cum rap nao</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textMuted, marginTop: 12, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  backBtn: { marginRight: 14 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.white },
  headerSubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  errorText: { color: Colors.error, paddingHorizontal: 20, marginBottom: 12 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  cinemaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 12 },
  cinemaIcon: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(252, 196, 52, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cinemaInfo: { flex: 1 },
  cinemaName: { fontSize: 16, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  cinemaAddress: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  cityBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  cityText: { fontSize: 12, color: Colors.primary, marginLeft: 4, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.textMuted, marginTop: 12, fontSize: 14 },
});

export default CinemaListScreen;
