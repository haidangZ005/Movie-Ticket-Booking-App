import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import BottomNavBar from '../../components/common/BottomNavBar';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2; // 20px padding left, 20px padding right, 20px gap between columns = 60

const MOCK_MOVIES = [
  {
    id: '1',
    title: 'Shang chi: Legend of the Ten Rings',
    rating: '4.0 (982)',
    duration: '2 hour 5 minutes',
    genre: 'Action, Sci-fi',
    image: 'https://m.media-amazon.com/images/M/MV5BNTliYjlkNDQtMjFlOS00NjQwLWEzYWEtNDg1MTRlNzhhYjg2XkEyXkFqcGc@._V1_.jpg',
  },
  {
    id: '2',
    title: 'Batman v Superman: Dawn of Justice',
    rating: '4.0 (982)',
    duration: '2 hour 10 minutes',
    genre: 'Action, Sci-fi',
    image: 'https://m.media-amazon.com/images/M/MV5BYThjYzE4NDctZTViZC00MDM0LWEwMTAtYjc0MjI5ZTBkNTQ1XkEyXkFqcGc@._V1_.jpg',
  },
  {
    id: '3',
    title: 'Avengers: Infinity War',
    rating: '4.8 (1200)',
    duration: '2 hour 29 minutes',
    genre: 'Action, Sci-fi',
    image: 'https://m.media-amazon.com/images/M/MV5BMjMxNjY2MDU1OV5BMl5BanBnXkFtZTgwNzY1MTUwNTM@._V1_.jpg',
  },
  {
    id: '4',
    title: 'Guardians of the Galaxy',
    rating: '4.5 (890)',
    duration: '2 hour 1 minutes',
    genre: 'Action, Sci-fi',
    image: 'https://m.media-amazon.com/images/M/MV5BMTAwMjU5OTgxNjZeQTJeQWpwZ15BbWU4MDIzMDg0Njcx._V1_.jpg',
  },
];

export default function MovieScreen() {
  const [activeTab, setActiveTab] = useState('NowPlaying');
  const navigation = useNavigation<any>();

  const renderMovie = ({ item }: { item: typeof MOCK_MOVIES[0] }) => (
    <TouchableOpacity style={styles.movieCard} onPress={() => navigation.navigate('MovieDetail')}>
      <Image source={{ uri: item.image }} style={styles.poster} />
      <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
      
      <View style={styles.metaRow}>
        <Ionicons name="star" size={14} color={Colors.primary} />
        <Text style={styles.metaText}>{item.rating}</Text>
      </View>
      
      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.metaText}>{item.duration}</Text>
      </View>
      
      <View style={styles.metaRow}>
        <Ionicons name="videocam-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.metaText}>{item.genre}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainerWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'NowPlaying' && styles.tabBtnActive]}
            onPress={() => setActiveTab('NowPlaying')}
          >
            <Text style={[styles.tabText, activeTab === 'NowPlaying' && styles.tabTextActive]}>Now playing</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'ComingSoon' && styles.tabBtnActive]}
            onPress={() => setActiveTab('ComingSoon')}
          >
            <Text style={[styles.tabText, activeTab === 'ComingSoon' && styles.tabTextActive]}>Coming soon</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Movie Grid */}
      <FlatList
        data={MOCK_MOVIES}
        renderItem={renderMovie}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Nav */}
      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  
  // Tab Switcher
  tabContainerWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1B1B',
    borderRadius: 30,
    padding: 4,
    height: 60,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  tabTextActive: {
    color: '#000000',
  },

  // Grid
  gridContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120, // space for bottom nav
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  
  // Movie Card
  movieCard: {
    width: COLUMN_WIDTH,
  },
  poster: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#1C1B1B',
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
    lineHeight: 22,
    minHeight: 44, // roughly 2 lines to align items
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#E5E5E5',
    marginLeft: 6,
    fontWeight: '400',
  },
});
