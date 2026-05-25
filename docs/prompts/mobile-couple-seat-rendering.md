# Prompt: Render va xu ly chon ghe doi tren mobile

Hay them UI/UX va logic chon ghe doi `COUPLE` trong man hinh chon ghe mobile.

## Pham vi

Chi lam phan render va chon ghe doi tren mobile.

Khong lam WebSocket trong task nay.

## Boi canh

Project: `Movie-Ticket-Booking-App`

File chinh can sua:

```text
mobile-app/src/screens/booking/SeatSelectionScreen.tsx
```

Backend/admin da hoac se luu ghe doi bang 2 seat records co cung `PairID`.

Vi du:

```js
{
  SeatID: 21,
  SeatNumber: 'C3',
  SeatType: 'COUPLE',
  PairID: 'R3-C3-C4',
  RowIndex: 3,
  ColIndex: 3,
  Status: 'AVAILABLE'
}

{
  SeatID: 22,
  SeatNumber: 'C4',
  SeatType: 'COUPLE',
  PairID: 'R3-C3-C4',
  RowIndex: 3,
  ColIndex: 4,
  Status: 'AVAILABLE'
}
```

Yeu cau quan trong:

- Khong doi ten field backend.
- Khong doi API contract neu khong can.
- Khong bien 2 ghe couple thanh 1 item data.
- Van render theo `RowIndex` va `ColIndex`.
- Chi thay doi cach render va cach chon tren mobile.
- Khong sua WebSocket trong task nay.
- Khong sua file khong lien quan.

## Muc tieu

Mobile can:

1. Nhan du lieu ghe co `SeatType = 'COUPLE'` va cung `PairID`.
2. Render 2 ghe cung `PairID` nhin giong mot ghe doi.
3. Khi user bam vao mot nua ghe doi, app tu chon hoac bo chon ca cap.
4. Khong cho chon mot nua ghe doi.
5. Neu mot trong hai ghe trong cap da `BOOKED` hoac `HOLDING`, ca cap phai khong chon duoc.
6. Tong tien tinh dung cho ca 2 ghe trong cap.
7. Bottom summary hien thi ghe doi de hieu.

## Quy tac render ghe doi

Khi render tung ghe:

1. Neu `seat.SeatType === 'COUPLE'` va co `seat.PairID`, tim ghe cung cap trong danh sach `seats`.
2. Xac dinh ghe trai/phai bang `ColIndex`.
3. Them style:
   - `coupleSeat`
   - `coupleLeft`
   - `coupleRight`
4. Hai ghe cung cap nen nhin nhu mot cum:
   - Cung mau/vien ghe doi.
   - Border giua mo hoac bo border giua.
   - Ghe ben trai bo goc trai.
   - Ghe ben phai bo goc phai.
   - Gap giua 2 ghe nho hon ghe thuong neu layout cho phep.
5. Label van co the hien thi rieng:
   - `C3`
   - `C4`
6. Neu muon dep hon, them text nho hoac legend:
   - `Ghe doi`

## Mau sac de xuat

Dua tren theme hien tai:

- Ghe thuong: giu mau hien tai.
- Ghe VIP: giu mau hien tai.
- Ghe doi available: vien hong/do nhe.
- Ghe doi selected: nen vang giong selected seat, nhung van giu indicator couple.
- Ghe doi booked/holding: dung style booked/holding hien tai, ap dung cho ca cap.

Khong them thu vien moi.

## Helper can them

Viet helper lay cac ghe cung cap:

```ts
const getCoupleSeats = (seat: Seat, seatList: Seat[]) => {
  if (seat.SeatType !== 'COUPLE' || !seat.PairID) return [seat];
  return seatList.filter(item => item.PairID === seat.PairID);
};
```

Viet helper kiem tra ghe da chon:

```ts
const isSeatSelected = (seatId: number) => {
  return selectedSeats.some(item => item.SeatID === seatId);
};
```

Viet helper kiem tra ca cap da duoc chon:

```ts
const isCoupleSelected = (seat: Seat) => {
  const coupleSeats = getCoupleSeats(seat, seats);
  return coupleSeats.every(item => isSeatSelected(item.SeatID));
};
```

Viet helper kiem tra ghe bi khoa:

```ts
const isSeatUnavailable = (seat: Seat) => {
  return seat.Status === 'BOOKED' || seat.Status === 'HOLDING' || seat.SeatType === 'EMPTY' || seat.IsAisle;
};
```

Viet helper kiem tra cap ghe doi bi khoa:

```ts
const isCoupleUnavailable = (seat: Seat) => {
  const coupleSeats = getCoupleSeats(seat, seats);
  return coupleSeats.some(isSeatUnavailable);
};
```

## Logic chon ghe

Sua `handleSeatPress` hoac ham tuong duong.

Flow mong muon:

```ts
const handleSeatPress = (seat: Seat) => {
  if (isSeatUnavailable(seat)) return;

  if (seat.SeatType === 'COUPLE' && seat.PairID) {
    handleCoupleSeatPress(seat);
    return;
  }

  handleSingleSeatPress(seat);
};
```

Them logic couple:

```ts
const handleCoupleSeatPress = (seat: Seat) => {
  const coupleSeats = getCoupleSeats(seat, seats);

  if (coupleSeats.length !== 2) {
    Alert.alert('Loi ghe doi', 'Cau hinh ghe doi chua hop le.');
    return;
  }

  if (coupleSeats.some(isSeatUnavailable)) {
    Alert.alert('Ghe khong kha dung', 'Mot ghe trong cap da duoc dat hoac dang duoc giu.');
    return;
  }

  const selected = coupleSeats.every(item =>
    selectedSeats.some(selectedSeat => selectedSeat.SeatID === item.SeatID)
  );

  if (selected) {
    setSelectedSeats(prev =>
      prev.filter(item => !coupleSeats.some(coupleSeat => coupleSeat.SeatID === item.SeatID))
    );
    return;
  }

  const newSelectedCount = selectedSeats.length + coupleSeats.length;

  if (newSelectedCount > MAX_SELECTED_SEATS) {
    Alert.alert('Qua so luong ghe', `Ban chi co the chon toi da ${MAX_SELECTED_SEATS} ghe.`);
    return;
  }

  setSelectedSeats(prev => [...prev, ...coupleSeats]);
};
```

Giu logic chon ghe thuong hien tai, nhung dam bao khong pha gioi han so ghe.

## Single-seat gap constraint

Neu file dang co logic rang buoc chong trong ghe don:

- `COUPLE` van duoc tinh la ghe co the dat.
- Vi couple gom 2 ghe lien ke, khi chon couple phai dua ca 2 `SeatID` vao `selectedSeats`.
- Logic kiem tra gap nen chay sau khi `selectedSeats` da gom ca cap.
- Khong duoc kiem tra tren mot nua ghe couple.

## Render selected state

Khi render ghe:

```ts
const selected = seat.SeatType === 'COUPLE'
  ? isCoupleSelected(seat)
  : isSeatSelected(seat.SeatID);
```

Neu mot ghe trong cap selected thi ca cap phai render selected.

Tot nhat state luon chua ca 2 ghe, nen `isCoupleSelected` se chinh xac.

## Render disabled state

Khi render ghe:

```ts
const unavailable = seat.SeatType === 'COUPLE'
  ? isCoupleUnavailable(seat)
  : isSeatUnavailable(seat);
```

Neu mot nua bi `BOOKED` hoac `HOLDING`, ca cap phai render khong kha dung.

## Summary bottom

Neu hien tai `selectedSeats` dang hien thi:

```text
C3, C4
```

Co the giu nguyen de don gian.

Neu muon UX tot hon, gom couple theo `PairID`:

```ts
const getSelectedSeatLabel = () => {
  // group selectedSeats by PairID
  // couple C3 + C4 => "C3-C4"
  // ghe thuong => "A1"
};
```

Vi du:

```text
2 Ghe
C3-C4
```

hoac:

```text
Ghe doi C3-C4
```

Khuyen nghi lam grouping neu khong qua phuc tap.

## Legend

Them hoac cap nhat legend de co `Ghe doi`.

Vi du:

```text
Ghe thuong
Ghe VIP
Ghe doi
Dang chon
Da dat
Dang giu
```

Neu legend hien da co `Ghe doi`, giu lai nhung dam bao mau/style khop voi ghe couple that.

## Edge cases bat buoc xu ly

1. Ghe couple chi co 1 record cung `PairID` -> bao loi cau hinh khi bam.
2. Ghe couple co hon 2 record cung `PairID` -> bao loi cau hinh khi bam.
3. Mot nua couple `BOOKED`, nua con lai `AVAILABLE` -> ca cap khong chon duoc.
4. Mot nua couple `HOLDING`, nua con lai `AVAILABLE` -> ca cap khong chon duoc.
5. Bam mot nua selected couple -> bo chon ca cap.
6. Gioi han so ghe van dung:
   - Neu con chon duoc 1 ghe ma bam couple 2 ghe -> bao qua so luong.
7. Khong render ghe couple thanh 1 item duy nhat lam lech grid.
8. Tong tien phai tinh du ca 2 ghe trong cap.

## Khong lam trong task nay

- Khong them WebSocket.
- Khong them Redis holding.
- Khong sua API giu ghe.
- Khong sua backend tru khi type/API hien tai thieu field `PairID`/`SeatType`.

## Yeu cau kiem tra

Sau khi sua, chay:

```bash
npx tsc --noEmit
```

trong thu muc:

```text
mobile-app
```

Test thu cong:

```text
Ghe C3/C4 la COUPLE cung PairID
Bam C3 -> ca C3 va C4 selected
Bam C4 -> ca C3 va C4 unselected
C3 BOOKED, C4 AVAILABLE -> ca cap khong chon duoc
C3 HOLDING, C4 AVAILABLE -> ca cap khong chon duoc
Chon gan max ghe roi bam couple -> kiem tra gioi han ghe
Tong tien tinh du ca 2 ghe
Legend hien thi ghe doi dung mau
```

## Ket qua mong muon

- Mobile render duoc ghe doi ro rang.
- Bam mot nua ghe doi se chon/bo chon ca cap.
- Khong the chon mot nua ghe doi.
- Ghe doi bi booked/holding thi ca cap bi khoa.
- Tong tien va selected seats dung.
- Chua dung den WebSocket trong task nay.
