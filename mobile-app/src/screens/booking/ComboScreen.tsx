import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Image, Alert, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ShowInfo } from '../../services/showService';
import productService from '../../services/productService';
import { API_ORIGIN } from '../../config/api';

// ── Types ──────────────────────────────────────
export type ProductCategory = 'ALL' | 'POPCORN' | 'DRINK' | 'COMBO' | 'SNACK' | 'OTHER';

export interface Product {
  ProductID: number;
  ProductName: string;
  Category: ProductCategory;
  Description: string;
  Price: number;
  ImageUrl: string;
  IsActive: boolean;
}

export interface AddonItem {
  ProductID: number;
  ProductName: string;
  Category: ProductCategory;
  Price: number;
  quantity: number;
  subtotal: number;
  ImageUrl: string;
}

// ── Helpers ────────────────────────────────────
const formatVND = (v: number) => v.toLocaleString('vi-VN') + 'đ';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
  } catch { return dateStr; }
};

const resolvePosterUrl = (url?: string): string | null => {
  if (!url) return null;
  const normalized = url.replace(/\\/g, '/');
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }
  if (normalized.startsWith('/uploads') || normalized.startsWith('uploads')) {
    const cleanUrl = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return `${API_ORIGIN}${cleanUrl}`;
  }
  return `${API_ORIGIN}/uploads/movies/${normalized}`;
};

const resolveImageUrl = (url?: string): string | null => {
  if (!url) return null;
  const normalized = url.replace(/\\/g, '/');
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }
  if (normalized.startsWith('/uploads') || normalized.startsWith('uploads')) {
    const cleanUrl = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return `${API_ORIGIN}${cleanUrl}`;
  }
  return `${API_ORIGIN}/uploads/products/${normalized}`;
};

export const calculateAddonItems = (quantities: Record<number, number>, products: Product[]): AddonItem[] =>
  products
    .filter(p => (quantities[p.ProductID] ?? 0) > 0)
    .map(p => ({ 
      ProductID: p.ProductID, 
      ProductName: p.ProductName, 
      Category: p.Category,
      Price: p.Price, 
      quantity: quantities[p.ProductID], 
      subtotal: p.Price * quantities[p.ProductID],
      ImageUrl: p.ImageUrl
    }));

export const calculateTotals = (addonItems: AddonItem[], ticketTotal: number) => {
  const addonTotal = addonItems.reduce((s, i) => s + i.subtotal, 0);
  const addonCount = addonItems.reduce((s, i) => s + i.quantity, 0);
  return { addonTotal, addonCount, grandTotal: ticketTotal + addonTotal };
};

// ── Config ─────────────────────────────────────
const CATEGORY_TABS: { label: string; value: ProductCategory }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: '🍿 Bắp', value: 'POPCORN' },
  { label: '🥤 Nước', value: 'DRINK' },
  { label: '🎁 Combo', value: 'COMBO' },
  { label: 'Snack', value: 'SNACK' },
  { label: '🌭 Khác', value: 'OTHER' },
];

const CATEGORY_LABELS = CATEGORY_TABS.reduce<Record<ProductCategory, string>>((labels, tab) => {
  labels[tab.value] = tab.label;
  return labels;
}, {} as Record<ProductCategory, string>);

const normalizeCategory = (category?: string): Exclude<ProductCategory, 'ALL'> => {
  const normalized = (category || '').toUpperCase();
  if (normalized === 'POPCORN' || normalized === 'DRINK' || normalized === 'COMBO' || normalized === 'SNACK') {
    return normalized;
  }
  return 'OTHER';
};

// ── Route types ────────────────────────────────
type Seat = { SeatID: number; SeatNumber: string; SeatPrice?: number };
type ComboRouteParams = {
  ComboScreen: {
    showInfo: ShowInfo & { PosterUrl?: string };
    selectedSeats: Seat[];
    totalPrice: number;
    movie?: { PosterUrl?: string };
    PosterUrl?: string;
    posterUrl?: string;
  };
};

// ── Component ──────────────────────────────────
const ComboScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ComboRouteParams, 'ComboScreen'>>();
  const insets = useSafeAreaInsets();
  const params = route.params;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('ALL');
  const [posterError, setPosterError] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await productService.getProducts();
      if (response.code === 1000 && response.data) {
        const mapped: Product[] = response.data
          .filter(p => p.IsActive)
          .map(p => {
            return {
              ProductID: p.ProductID,
              ProductName: p.ProductName,
              Category: normalizeCategory(p.ProductCategory),
              Description: p.ProductDescription || '',
              Price: p.ProductPrice,
              ImageUrl: resolveImageUrl(p.ImageProduct) || '',
              IsActive: p.IsActive ?? true
            };
          });
        setProducts(mapped);
      } else {
        setError('Không thể tải dữ liệu sản phẩm.');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  if (!params?.showInfo || !params?.selectedSeats) {
    return (
      <SafeAreaView style={S.container}>
        <View style={S.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={S.headerTitle}>Chọn đồ ăn kèm</Text>
        </View>
        <View style={S.centerBox}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
          <Text style={S.errorText}>Không tìm thấy thông tin đặt vé.</Text>
          <TouchableOpacity style={S.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={S.retryText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { showInfo, selectedSeats, totalPrice: ticketTotal = 0, movie } = params;
  const rawPoster = movie?.PosterUrl || showInfo?.PosterUrl || params?.PosterUrl || params?.posterUrl;
  const posterUrl = resolvePosterUrl(rawPoster);
  const seatLabel = selectedSeats.map(s => s.SeatNumber).join(', ');

  const filteredProducts = useMemo(() => {
    return activeCategory === 'ALL' ? products : products.filter(p => p.Category === activeCategory);
  }, [activeCategory, products]);

  const categoryTabs = useMemo(() => {
    const categories = Array.from(new Set(products.map(p => p.Category)));
    return [
      CATEGORY_TABS[0],
      ...categories.map(value => ({ label: CATEGORY_LABELS[value] || value, value })),
    ];
  }, [products]);

  const addonItems = useMemo(() => calculateAddonItems(quantities, products), [quantities, products]);
  const { addonTotal, addonCount, grandTotal } = useMemo(
    () => calculateTotals(addonItems, ticketTotal),
    [addonItems, ticketTotal],
  );

  const increaseQty = (id: number) => setQuantities(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  const decreaseQty = (id: number) => setQuantities(prev => {
    const cur = prev[id] ?? 0;
    if (cur <= 0) return prev;
    return { ...prev, [id]: cur - 1 };
  });

  const buildPayload = (items: AddonItem[]) => ({
    showInfo, selectedSeats, ticketTotal,
    addonItems: items,
    addonTotal,
    grandTotal,
  });

  const navigate = (items: AddonItem[]) => {
    const payload = buildPayload(items);
    if (navigation.getState().routeNames.includes('PaymentScreen')) {
      navigation.navigate('PaymentScreen', payload);
    } else {
      console.log('[ComboScreen] payload:', JSON.stringify(payload, null, 2));
      Alert.alert(
        items.length ? 'Tiếp tục thanh toán' : 'Bỏ qua đồ ăn',
        `Vé: ${formatVND(ticketTotal)}\nĐồ ăn: ${formatVND(addonTotal)}\nTổng: ${formatVND(grandTotal)}\n\n(PaymentScreen chưa tồn tại)`,
        [{ text: 'OK' }],
      );
    }
  };

  const BOTTOM_H = 130 + insets.bottom;

  const renderCard = ({ item, index }: { item: Product; index: number }) => {
    const qty = quantities[item.ProductID] ?? 0;
    const selected = qty > 0;
    return (
      <View style={[S.card, index % 2 === 0 ? S.cardL : S.cardR, selected && S.cardSel]}>
        {selected && (
          <View style={S.badge}><Text style={S.badgeText}>{qty}</Text></View>
        )}
        <View style={S.imgWrap}>
          {item.ImageUrl ? (
            <Image source={{ uri: item.ImageUrl }} style={S.img} resizeMode="cover" />
          ) : (
            <View style={S.imgPlaceholder}>
              <Ionicons name="fast-food-outline" size={24} color={Colors.textMuted} />
            </View>
          )}
        </View>
        <Text style={S.pName} numberOfLines={2}>{item.ProductName}</Text>
        <Text style={S.pDesc} numberOfLines={1}>{item.Description}</Text>
        <View style={S.cardFoot}>
          <Text style={S.pPrice}>{formatVND(item.Price)}</Text>
          <View style={S.qtyRow}>
            <TouchableOpacity
              style={[S.qtyBtn, qty === 0 && S.qtyBtnOff]}
              onPress={() => decreaseQty(item.ProductID)}
              disabled={qty === 0}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
            >
              <Ionicons name="remove" size={15} color={qty === 0 ? '#444' : Colors.primary} />
            </TouchableOpacity>
            <Text style={S.qtyNum}>{qty}</Text>
            <TouchableOpacity
              style={S.qtyBtn}
              onPress={() => increaseQty(item.ProductID)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
            >
              <Ionicons name="add" size={15} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={S.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={S.centerBox}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
          <Text style={S.errorText}>{error}</Text>
          <TouchableOpacity style={S.retryBtn} onPress={loadProducts}>
            <Text style={S.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredProducts}
        keyExtractor={item => String(item.ProductID)}
        renderItem={renderCard}
        numColumns={2}
        contentContainerStyle={[S.grid, { paddingBottom: BOTTOM_H + 8 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={S.emptyBox}>
            <Ionicons name="cube-outline" size={40} color={Colors.border} />
            <Text style={S.emptyTxt}>Hiện chưa có sản phẩm</Text>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Chọn đồ ăn kèm</Text>
      </View>

      {/* Movie summary card */}
      <View style={S.movieCard}>
        {/* Poster */}
        <View style={S.posterWrap}>
          {posterUrl && !posterError ? (
            <Image 
              source={{ uri: posterUrl }} 
              style={S.poster} 
              resizeMode="cover" 
              onError={() => setPosterError(true)}
            />
          ) : (
            <View style={S.posterPlaceholder}>
              <Ionicons name="film-outline" size={24} color={Colors.textMuted} />
            </View>
          )}
        </View>
        {/* Info */}
        <View style={S.movieInfo}>
          <Text style={S.movieTitle} numberOfLines={2}>{showInfo.MovieTitle}</Text>
          <Text style={S.movieSub} numberOfLines={1}>
            {showInfo.CinemaName}  ·  {showInfo.HallName}
          </Text>
          <Text style={S.movieSub} numberOfLines={1}>
            {showInfo.ShowTime?.substring(0, 5)}  ·  {formatDate(showInfo.ShowDate as any)}  ·  {showInfo.Format}
          </Text>
          <View style={S.movieRow}>
            <Ionicons name="grid-outline" size={11} color={Colors.textMuted} />
            <Text style={S.movieSeat} numberOfLines={1}>  {seatLabel}</Text>
          </View>
          <Text style={S.moviePrice}>{formatVND(ticketTotal)}</Text>
        </View>
      </View>

      {/* Category tabs */}
      <View style={S.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tabsInner}>
          {categoryTabs.map(tab => {
            const active = activeCategory === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[S.tab, active && S.tabActive]}
                onPress={() => setActiveCategory(tab.value)}
                activeOpacity={0.7}
              >
                <Text style={[S.tabTxt, active && S.tabTxtActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Product grid / Loading / Error */}
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>

      {/* Bottom bar */}
      <View style={[S.bottom, { paddingBottom: insets.bottom + 12 }]}>
        {/* Price breakdown */}
        <View style={S.priceRows}>
          <View style={S.priceRow}>
            <Text style={S.priceLabel}>Tiền vé</Text>
            <Text style={S.priceVal}>{formatVND(ticketTotal)}</Text>
          </View>
          <View style={S.priceRow}>
            <Text style={S.priceLabel}>
              Đồ ăn{addonCount > 0 ? ` (${addonCount} món)` : ''}
            </Text>
            <Text style={[S.priceVal, addonCount > 0 && { color: Colors.primary }]}>
              {formatVND(addonTotal)}
            </Text>
          </View>
          <View style={[S.priceRow, S.priceRowTotal]}>
            <Text style={S.totalLabel}>Tổng thanh toán</Text>
            <Text style={S.totalVal}>{formatVND(grandTotal)}</Text>
          </View>
        </View>
        {/* Buttons */}
        <View style={S.btns}>
          <TouchableOpacity style={S.skipBtn} onPress={() => navigate([])} activeOpacity={0.7}>
            <Text style={S.skipTxt}>Bỏ qua</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.continueBtn} onPress={() => navigate(addonItems)} activeOpacity={0.85}>
            <Text style={S.continueTxt}>Tiếp tục thanh toán</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ComboScreen;

// ── Styles ─────────────────────────────────────
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { paddingRight: 12 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.white },

  // Error/Loading
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginHorizontal: 24 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: Colors.card, borderRadius: 8, marginTop: 4 },
  retryText: { color: Colors.primary, fontWeight: '600' },

  // Movie card
  movieCard: { flexDirection: 'row', backgroundColor: '#1A1A1A', marginHorizontal: 14, marginTop: 12, marginBottom: 10, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: '#2A2A2A', gap: 12 },
  posterWrap: { width: 72, height: 104, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1E1E1E' },
  poster: { width: '100%', height: '100%' },
  posterPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1E1E' },
  movieInfo: { flex: 1, justifyContent: 'center', gap: 3 },
  movieTitle: { color: Colors.white, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  movieSub: { color: Colors.textMuted, fontSize: 11, lineHeight: 15 },
  movieRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  movieSeat: { color: Colors.textMuted, fontSize: 11, flex: 1 },
  moviePrice: { color: Colors.primary, fontSize: 13, fontWeight: '700', marginTop: 4 },

  // Tabs
  tabsWrapper: { borderBottomWidth: 1, borderBottomColor: '#222', height: 44 },
  tabsInner: { paddingHorizontal: 14, alignItems: 'center', gap: 8, height: 44 },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#333', backgroundColor: '#111' },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabTxt: { fontSize: 13, fontWeight: '500', color: '#999' },
  tabTxtActive: { color: '#000', fontWeight: '700' },

  // Grid
  grid: { paddingHorizontal: 12, paddingTop: 10 },
  card: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 14, padding: 8, marginBottom: 10, borderWidth: 1.5, borderColor: '#2A2A2A', position: 'relative' },
  cardL: { marginRight: 5 },
  cardR: { marginLeft: 5 },
  cardSel: { borderColor: Colors.primary, backgroundColor: '#1F1A00' },
  badge: { position: 'absolute', top: 6, right: 6, backgroundColor: Colors.primary, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  badgeText: { color: '#000', fontSize: 10, fontWeight: '700' },
  imgWrap: { width: '100%', aspectRatio: 4 / 3, borderRadius: 9, overflow: 'hidden', backgroundColor: '#111', marginBottom: 7 },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1E1E' },
  pName: { color: Colors.white, fontSize: 12, fontWeight: '600', lineHeight: 16, marginBottom: 2 },
  pDesc: { color: Colors.textMuted, fontSize: 10, marginBottom: 6 },
  cardFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pPrice: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A', borderRadius: 20, paddingHorizontal: 2 },
  qtyBtn: { padding: 5 },
  qtyBtnOff: { opacity: 0.3 },
  qtyNum: { color: Colors.white, fontSize: 12, fontWeight: '700', minWidth: 15, textAlign: 'center' },

  // Empty
  emptyBox: { padding: 40, alignItems: 'center', gap: 8 },
  emptyTxt: { color: Colors.textMuted, fontSize: 14 },

  // Bottom bar
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#2A2A2A', paddingHorizontal: 16, paddingTop: 10 },
  priceRows: { gap: 4, marginBottom: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceRowTotal: { borderTopWidth: 1, borderTopColor: '#2A2A2A', paddingTop: 6, marginTop: 2 },
  priceLabel: { color: Colors.textMuted, fontSize: 12 },
  priceVal: { color: Colors.white, fontSize: 12, fontWeight: '500' },
  totalLabel: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  totalVal: { color: Colors.primary, fontSize: 18, fontWeight: '700' },
  btns: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skipBtn: { paddingVertical: 12, paddingHorizontal: 4 },
  skipTxt: { color: Colors.textMuted, fontSize: 14, textDecorationLine: 'underline' },
  continueBtn: { flex: 1, backgroundColor: Colors.primary, paddingVertical: 13, borderRadius: 26, alignItems: 'center' },
  continueTxt: { color: '#000', fontSize: 14, fontWeight: '700' },
});
