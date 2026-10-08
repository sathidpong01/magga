# 📐 คู่มือการปรับแต่ง Layout และขนาดต่างๆ

คู่มือนี้จะอธิบายว่าในแต่ละหน้าของโปรเจกต์ Magga คุณสามารถปรับแต่ง layout และขนาดต่างๆ ได้อย่างไร โดยจะแบ่งตามหน้าและอธิบายรายละเอียดของแต่ละส่วน

---

## 📑 สารบัญ

1. [หน้าแรก (Homepage)](#1-หน้าแรก-homepage)
2. [หน้า Admin Dashboard](#2-หน้า-admin-dashboard)
3. [หน้าสร้าง/แก้ไข Manga](#3-หน้าสร้างแก้ไข-manga)
4. [หน้าอ่าน Manga](#4-หน้าอ่าน-manga)
5. [หน้า Category](#5-หน้า-category)
6. [หน้า Tag](#6-หน้า-tag)
7. [หน้าจัดการ Categories](#7-หน้าจัดการ-categories)
8. [หน้าจัดการ Tags](#8-หน้าจัดการ-tags)

---

## 1. หน้าแรก (Homepage)

**ไฟล์:** `app/page.tsx`

### 🎯 ส่วนที่ปรับแต่งได้

#### 1.1 Container หลัก

```tsx
<Container maxWidth="xl">  // บรรทัด 71
```

**ปรับได้:**

- `maxWidth`: `xs`, `sm`, `md`, `lg`, `xl`, `false` (ไม่จำกัด)
- **คำแนะนำ:** `xl` = 1536px, `lg` = 1280px, `md` = 960px

#### 1.2 ระยะห่างรอบ Content

```tsx
<Box sx={{ my: 4 }}>  // บรรทัด 72
```

**ปรับได้:**

- `my`: ระยะห่างบนล่าง (1 = 8px, 2 = 16px, 3 = 24px, 4 = 32px)
- `mx`: ระยะห่างซ้ายขวา
- `p`: padding ทุกด้าน
- `pt`, `pb`, `pl`, `pr`: padding แต่ละด้าน

#### 1.3 หัวข้อหลัก

```tsx
<Typography
  variant="h3"        // ขนาดตัวอักษร
  sx={{
    fontWeight: 800,  // ความหนา (100-900)
    mb: 4,            // ระยะห่างด้านล่าง
    letterSpacing: "-0.02em"  // ระยะห่างระหว่างตัวอักษร
  }}
>
```

**ปรับได้:**

- `variant`: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `body1`, `body2`
- `fontWeight`: 100-900 (400=normal, 700=bold)
- `fontSize`: เช่น `"2rem"`, `"24px"`

#### 1.4 Grid การ์ด Manga

```tsx
<Grid container spacing={3}>  // บรรทัด 103
  <Grid item xs={12} sm={6} md={4} lg={3}>  // บรรทัด 105
```

**ปรับได้:**

- `spacing`: ระยะห่างระหว่างการ์ด (1-10)
- `xs={12}`: จำนวนคอลัมน์บนหน้าจอเล็ก (1-12)
- `sm={6}`: จำนวนคอลัมน์บนหน้าจอกลาง (2 การ์ดต่อแถว)
- `md={4}`: จำนวนคอลัมน์บนหน้าจอใหญ่ (3 การ์ดต่อแถว)
- `lg={3}`: จำนวนคอลัมน์บนหน้าจอใหญ่มาก (4 การ์ดต่อแถว)

**ตัวอย่างการปรับ:**

```tsx
// แสดง 5 การ์ดต่อแถวบนหน้าจอใหญ่
<Grid item xs={12} sm={6} md={4} lg={2.4}>

// แสดง 2 การ์ดต่อแถวเสมอ
<Grid item xs={6} sm={6} md={6} lg={6}>
```

---

## 2. หน้า Admin Dashboard

**ไฟล์:** `app/admin/page.tsx`

### 🎯 ส่วนที่ปรับแต่งได้

#### 2.1 Search Bar

```tsx
<Paper
  sx={{
    width: 400,        // ความกว้าง
    borderRadius: 1,   // มุมโค้ง (1 = 4px)
    bgcolor: "#171717",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  }}
>
```

**ปรับได้:**

- `width`: ความกว้างเป็น px หรือ `"100%"`
- `borderRadius`: 0-4 (0=สี่เหลี่ยม, 4=โค้งมาก)

#### 2.2 Quick Stats Cards

```tsx
<Grid container spacing={3} sx={{ mb: 4 }}>  // บรรทัด 91
  <Grid item xs={12} sm={6} md={3}>          // บรรทัด 98
```

**ปรับได้:**

- `spacing`: ระยะห่างระหว่างการ์ด
- `xs={12}`: หน้าจอเล็ก = 1 การ์ดต่อแถว
- `sm={6}`: หน้าจอกลาง = 2 การ์ดต่อแถว
- `md={3}`: หน้าจอใหญ่ = 4 การ์ดต่อแถว

#### 2.3 Card Styling

```tsx
<Card sx={{
  borderRadius: 1,     // มุมโค้ง
  boxShadow: "none",   // เงา
  border: "1px solid rgba(255, 255, 255, 0.1)",
  bgcolor: "#171717"   // สีพื้นหลัง
}}>
```

#### 2.4 Table ภายใน

```tsx
<Table sx={{ minWidth: 650 }}>  // บรรทัด 140
```

**ปรับได้:**

- `minWidth`: ความกว้างขั้นต่ำของตาราง

#### 2.5 Cover Image ในตาราง

```tsx
<Box
  component="img"
  sx={{
    width: 40, // ความกว้าง
    height: 56, // ความสูง
    objectFit: "cover",
    borderRadius: 0.5, // มุมโค้ง
  }}
/>
```

---

## 3. หน้าสร้าง/แก้ไข Manga

**ไฟล์:** `app/admin/manga/MangaForm.tsx`

### 🎯 ส่วนที่ปรับแต่งได้

#### 3.1 Grid Layout หลัก

```tsx
<Grid container spacing={3}>  // บรรทัด 305
  <Grid item xs={12} md={7}>  // คอลัมน์ซ้าย - บรรทัด 358
  <Grid item xs={12} md={5}>  // คอลัมน์ขวา - บรรทัด 473
```

**ปรับได้:**

- `spacing`: ระยะห่างระหว่างคอลัมน์
- `md={7}`: คอลัมน์ซ้ายกว้าง 58.33% (7/12)
- `md={5}`: คอลัมน์ขวากว้าง 41.67% (5/12)

**ตัวอย่างการปรับ:**

```tsx
// ให้ทั้งสองคอลัมน์เท่ากัน
<Grid item xs={12} md={6}>  // ซ้าย
<Grid item xs={12} md={6}>  // ขวา

// ให้คอลัมน์ซ้ายกว้างกว่า
<Grid item xs={12} md={8}>  // ซ้าย
<Grid item xs={12} md={4}>  // ขวา
```

#### 3.2 Paper Container

```tsx
<Paper elevation={0} sx={{
  p: 3,              // padding (3 = 24px)
  borderRadius: 1,   // มุมโค้ง
  bgcolor: '#171717'
}}>
```

**ปรับได้:**

- `p`: padding ทุกด้าน (1-10)
- `px`, `py`: padding แนวนอน/แนวตั้ง
- `elevation`: เงา (0-24)

#### 3.3 Cover Upload Area

```tsx
<Button
  sx={{
    height: 100,      // ความสูง
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1,
  }}
>
```

**ปรับได้:**

- `height`: ความสูงของพื้นที่ drop (120px)
- `borderRadius`: มุมโค้ง

#### 3.4 Cover Preview

```tsx
<Box sx={{
  position: 'relative',
  maxWidth: 200,        // ความกว้างสูงสุดของ preview
  borderRadius: 1,
  overflow: 'hidden',
  boxShadow: 3
}}>
```

**ปรับได้:**

- `width`: ความกว้างของรูป preview
- `boxShadow`: ความเข้มของเงา (0-24)

#### 3.5 Page Upload Button

```tsx
<Button
  sx={{
    color: "#fbbf24", // สีปุ่ม
  }}
>
  Add Pages
</Button>
```

**หมายเหตุ:** การอัพโหลดหน้า manga เปลี่ยนไปใช้ Modal แทนการ drop ในพื้นที่สี่เหลี่ยม

#### 3.6 Page Preview Grid

```tsx
<Box sx={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',  // ขนาดการ์ด
  gap: 1  // ระยะห่างระหว่างการ์ด
}}>
```

**ปรับได้:**

- `minmax(80px, 1fr)`: ขนาดขั้นต่ำของแต่ละการ์ด
- `gap`: ระยะห่างระหว่างการ์ด

**ตัวอย่างการปรับ:**

```tsx
// การ์ดใหญ่ขึ้น
gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))";

// การ์ดเล็กลง
gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))";
```

#### 3.7 Page Preview Card

```tsx
<Box sx={{
  position: 'relative',
  aspectRatio: '2/3',  // อัตราส่วน กว้าง:สูง
  borderRadius: 1,
  overflow: 'hidden',
  bgcolor: '#000'
}}>
```

**ปรับได้:**

- `aspectRatio`: `'2/3'`, `'3/4'`, `'1/1'`, `'16/9'`

---

## 4. หน้าอ่าน Manga

**ไฟล์:** `app/[mangaId]/page.tsx`

### 🎯 ส่วนที่ปรับแต่งได้

#### 4.1 Container หลัก

```tsx
<Container maxWidth="lg">  // บรรทัด 153
```

**ปรับได้:**

- `maxWidth`: `xs`, `sm`, `md`, `lg`, `xl`
- **คำแนะนำ:** `lg` = 1280px เหมาะสำหรับการอ่านแบบ wide screen

#### 4.2 Paper Card

```tsx
<Paper
  sx={{
    p: { xs: 2, md: 4 },  // padding ตามขนาดหน้าจอ
    my: 4,                 // ระยะห่างบนล่าง
    borderRadius: 3,       // มุมโค้ง
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
  }}
>
```

**ปรับได้:**

- `p: { xs: 2, md: 4 }`: padding หน้าจอเล็ก=16px, ใหญ่=32px
- `borderRadius`: มุมโค้ง (0-4)
- `boxShadow`: เงา (CSS shadow)

#### 4.3 Grid Layout

```tsx
<Grid container spacing={4}>
  <Grid item xs={12} md={4} lg={3}>  // Cover
  <Grid item xs={12} md={8} lg={9}>  // Details
```

**ปรับได้:**

- `spacing`: ระยะห่างระหว่างคอลัมน์
- `md={4} lg={3}`: Cover กว้าง 33% (md) หรือ 25% (lg)
- `md={8} lg={9}`: Details กว้าง 66% (md) หรือ 75% (lg)

#### 4.4 Cover Image

```tsx
<Box
  sx={{
    position: "relative",
    width: "100%",
    maxWidth: { xs: "240px", md: "100%" },
    aspectRatio: "2/3",
    borderRadius: 2,
    overflow: "hidden",
    boxShadow: "0 20px 40px -10px rgba(0,0,0,0.7)",
    border: "1px solid rgba(255,255,255,0.1)"
  }}
>
```

**ปรับได้:**

- `aspectRatio`: อัตราส่วนของรูป
  - `"2/3"` = 2:3 (มาตรฐาน manga)
  - `"3/4"` = 3:4
  - `"1/1"` = 1:1
- `borderRadius`: มุมโค้ง

#### 4.5 Title

```tsx
<Typography
    width: "100%",
    maxWidth: "1000px", // Limit max width for readability on ultra-wide screens
    lineHeight: 0, // Remove gap between images
  }}>
```

**ปรับได้:**

- `maxWidth`: ความกว้างสูงสุด (`"1000px"`)

**ตัวอย่างการปรับ:**

```tsx
// ให้รูปแคบลง มีขอบข้าง
<Box sx={{
  width: "80%",
  maxWidth: "800px",
  mb: 2,
}}>
```

---

## 5. หน้า Category

**ไฟล์:** `app/category/[categoryName]/page.tsx`

### 🎯 ส่วนที่ปรับแต่งได้

#### 5.1 Grid การ์ด

```tsx
<Grid container spacing={3}>  // บรรทัด 51
  <Grid item xs={12} sm={6} md={4} lg={3}>  // บรรทัด 53
```

**ปรับได้:**

- เหมือนกับหน้าแรก (ดูข้อ 1.4)

#### 5.2 Title

```tsx
<Typography variant="h4" component="h1" gutterBottom>
  Category: {category.name}
</Typography>
```

**ปรับได้:**

- `variant`: ขนาดตัวอักษร
- เพิ่ม `sx` สำหรับ styling เพิ่มเติม

---

## 6. หน้า Tag

**ไฟล์:** `app/tag/[tagName]/page.tsx`

### 🎯 ส่วนที่ปรับแต่งได้

#### 6.1 Grid การ์ด

```tsx
<Grid container spacing={3}>  // บรรทัด 51
  <Grid item xs={12} sm={6} md={4} lg={3}>  // บรรทัด 53
```

**ปรับได้:**

- เหมือนกับหน้าแรกและหน้า Category

---

## 7. หน้าจัดการ Categories

**ไฟล์:** `app/admin/categories/page.tsx`

### 🎯 ส่วนที่ปรับแต่งได้

#### 7.1 Title

```tsx
<Typography variant="h4" component="h1" gutterBottom>
  Manage Categories
</Typography>
```

**ปรับได้:**

- `variant`: ขนาดตัวอักษร
- เพิ่ม `sx` สำหรับ styling

> **หมายเหตุ:** Component `CategoryManager` อยู่ในไฟล์แยก ต้องดูที่ `app/admin/categories/CategoryManager.tsx`

---

## 8. หน้าจัดการ Tags

**ไฟล์:** `app/admin/tags/page.tsx`

### 🎯 ส่วนที่ปรับแต่งได้

#### 8.1 Title

```tsx
<Typography variant="h4" component="h1" gutterBottom>
  Manage Tags
</Typography>
```

**ปรับได้:**

- เหมือนกับหน้าจัดการ Categories

> **หมายเหตุ:** Component `TagManager` อยู่ในไฟล์แยก ต้องดูที่ `app/admin/tags/TagManager.tsx`

---

## 📊 ตารางสรุปค่า Spacing

| ค่า | Pixels | ใช้เมื่อ         |
| --- | ------ | ---------------- |
| 0.5 | 4px    | ระยะห่างน้อยมาก  |
| 1   | 8px    | ระยะห่างเล็ก     |
| 2   | 16px   | ระยะห่างปานกลาง  |
| 3   | 24px   | ระยะห่างมาตรฐาน  |
| 4   | 32px   | ระยะห่างมาก      |
| 5   | 40px   | ระยะห่างมากพิเศษ |

## 📊 ตารางสรุป Grid Breakpoints

| Breakpoint | ขนาดหน้าจอ | ตัวอย่าง     |
| ---------- | ---------- | ------------ |
| xs         | 0px+       | มือถือ       |
| sm         | 600px+     | แท็บเล็ต     |
| md         | 960px+     | แล็ปท็อปเล็ก |
| lg         | 1280px+    | เดสก์ท็อป    |
| xl         | 1536px+    | จอใหญ่       |

## 📊 ตารางสรุป Container MaxWidth

| MaxWidth | ความกว้าง |
| -------- | --------- |
| xs       | 444px     |
| sm       | 600px     |
| md       | 960px     |
| lg       | 1280px    |
| xl       | 1536px    |
| false    | ไม่จำกัด  |

---

## 💡 เทคนิคการปรับแต่ง

### 1. Responsive Spacing

```tsx
// ปรับ spacing ตามขนาดหน้าจอ
<Box sx={{
  p: { xs: 2, sm: 3, md: 4 }  // เล็ก=16px, กลาง=24px, ใหญ่=32px
}}>
```

### 2. Responsive Grid

```tsx
// แสดงจำนวนการ์ดต่างกันตามหน้าจอ
<Grid item
  xs={12}  // มือถือ: 1 การ์ด/แถว
  sm={6}   // แท็บเล็ต: 2 การ์ด/แถว
  md={4}   // แล็ปท็อป: 3 การ์ด/แถว
  lg={3}   // เดสก์ท็อป: 4 การ์ด/แถว
  xl={2}   // จอใหญ่: 6 การ์ด/แถว
>
```

### 3. Custom Breakpoints

```tsx
// ใช้ค่าที่ไม่ใช่ตัวเลขเต็ม
<Grid item xs={12} sm={6} md={4} lg={2.4}>  // 5 การ์ด/แถว
```

### 4. Aspect Ratio

```tsx
// รักษาอัตราส่วนของรูป
<Box sx={{
  paddingTop: "56.25%"  // 16:9
  paddingTop: "75%"     // 4:3
  paddingTop: "100%"    // 1:1 (สี่เหลี่ยมจัตุรัส)
  paddingTop: "140%"    // 5:7 (manga)
}}>
```

---

## 🎨 สีและธีม

โปรเจกต์ใช้ Neutral Dark Theme:

```tsx
// สีพื้นหลัง
bgcolor: "#171717"; // Neutral 900
bgcolor: "#0a0a0a"; // Neutral 950

// สีข้อความ
color: "#fafafa"; // Neutral 50
color: "#d4d4d4"; // Neutral 300
color: "#a3a3a3"; // Neutral 400

// สีเส้นขอบ
border: "1px solid rgba(255, 255, 255, 0.1)";
```

---

## 🔧 ตัวอย่างการปรับแต่งทั่วไป

### เพิ่มระยะห่างระหว่างการ์ด

```tsx
// เดิม
<Grid container spacing={3}>

// ใหม่ - ระยะห่างมากขึ้น
<Grid container spacing={4}>
```

### ปรับขนาดการ์ด Manga

```tsx
// เดิม - 4 การ์ด/แถว
<Grid item xs={12} sm={6} md={4} lg={3}>

// ใหม่ - 6 การ์ด/แถว
<Grid item xs={12} sm={6} md={4} lg={2}>
```

### ปรับความกว้างของหน้า

```tsx
// เดิม
<Container maxWidth="xl">

// ใหม่ - แคบลง
<Container maxWidth="lg">

// ใหม่ - ไม่จำกัด
<Container maxWidth={false}>
```

### ปรับขนาด Cover Preview

```tsx
// เดิม
<Box sx={{ width: 140 }}>

// ใหม่ - ใหญ่ขึ้น
<Box sx={{ width: 200 }}>
```

---

## 📝 หมายเหตุสำคัญ

1. **Material-UI Spacing:** ใช้ระบบ 8px grid (1 = 8px, 2 = 16px, ฯลฯ)
2. **Responsive Design:** ใช้ breakpoints (`xs`, `sm`, `md`, `lg`, `xl`) สำหรับ responsive
3. **Grid System:** ใช้ระบบ 12 คอลัมน์ (12 = 100%, 6 = 50%, 4 = 33.33%, 3 = 25%)
4. **Border Radius:** ค่า 1 = 4px (recommended), 2 = 8px, 3 = 12px, 4 = 16px
5. **มาตรฐานโปรเจกต์:** ใช้ `borderRadius: 1` เป็นมาตรฐานเพื่อความสม่ำเสมอ

---

## 🚀 เริ่มต้นปรับแต่ง

1. เปิดไฟล์ที่ต้องการแก้ไข
2. หาส่วนที่ต้องการปรับตามคู่มือนี้
3. แก้ไขค่าตามต้องการ
4. บันทึกไฟล์และดูผลลัพธ์

**ตัวอย่าง:**

```bash
# รัน dev server
bun run dev

# เปิดเบราว์เซอร์ที่ http://localhost:3000
```

---

**สร้างโดย:** Antigravity AI  
**อัพเดทล่าสุด:** 2026-01-12  
**Version:** v1.7.0
