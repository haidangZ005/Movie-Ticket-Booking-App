import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.45;

export default function MovieDetailScreen() {
  const navigation = useNavigation();

  const directors = [
    { id: '1', name: 'Anthony\nRusso', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop' },
    { id: '2', name: 'Joe\nRusso', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop' },
  ];

  const actors = [
    { id: '1', name: 'Robert\nDowney Jr.', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop' },
    { id: '2', name: 'Chris\nHemsworth', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop' },
    { id: '3', name: 'Chris\nEvans', image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop' },
  ];

  const cinemas = [
    { id: '1', name: 'Vincom Ocean Park CGV', distance: '4.55 km', address: 'Da Ton, Gia Lam, Ha Noi', type: 'cgv' },
    { id: '2', name: 'Aeon Mall CGV', distance: '9.32 km', address: '27 Co Linh, Long Bien, Ha Noi', type: 'cgv' },
    { id: '3', name: 'Lotte Cinema Long Bien', distance: '14.3 km', address: '7-9 Nguyen Van Linh, Long Bien, Ha Noi', type: 'lotte' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image 
            source={{ uri: 'https://m.media-amazon.com/images/M/MV5BMjMxNjY2MDU1OV5BMl5BanBnXkFtZTgwNzY1MTUwNTM@._V1_.jpg' }} 
            style={styles.heroImage} 
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']}
            style={styles.heroGradient}
          />
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Info Overlay Card */}
        <View style={styles.infoCardContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.movieTitle}>Avengers: Infinity War</Text>
            <Text style={styles.movieMeta}>2h29m • 16.12.2022</Text>
            
            <View style={styles.ratingRow}>
              <View style={styles.ratingLeft}>
                <Text style={styles.reviewLabel}>Review</Text>
                <Ionicons name="star" size={16} color={Colors.primary} style={{ marginHorizontal: 6 }} />
                <Text style={styles.ratingText}>4.8</Text>
                <Text style={styles.ratingCount}>(1.222)</Text>
              </View>
              <View style={styles.starsRow}>
                <Ionicons name="star" size={24} color="#333" />
                <Ionicons name="star" size={24} color="#333" />
                <Ionicons name="star" size={24} color="#333" />
                <Ionicons name="star" size={24} color="#333" />
                <Ionicons name="star" size={24} color="#333" />
              </View>
              <TouchableOpacity style={styles.trailerBtn}>
                <Ionicons name="play" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.trailerBtnText}>Watch trailer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Details Rows */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Movie genre:</Text>
            <Text style={styles.detailValue}>Action, adventure, sci-fi</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Language:</Text>
            <Text style={styles.detailValue}>English</Text>
          </View>
        </View>

        {/* Movie Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Movie Description</Text>
          <Text style={styles.storylineText}>
            As the Avengers and their allies have continued to protect the world from threats too large for any one hero to handle, a new danger has emerged from the cosmic shadows: Thanos....{' '}
            <Text style={styles.seeMoreText}>See more</Text>
          </Text>
        </View>

        {/* Director */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Director</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {directors.map(dir => (
              <View key={dir.id} style={styles.personCardSmall}>
                <Image source={{ uri: dir.image }} style={styles.personImageSmall} />
                <Text style={styles.personName}>{dir.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Actor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actor</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {actors.map(actor => (
              <View key={actor.id} style={styles.personCardLarge}>
                <Image source={{ uri: actor.image }} style={styles.personImageLarge} />
                <Text style={styles.personName}>{actor.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Cinema */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cinema</Text>
          {cinemas.map((cinema, index) => (
            <TouchableOpacity 
              key={cinema.id} 
              style={[
                styles.cinemaCard, 
                index === 0 && styles.cinemaCardActive // Make first one active for demo
              ]}
            >
              <View style={styles.cinemaInfo}>
                <Text style={styles.cinemaTitle}>{cinema.name}</Text>
                <Text style={styles.cinemaAddress}>
                  {cinema.distance} | {cinema.address}
                </Text>
              </View>
              {/* Dummy Logo Placeholder */}
              <View style={styles.cinemaLogoPlaceholder}>
                <Text style={styles.cinemaLogoText}>{cinema.type === 'cgv' ? 'CGV' : 'LOTTE'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.continueButton}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // space for bottom button
  },

  // Hero Image
  heroContainer: {
    width: width,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Info Card overlapping hero
  infoCardContainer: {
    paddingHorizontal: 20,
    marginTop: -80, // Overlap
  },
  infoCard: {
    backgroundColor: '#1C1B1B',
    borderRadius: 20,
    padding: 20,
  },
  movieTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  movieMeta: {
    fontSize: 14,
    color: '#A1A1AA',
    marginBottom: 20,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  ratingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ratingCount: {
    fontSize: 12,
    color: '#A1A1AA',
    marginLeft: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  trailerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  trailerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Details
  detailsSection: {
    paddingHorizontal: 20,
    marginTop: 32,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
  },
  detailLabel: {
    width: 110,
    fontSize: 14,
    color: '#A1A1AA',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Generic Sections
  section: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  
  // Storyline
  storylineText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  seeMoreText: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // Horizontal Lists
  horizontalList: {
    gap: 12,
  },
  
  // Director Card
  personCardSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1B1B',
    borderRadius: 12,
    padding: 8,
    paddingRight: 16,
    width: 140,
  },
  personImageSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  
  // Actor Card
  personCardLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1B1B',
    borderRadius: 12,
    padding: 8,
    paddingRight: 16,
    width: 160,
  },
  personImageLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  personName: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
  },

  // Cinema List
  cinemaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1B1B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cinemaCardActive: {
    borderColor: Colors.primary,
  },
  cinemaInfo: {
    flex: 1,
  },
  cinemaTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  cinemaAddress: {
    color: '#A1A1AA',
    fontSize: 12,
  },
  cinemaLogoPlaceholder: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  cinemaLogoText: {
    color: '#D00000', // CGV red-like
    fontWeight: '900',
    fontSize: 10,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: '#000000', // Solid black to hide scroll content
  },
  continueButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});
