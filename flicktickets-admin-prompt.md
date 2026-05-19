# FlickTickets — Cinema Booking Admin Dashboard
## Prompt chi tiết để tạo giao diện giống FlickTickets

> **Mục tiêu:** Tạo một React Single-Page Application hoàn chỉnh, giao diện trắng/sáng,
> phong cách hiện đại, tái hiện bộ template FlickTickets với đầy đủ 9+ trang.

---

## 1. TECH STACK & CẤU TRÚC

```
Framework : React (functional components + useState + useEffect)
Styling   : Inline styles thuần (KHÔNG dùng CSS variables, KHÔNG Tailwind, KHÔNG styled-components)
Icons     : Chỉ dùng emoji Unicode hoặc ký tự SVG inline đơn giản
Charts    : Vẽ bằng div/CSS thuần (bar chart = div height, donut = conic-gradient)
Fonts     : Google Font "Poppins" — import qua <style> tag: 
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap')
Không dùng : Recharts, Chart.js, MUI, Ant Design, Bootstrap hay bất kỳ thư viện UI nào
```

**Component export mặc định:**
```jsx
export default function App() { ... }
```

---

## 2. COLOR PALETTE (hardcode tất cả — KHÔNG dùng var())

```js
const COLORS = {
  // Nền & bề mặt
  pageBg:      "#F4F6FA",   // nền trang tổng thể (xám nhạt)
  white:       "#FFFFFF",   // nền card, sidebar, header
  sidebarBg:   "#FFFFFF",   // sidebar trắng
  
  // Text
  textPrimary: "#1A1D23",   // tiêu đề, text đậm
  textSub:     "#6B7280",   // text phụ, label
  textMuted:   "#9CA3AF",   // placeholder, hint
  
  // Accent / Brand
  accent:      "#4361EE",   // xanh dương đậm — màu chủ đạo (button, active nav, link)
  accentLight: "#EEF2FF",   // nền nhạt của accent
  accentHover: "#3451D1",   // hover state
  
  // Status
  green:       "#10B981",   greenBg: "#D1FAE5",
  amber:       "#F59E0B",   amberBg: "#FEF3C7",
  red:         "#EF4444",   redBg:   "#FEE2E2",
  purple:      "#8B5CF6",   purpleBg:"#EDE9FE",
  pink:        "#EC4899",   pinkBg:  "#FCE7F3",
  
  // Chart colors (donut, bar)
  chart1:      "#EF4444",   // đỏ
  chart2:      "#4361EE",   // xanh
  chart3:      "#F59E0B",   // vàng
  chart4:      "#10B981",   // xanh lá
  
  // Border & divider
  border:      "#E5E7EB",
  borderLight: "#F3F4F6",
};
```

---

## 3. LAYOUT TỔNG THỂ

```
┌─────────────────────────────────────────────────────────────┐
│                        TOPBAR (64px)                        │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│   SIDEBAR    │            MAIN CONTENT                      │
│   (240px)    │            (flex: 1)                         │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

- **Tổng layout:** `display: flex, flexDirection: column, height: 100vh, width: 100%, fontFamily: 'Poppins, sans-serif', background: COLORS.pageBg`
- **Body:** `display: flex, flex: 1, overflow: hidden`
- **Sidebar:** `width: 240px, minWidth: 240px, background: white, borderRight: '1px solid #E5E7EB', overflowY: auto`
- **Main:** `flex: 1, overflowY: auto, padding: 24px`

---

## 4. TOPBAR

```
[🎬 Logo FlickTickets]    [🔍 Search...]    [🇺🇸 ENGLISH ▾]  [🔔]  [Avatar | Minato Namikaze ▾]
```

**Chi tiết:**
- Height: 64px, background: white, borderBottom: `1px solid ${COLORS.border}`, padding: `0 24px`
- Logo: icon clapperboard emoji 🎬 + text **"Flick"** (COLORS.textPrimary, bold) + **"Tickets"** (COLORS.accent, bold), fontSize: 20px
- Search bar: input, width: 320px, height: 38px, borderRadius: 8px, border: `1px solid ${COLORS.border}`, paddingLeft: 36px, fontSize: 13px, placeholder "Search..."
- Language selector: "🇺🇸 ENGLISH ▾", border, borderRadius: 6px, padding: `6px 12px`
- Bell icon: 🔔 với badge đỏ số "3"
- Avatar: ảnh tròn 36px + tên "Minato Namikaze" + chức danh "Owner" + "▾"

---

## 5. SIDEBAR NAVIGATION

**Logo lại ở đầu sidebar** (nếu layout không có topbar riêng, gộp vào sidebar)

### Nav items (dùng `useState` để track `activePage`):

```
MAIN MENU
─────────────────────────────────
📊  Dashboard
🎬  Movie
🎫  Bookings
👥  Customer
💳  Transaction
📈  Analytics
⚙️  Settings
```

**Style nav item:**
```js
// Normal
{ display:'flex', alignItems:'center', gap:10, padding:'11px 20px',
  fontSize:14, color: COLORS.textSub, cursor:'pointer',
  borderRadius:8, margin:'2px 12px' }

// Active
{ ...normal, background: COLORS.accentLight, color: COLORS.accent, fontWeight:600,
  borderLeft: `3px solid ${COLORS.accent}` }

// Hover
{ ...normal, background: COLORS.borderLight }
```

---

## 6. BADGE COMPONENT

```jsx
function Badge({ type, children }) {
  // type: 'success' | 'warning' | 'danger' | 'accent' | 'purple' | 'pink'
  const map = {
    success: { bg: COLORS.greenBg,   color: COLORS.green  },
    warning: { bg: COLORS.amberBg,   color: COLORS.amber  },
    danger:  { bg: COLORS.redBg,     color: COLORS.red    },
    accent:  { bg: COLORS.accentLight,color: COLORS.accent },
    purple:  { bg: COLORS.purpleBg,  color: COLORS.purple },
    pink:    { bg: COLORS.pinkBg,    color: COLORS.pink   },
  };
  // style: fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20
}
```

---

## 7. CARD COMPONENT

```jsx
function Card({ children, style }) {
  // background: white, borderRadius: 12, border: '1px solid #E5E7EB',
  // padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
}
```

---

## 8. CÁC TRANG — NỘI DUNG CHI TIẾT

---

### PAGE 1: DASHBOARD

#### Row 1 — 3 Stat Cards (grid 3 cột)

Mỗi card có:
- Label nhỏ (13px, COLORS.textSub): "Total Bookings" / "User Registration" / "Today Bookings"
- Icon góc phải (emoji lớn, màu accent/green/red)
- Số lớn (28px, bold): **2345** / **2345** / **234**
- Mini sparkline chart (SVG path đơn giản, màu đỏ nhạt với fill gradient)
- Change badge: `+4.5%` màu xanh lá

**Sparkline SVG mẫu (width:120, height:40):**
```jsx
<svg width="120" height="40" viewBox="0 0 120 40">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3"/>
      <stop offset="100%" stopColor="#EF4444" stopOpacity="0"/>
    </linearGradient>
  </defs>
  <path d="M0,35 C20,30 30,10 50,15 C70,20 80,5 120,8"
        stroke="#EF4444" strokeWidth="2" fill="none"/>
  <path d="M0,35 C20,30 30,10 50,15 C70,20 80,5 120,8 L120,40 L0,40 Z"
        fill="url(#grad)"/>
</svg>
```

#### Row 2 — 2 Charts (grid 2 cột)

**Card trái — "Sales Details":**
- Header: tiêu đề + dropdown "April ▾" + "2021 ▾"
- Tooltip nổi: "April Bookings: 345,678"
- Area chart SVG (width:100%, height:160px) — đường đỏ với fill gradient nhạt
- Điểm highlight: circle tại peak với tooltip "2345 Sales / Sat, April 15th"

**Card phải — "Total Revenue":**
- Header: tiêu đề + "2021 ▾"
- Số lớn: **23,4567** (30px, bold, COLORS.textPrimary)
- Bar chart dọc — 7 cột (Jan–Jul), màu đỏ COLORS.chart1
  ```js
  // Dùng div flex align-items:flex-end, gap:6px, height:120px
  // Mỗi bar: width:28px, borderRadius:'4px 4px 0 0', background:COLORS.chart1
  // Height tỉ lệ với data: Math.round((val/max)*100) + '%'
  ```
- Footer: "+4.5% Your sales performance is 30% better compared to last month"

#### Row 3 — 2 Cards (grid 2 cột)

**Card trái — "Top Selling Movies":**
- Header + filter "April ▾" "2021 ▾"
- Donut chart (CSS conic-gradient):
  ```js
  // div style: width:140px, height:140px, borderRadius:'50%'
  // background: `conic-gradient(
  //   ${COLORS.chart1} 0% 40%,    // Iron Man 40%
  //   ${COLORS.chart2} 40% 60%,   // Avatar 20%
  //   ${COLORS.chart3} 60% 80%,   // Marvel 20%
  //   ${COLORS.chart4} 80% 100%   // Others 20%
  // )`
  // Lỗ giữa: pseudo div position:absolute, width:80px, height:80px, background:white, borderRadius:50%
  ```
- Legend bên phải: ● Iron Man 36,638,465.14 / ● Avatar 8,141,881.2 / ...

**Card phải — "Upcoming Movies":**
- List 4 phim sắp chiếu:
  ```
  [Ảnh poster 48x48px borderRadius:8]  The Real Gosht
                                         April 13th, Monday
  ```
- Mỗi item: flex, gap:12, paddingY:10, borderBottom

---

### PAGE 2: MOVIE LIST (Movies Management)

**Header:**
- Tiêu đề "Movies Management" (20px, bold)
- Search bar bên phải + button "Add Movie" (accent)

**Table:**
```
MOVIE NAME  | FUNCTION/DATE | SCREENS | LANGUAGE | TYPE  | CAST | STATUS | ACTION
```

- `tableLayout: fixed`, `width: 100%`, fontSize: 13px
- Header row: background `#F9FAFB`, fontWeight: 600, color: COLORS.textSub, borderBottom
- Mỗi row phim:
  - **Movie Name:** ảnh thumbnail 40x56px (borderRadius:6) + tên phim + ngày (2 dòng)
  - **Function/Date:** "Hall 1 / 15 Jul 2021..."
  - **Screens:** "Screen 3"
  - **Language:** "Hindi, English"
  - **Type:** "2D/3D" badge
  - **Cast:** avatar circles xếp chồng (3 avatar 24px, overlap -8px)
  - **Status:** Badge `<Badge type="success">Running</Badge>` hoặc `<Badge type="warning">Pending</Badge>`
  - **Action:** nút ✏️ (edit, accent) + 🗑️ (delete, red) + 👁️ (view, gray)
- 8 rows dữ liệu mock với "The Real Goat" lặp để demo
- Pagination: "Page 1 of 3" + nút Previous / 1 2 3 4 ... / Next

---

### PAGE 3: MOVIE DETAIL

**Layout 2 cột:**

**Cột trái (60%):**
- Poster phim lớn (100% width, height:240px, borderRadius:12, objectFit:cover)
  - Dùng placeholder màu gradient đỏ-cam với tên phim chồng lên
- Tên phim: **"THE REAL GOAT"** (22px, bold)
- Thể loại, năm, mô tả (3–4 dòng text)
- **Cast/Director/Crew:** avatar grid ngang
  - Mỗi người: ảnh tròn 60px + tên nhỏ + role (Director/Actor)

**Cột phải (40%):**
- Card "Revenue":
  - Bar chart dọc 6 cột (M T W T F S), màu đỏ-cam gradient
  - Số tổng revenue bên dưới
- Card "Sales":
  - Donut chart (CSS conic-gradient) + số **454** ở giữa
  - Legend: ● Booked ● Available

---

### PAGE 4: BOOKINGS

**Header:** "Bookings" + Search bar

**Table:**
```
MOVIE NAME | CUSTOMER | THEATRE NAME | SCREEN | SEAT | BOOKING DATE/TIME | TYPE | AMOUNT | PAID | ACTION
```

- Mỗi row:
  - Movie name: text
  - Customer: "Jon Doe"
  - Theatre: "Cinehouse..."
  - Screen: "Screen 3"
  - Seat: "J4, J7"
  - Date: "24/06/2024 / 10:30 PM"
  - Type: "Online" badge accent / "Offline" badge gray
  - Amount: "$121"
  - Paid: Badge success "Paid" / danger "Unpaid" / warning "Pending"
  - Action: 3 icon buttons

- 7 rows mock data
- Pagination footer

---

### PAGE 5: CUSTOMERS

**Header:** "Customers" + Search bar

**Table:**
```
CUSTOMER NAME | MOBILE NO | EMAIL ID | LAST TICKET BOOKED | LOCATION | AMOUNT | LAST LOGIN | ACTION
```

- Mỗi row:
  - Customer: Avatar circle (initials 2 chữ, background ngẫu nhiên từ COLORS) + "MR.JHON"
  - Mobile: "+91 700-700-700"
  - Email: "jhon@gmail.com"
  - Last ticket: tên phim
  - Location: "Home" / "Away"
  - Amount: "$121–$300"
  - Last login: "Oct 11 5:30pm"
  - Action: Edit + Delete

- 7 rows, pagination

---

### PAGE 6: TRANSACTION

**Header:** "Transaction" + Search

**Table:**
```
CUSTOMER NAME | MOBILE NO | DATE | MOVIE NAME | AMOUNT | STATUS
```

- Mỗi row:
  - Customer: "MR.JHON"
  - Mobile: "+91 747-747-747"
  - Date: "19/01 & 5 6pm"
  - Movie: "Avtar"
  - Amount: "$456"
  - Status: Badge success "Success" / danger "Failed" / warning "Pending"

- 7 rows, pagination

---

### PAGE 7: ANALYTICS

**Layout grid 2x2 + full-width bottom:**

**Row 1 (3 cards):**

- **"Today Ticket Sold":** số **12,345** to + sparkline SVG xanh + "+4.89 Edit this line"
- **"Total Ticket":** Donut nhỏ (CSS conic-gradient) + số **305** / **918** legend
- **"Sales by Movie":** Bar chart dọc 4 cột (Movie 1–4), màu đỏ + xanh pastel

**Row 2 (full width):**

- **"Total Revenue":** số **$236,535** + badge "+0.5% last year" + Bar chart dọc theo tháng (Jan–Dec) dùng 2 màu COLORS.chart1 + COLORS.chart2
- **"Top Selling Movies":** list 4 phim với progress bar ngang:
  ```
  🎬 Avatar      ━━━━━━━━━━░░  30000
  🎬 Avatar      ━━━━━━░░░░░░  20000
  ```
  Progress bar: height:6px, borderRadius:3px, background:COLORS.chart1

**Row 3:**
- **"Peak Booking Times":** area chart SVG theo giờ (6am–12am), màu tím/xanh, fill gradient

---

### PAGE 8: SETTINGS

**Layout 2 cột:**

**Cột trái — Profile Card:**
- Cover image: div gradient đỏ-tím (height:120px, borderRadius:12)
- Avatar: tròn 80px, border 4px white, position overlap cover bottom
- Tên: **"Mobina Mirbagheri"** (18px, bold)
- Chức danh: "Your account is ready, you can now apply for Admin"
- Button: "Edit ✏️" (accent, nhỏ)

**Cột phải — Form:**
```
Name *          Email *
[Ajmal Kiya  ]  [Ajmal Kiya        ]

Username *      Phone Number *
[Ajmal Kiya  ]  [Ajmal Kiya        ]

Address
[Klara is marula                   ]
```

- Input style: width:100%, height:40px, border:`1px solid ${COLORS.border}`, borderRadius:8, padding:`0 12px`, fontSize:13px
- Focus: borderColor: COLORS.accent, outline:'none', boxShadow:`0 0 0 3px ${COLORS.accentLight}`
- Buttons: **"Update"** (accent, filled) + **"Reset"** (outline)

---

### PAGE 9: AUTH — SIGN IN (màn hình riêng nếu cần)

**Layout 2 cột (50/50):**
- **Cột trái:** Ảnh/màu nền tối với hình ảnh cinematic (gradient đen-đỏ + icon 🎬 lớn ở giữa)
- **Cột phải:** Form trắng căn giữa:
  ```
  [Logo FlickTickets]
  
  Sign in
  Please login to continue to your account.
  
  [📧 Robert@gmail.com        ]
  [🔒 Password            👁️  ]
  
  ☐ Keep me logged in
  
  [        Sign In        ]  ← accent button full width
  
  ──────── or ────────
  
  [G  Sign in with Google     ]
  
  Don't Have an Account? Create one
  ```

---

## 9. MOCK DATA MẪU

```js
const MOCK_MOVIES = [
  { id:1, name:"The Real Goat", date:"24/01/2024 - 30/01/2024",
    screen:"Screen 3", lang:"Hindi, English", type:"2D/3D",
    status:"running", revenue: 36638465 },
  { id:2, name:"Black Widow", date:"14/04/2024 - 20/04/2024",
    screen:"Screen 1", lang:"English", type:"IMAX",
    status:"pending", revenue: 8141881 },
  { id:3, name:"Iron Man", date:"01/05/2024 - 15/05/2024",
    screen:"Screen 2", lang:"English, Hindi", type:"3D",
    status:"running", revenue: 12500000 },
  { id:4, name:"Avengers: Endgame", date:"20/06/2024 - 30/06/2024",
    screen:"Screen 4", lang:"English", type:"IMAX 3D",
    status:"upcoming", revenue: 45000000 },
  { id:5, name:"Avatar 2", date:"10/07/2024 - 25/07/2024",
    screen:"Screen 3", lang:"English, Hindi", type:"3D",
    status:"running", revenue: 28000000 },
];

const MOCK_CUSTOMERS = [
  { id:1, name:"MR.JHON", mobile:"+91 700-700-700",
    email:"jhon@gmail.com", lastTicket:"The Real Goat",
    location:"Home", amount:121, lastLogin:"Oct 11 5:30pm" },
  // ... 6 rows thêm tương tự
];

const MOCK_BOOKINGS = [
  { id:"#B001", movie:"The Real Goat", customer:"Jon Doe",
    theatre:"Cinehouse", screen:"Screen 3", seat:"J4,J7",
    date:"24/06/2024", time:"10:30 PM", type:"Online",
    amount:121, status:"paid" },
  // ... 6 rows thêm
];

const REVENUE_MONTHLY = [45,52,38,65,71,58,82,67,74,89,92,78]; // Jan-Dec (đơn vị: nghìn)
const REVENUE_WEEKLY  = [32,45,38,55,61,48,72]; // T2-CN
```

---

## 10. PAGINATION COMPONENT

```jsx
function Pagination({ total, current, onChange }) {
  // Hiện: "Page X of Y"  |  [Previous]  [1] [2] [3] [4] [...]  [Next]
  // Style button: border, borderRadius:6, padding:'6px 12px', fontSize:13
  // Active page: background:COLORS.accent, color:white
  // Disabled: opacity:0.4
}
```

---

## 11. SEARCH BAR COMPONENT

```jsx
function SearchBar({ placeholder = "Search...", width = 280 }) {
  // input với icon 🔍 absolute bên trái
  // height:38px, borderRadius:8, border:'1px solid #E5E7EB'
  // paddingLeft:36px
}
```

---

## 12. DROPDOWN COMPONENT

```jsx
function Dropdown({ options, value, onChange }) {
  // select element hoặc custom div
  // border:'1px solid #E5E7EB', borderRadius:6, padding:'6px 12px'
  // fontSize:13, color:COLORS.textSub
  // options: [{label:'April', value:'apr'}, ...]
}
```

---

## 13. QUY TẮC QUAN TRỌNG

1. **KHÔNG dùng CSS variables** — tất cả màu phải là giá trị hex hardcode
2. **KHÔNG dùng bất kỳ thư viện ngoài** — chỉ React core
3. **KHÔNG dùng `var(--color-*)` hay `var(--font-*)`** — sẽ bị lỗi trong môi trường render
4. **Font:** `fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif"` trên root
5. **Width:** Root container phải `width: '100%'`, không có `maxWidth`
6. **Font size tối thiểu:** 12px cho mọi text
7. **Sidebar active state:** Dùng `useState('dashboard')` để track trang hiện tại
8. **Scroll:** Main content `overflowY: 'auto'`, sidebar `overflowY: 'auto'`
9. **Table:** Dùng `<table style={{width:'100%', borderCollapse:'collapse'}}>`, không dùng div grid cho table data
10. **Màu nền trang:** `#F4F6FA` (xám nhạt) — KHÔNG phải trắng, KHÔNG phải tối

---

## 14. CẤU TRÚC COMPONENT GỢI Ý

```
App
├── Topbar
├── Sidebar
│   └── NavItem (×7)
└── MainContent
    ├── DashboardPage
    │   ├── StatCard (×3)
    │   ├── SalesChart
    │   ├── RevenueChart
    │   ├── TopMoviesDonut
    │   └── UpcomingMovies
    ├── MoviesPage
    │   └── MoviesTable
    ├── MovieDetailPage
    ├── BookingsPage
    │   └── BookingsTable
    ├── CustomersPage
    │   └── CustomersTable
    ├── TransactionPage
    │   └── TransactionTable
    ├── AnalyticsPage
    │   ├── TodayStats
    │   ├── RevenueBarChart
    │   ├── TopMoviesProgress
    │   └── PeakTimesChart
    └── SettingsPage
        ├── ProfileCard
        └── ProfileForm
```

---

## 15. OUTPUT CUỐI CÙNG

File duy nhất `App.jsx` (hoặc paste vào React Artifact):
- Tất cả components trong 1 file
- Tất cả mock data inline
- Tất cả styles inline
- Không có import ngoài (trừ `import { useState } from 'react'`)
- Chạy được ngay lập tức không cần config

---

*Dựa trên thiết kế FlickTickets — Movie Booking Admin Dashboard UI Template*
*Nguồn tham khảo: templatemonster.com/ui-elements/filckticket-movie-tickets-booking-admin-dashboard-ui-template-463210.html*
