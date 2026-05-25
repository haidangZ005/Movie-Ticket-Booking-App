# Prompt: Cai tien logic danh so ghe realtime trong trang admin

Hay cai tien logic tao so do ghe trong trang admin `SeatLayoutBuilder`.

## Boi canh

Project: `Movie-Ticket-Booking-App`

Trang can sua:

```text
frontend-admin/src/pages/SeatLayoutBuilder.jsx
```

Backend hien luu so do ghe bang cac field:

```text
SeatNumber
SeatType
RowIndex
ColIndex
IsAisle
PairID
SeatPrice
```

Yeu cau quan trong:

- Khong duoc doi ten bien/API field/backend field neu khong can thiet.
- Khong duoc doi `RowIndex` va `ColIndex`.
- `RowIndex` va `ColIndex` luon dai dien cho vi tri vat ly that tren grid.
- Chi `SeatNumber` duoc tinh lai theo logic moi.
- Uu tien sua frontend-admin truoc.
- Khong sua backend neu payload hien tai da du luu `SeatNumber`.

## Muc tieu tinh nang

Truoc khi admin generate/render so do ghe, can co mot buoc chon huong danh so ghe:

```text
Trai sang phai
Phai sang trai
```

Vi du state:

```js
const [seatNumberDirection, setSeatNumberDirection] = useState('LEFT_TO_RIGHT');
```

Huong danh so nay dung de tinh lai `SeatNumber` trong admin.

Khong can luu `seatNumberDirection` xuong DB neu schema hien tai chua co cot tuong ung.

## Quy tac danh so ghe

Mot ghe chi duoc tinh vao thu tu danh so neu la ghe that de khach dat.

Nhung loai duoc tinh so:

```text
STANDARD
VIP
COUPLE
```

Nhung loai khong duoc tinh so:

```text
AISLE
DISABLED
EMPTY
```

Khi ghe la `AISLE`, `DISABLED`, hoac `EMPTY`:

```js
SeatNumber = ''
```

hoac hien thi tren UI la:

```text
--
```

## Vi du bat buoc

### Vi du 1: Trai sang phai

Hang A co 5 vi tri vat ly:

```text
Col 1  Col 2  Col 3  Col 4  Col 5
A1     A2     A3     A4     A5
```

Neu disable o dau tien:

```text
Col 1      Col 2  Col 3  Col 4  Col 5
disabled   A1     A2     A3     A4
```

Khong duoc de thanh:

```text
disabled A2 A3 A4 A5
```

### Vi du 2: Disable ghe giua

Ban dau:

```text
A1 A2 A3 A4 A5
```

Disable o thu 3:

```text
A1 A2 disabled A3 A4
```

Khong duoc bi nhay so thanh:

```text
A1 A2 disabled A4 A5
```

### Vi du 3: Phai sang trai

Hang A co 5 vi tri vat ly, nhin tu trai sang phai se hien thi:

```text
A5 A4 A3 A2 A1
```

Neu disable o ngoai cung trai:

```text
disabled A4 A3 A2 A1
```

## Yeu cau UI

Them control chon huong danh so ghe.

Vi tri de xuat: dat duoi phan nhap so hang/so cot.

Label:

```text
Huong danh so ghe
```

Options:

```text
Trai sang phai
Phai sang trai
```

Co the dung `select`, radio group, hoac segmented control.

Khi admin doi huong danh so:

- Tinh lai toan bo `SeatNumber`.
- Cap nhat preview realtime.
- Set `hasUnsavedChanges = true`.

Vi du handler:

```js
const handleSeatNumberDirectionChange = (direction) => {
  setSeatNumberDirection(direction);
  setSeats(prev => renumberSeats(prev, direction));
  setHasUnsavedChanges(true);
};
```

## Yeu cau logic

Viet helper kiem tra ghe co duoc danh so hay khong:

```js
const isNumberedSeat = (seat) => {
  return !seat.IsAisle && !['AISLE', 'DISABLED', 'EMPTY'].includes(seat.SeatType);
};
```

Viet helper lay label hang:

```js
const getRowLabel = (rowIndex) => {
  return String.fromCharCode(64 + rowIndex);
};
```

Viet helper tinh lai so ghe:

```js
const renumberSeats = (seatList, direction) => {
  // 1. Group seats theo RowIndex
  // 2. Trong tung hang, sort theo ColIndex tang dan
  // 3. Loc nhung ghe duoc danh so bang isNumberedSeat
  // 4. Neu direction === 'LEFT_TO_RIGHT':
  //    danh so A1, A2, A3... theo ColIndex tang dan
  // 5. Neu direction === 'RIGHT_TO_LEFT':
  //    danh so tu phai sang trai
  // 6. Ghe AISLE/DISABLED/EMPTY giu SeatNumber = ''
  // 7. Tra ve mang seats moi, khong mutate truc tiep state cu
};
```

Khong duoc mutate object cu truc tiep nhu:

```js
seat.SeatNumber = 'A1';
```

Phai dung spread:

```js
return {
  ...seat,
  SeatNumber: newSeatNumber,
};
```

## Nhung noi bat buoc phai goi `renumberSeats`

### Trong `generateGrid()`

Flow mong muon:

```js
const generateGrid = () => {
  // 1. Tao danh sach ghe theo RowIndex/ColIndex
  // 2. Goi renumberSeats(newSeats, seatNumberDirection)
  // 3. setSeats(...)
};
```

### Trong `handleSeatClick(index)`

Flow mong muon:

```js
const handleSeatClick = (index) => {
  // 1. Update loai ghe theo currentMode
  // 2. Goi renumberSeats(updatedSeats, seatNumberDirection)
  // 3. setSeats(...)
  // 4. setHasUnsavedChanges(true)
};
```

### Khi doi huong danh so

```js
const handleSeatNumberDirectionChange = (direction) => {
  setSeatNumberDirection(direction);
  setSeats(prev => renumberSeats(prev, direction));
  setHasUnsavedChanges(true);
};
```

## Khi load layout tu backend

Khi load layout da luu tu backend:

- Giu nguyen `RowIndex`.
- Giu nguyen `ColIndex`.
- Khong bat buoc tu renumber ngay khi load neu khong muon lam thay doi preview du lieu da luu.
- Chi renumber khi:
  - Admin doi huong danh so.
  - Admin chinh loai ghe.
  - Admin generate layout moi.

## Khi bam luu

Payload gui backend phai chua `SeatNumber` cuoi cung giong voi preview hien tai tren UI.

Khong duoc luu huong danh so neu backend/schema chua ho tro.

## Edge cases can xu ly

1. Mot hang toan `AISLE`, `DISABLED`, hoac `EMPTY` thi tat ca `SeatNumber = ''`.
2. Disable ghe dau hang thi cac ghe phia sau phai don so lai tu `A1`.
3. Disable ghe giua hang thi cac ghe sau phai don so lai lien tuc.
4. Enable lai ghe disabled thanh standard thi so ghe phai tu chen lai dung vi tri.
5. Doi huong nhieu lan khong duoc lam sai `RowIndex`/`ColIndex`.
6. `VIP` van duoc danh so nhu ghe thuong.
7. `COUPLE` van duoc danh so nhu ghe thuong.
8. Neu ghe co `PairID`, khong duoc xoa `PairID` tru khi logic hien tai cua mode dang chu dong reset.

## Yeu cau kiem tra

Sau khi sua, chay:

```bash
npm run build
```

trong thu muc:

```text
frontend-admin
```

Test thu cong cac case:

```text
Generate 1 hang 5 ghe trai sang phai
Disable o dau tien
Disable o giua
Doi huong phai sang trai
Enable lai ghe disabled
Luu payload va kiem tra SeatNumber
```

## Ket qua mong muon

- Admin co the chon huong danh so ghe.
- So ghe cap nhat realtime khi doi ghe sang `AISLE`, `DISABLED`, hoac `EMPTY`.
- `RowIndex` va `ColIndex` van giu nguyen vi tri vat ly.
- `SeatNumber` luon lien tuc trong tung hang.
- Payload luu xuong backend co `SeatNumber` dung theo preview hien tai.
- Khong sua file khong lien quan.
