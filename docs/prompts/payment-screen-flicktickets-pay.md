# Prompt: Chuyen giao dien thanh toan Stitch sang React Native

Toi dang co giao dien thanh toan duoc tao bang Stitch, ma hien tai chu yeu la HTML/CSS tinh. Hay chuyen no thanh man hinh React Native phu hop voi project Movie-Ticket-Booking-App.

## Luu y quan trong

- Du an dung cong thanh toan tu tao rieng.
- Khong hien thi MoMo, ZaloPay, Visa, ATM.
- Chi co 1 phuong thuc thanh toan duy nhat: cong thanh toan noi bo cua he thong.
- UI nen the hien la "Thanh toan qua FlickTickets Pay" hoac "Cong thanh toan FlickTickets".

## Boi canh project

- Mobile app dung React Native.
- Flow hien tai:
  `SeatSelectionScreen -> ComboScreen -> PaymentScreen`.
- `ComboScreen` truyen sang `PaymentScreen`:
  - `showInfo`
  - `selectedSeats`
  - `ticketTotal`
  - `addonItems`
  - `addonTotal`
  - `grandTotal`
- Backend chua can thanh toan that ngay, nhung can chuan bi payload phu hop de sau nay goi payment gateway tu tao.
- Theme app: nen toi, mau vang chu dao.

## Yeu cau chinh

1. Tao hoac sua `mobile-app/src/screens/payment/PaymentScreen.tsx`.
2. Khong dung HTML tag nhu `div`, `span`, `button`, `img`.
3. Chuyen toan bo layout Stitch HTML sang React Native:
   - `View`
   - `Text`
   - `TouchableOpacity`
   - `ScrollView`
   - `Image`
   - `TextInput`
   - `SafeAreaView`
4. Khong hardcode du lieu phim, ghe, combo, tong tien.
5. Lay du lieu tu `route.params` do `ComboScreen` truyen sang.
6. Neu thieu route params thi hien thi man hinh loi co nut quay lai.

## Du lieu dau vao du kien

```ts
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
```

## Yeu cau giao dien

1. Header:
   - Nut back ben trai.
   - Tieu de "Thanh toan".
   - Icon home ben phai neu project dang dung Ionicons.
2. Banner canh bao:
   - Noi dung: "Ve da mua se khong the hoan, huy, doi. Vui long kiem tra ky thong tin."
3. Card thong tin phim:
   - Poster phim ben trai.
   - Ten phim.
   - Rap.
   - Nhan do tuoi neu co thi hien thi, neu khong co thi `13+` mac dinh.
   - Dinh dang phim nhu `2D`/`3D`/`IMAX` neu co.
4. Card lich chieu va ghe:
   - Thoi gian chieu.
   - Ngay chieu.
   - Phong chieu.
   - Danh sach ghe da chon.
5. Card combo bap nuoc:
   - Neu `addonItems.length > 0`, hien thi tung mon:
     - Anh san pham neu co.
     - Ten san pham.
     - So luong.
     - Thanh tien.
   - Neu khong co do an thi hien thi "Khong chon do an kem".
6. Card thong tin nguoi nhan:
   - Lay tu auth/user state neu project da co.
   - Neu chua co thi dung placeholder:
     - Ten khach hang
     - So dien thoai
     - Email
   - Co icon edit nhung chua can mo modal.
7. Phan phuong thuc thanh toan:
   - Khong co list nhieu phuong thuc.
   - Chi hien thi 1 card duy nhat:
     - Icon vi/the/QR.
     - Ten: "FlickTickets Pay".
     - Mo ta: "Thanh toan qua cong thanh toan noi bo".
     - Trang thai: "Da chon".
   - Khong can radio nhieu lua chon.
8. Ma giam gia:
   - `TextInput` nhap voucher.
   - Button "Ap dung".
   - Tam thoi chua goi API voucher.
   - Neu input rong thi Alert bao nhap ma.
   - Neu co ma thi Alert bao "Tinh nang voucher se duoc ket noi sau".
9. Tong tien:
   - Tien ve = `ticketTotal`.
   - Tien do an = `addonTotal`.
   - Giam gia = `0`.
   - Phi dich vu = `0`.
   - Tong thanh toan = `grandTotal`.
10. Bottom fixed bar:
    - Ben trai: tong cong.
    - Ben phai: button "Thanh toan ngay".
    - Button goi `handlePayNow`.

## Yeu cau logic

1. Khong can state `selectedPaymentMethod` vi chi co mot phuong thuc.
2. Khai bao constant:

```ts
const PAYMENT_METHOD = 'FLICKTICKETS_PAY';
```

3. `formatVND(amount)` format tien kieu `385.000d`.
4. `formatDate(date)` format ngay `dd/MM/yyyy`.
5. `formatTime(time)` hien thi gio chieu.
6. `resolvePosterUrl(url)`:
   - URL day du thi dung luon.
   - `/uploads/...` thi noi voi `API_ORIGIN`.
   - filename thi noi `/uploads/movies/filename`.
7. `handlePayNow` build payload:

```ts
const paymentPayload = {
  showId: showInfo.ShowID,
  seatIds: selectedSeats.map(s => s.SeatID),
  products: addonItems.map(item => ({
    productId: item.ProductID,
    quantity: item.quantity,
    price: item.Price,
  })),
  ticketTotal,
  addonTotal,
  discountAmount: 0,
  serviceFee: 0,
  totalAmount: grandTotal,
  paymentMethod: PAYMENT_METHOD,
};
```

8. Tam thoi `console.log(paymentPayload)`.
9. Alert thong bao "Dang chuyen sang cong thanh toan FlickTickets".
10. Khong tao booking that neu backend chua co API thanh toan/booking hoan chinh.
11. Component phai chay duoc ke ca `addonItems` rong.

## Yeu cau code

1. Dung TypeScript.
2. Dung `StyleSheet.create`.
3. Dung `Ionicons` neu project da dung.
4. Dung `Colors` tu `mobile-app/src/constants/colors`.
5. Giu style nen toi, card bo goc vua phai, mau vang lam accent.
6. `ScrollView` phai co `paddingBottom` du lon de khong bi bottom bar che.
7. Bottom bar dung safe area inset.
8. Text dai phai co `numberOfLines`.
9. Khong them thu vien moi.
10. Chay `npx tsc --noEmit` sau khi sua.

## Ket qua mong muon

- `PaymentScreen` chuyen tu HTML Stitch sang React Native.
- Chi con mot phuong thuc "FlickTickets Pay".
- Man hinh nhan du lieu that tu `ComboScreen`.
- Hien thi day du thong tin phim, rap, lich chieu, ghe, do an, nguoi nhan, voucher, tong tien.
- Co payload san de sau nay goi payment gateway tu tao.
