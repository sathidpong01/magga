import React from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from "@mui/material";
import UpdateIcon from "@mui/icons-material/Update";

// Static data for changelog
const changelogData = [
  {
    date: "2026-01-11",
    version: "v1.7.2",
    title: "เพิ่มความปลอดภัย",
    changes: [
      "เพิ่มระบบตรวจสอบสิทธิ์ Admin ครบทุก API route",
      "เพิ่ม Rate Limiting ป้องกัน Spam - Registration (5/day), Password Change (3/hour), Comments (20/hour)",
      "เพิ่ม Input Sanitization ป้องกัน XSS Attack สำหรับ Tags, Categories, Authors",
      "Password Validation: ต้องมีอย่างน้อย 8 ตัวอักษร พร้อมตัวพิมพ์ใหญ่, ตัวพิมพ์เล็ก, ตัวเลข และอักข ระพิเศษ",
      "ปรับปรุงคะแนนความปลอดภัยจาก 8.5/10 เป็น 9.5/10",
    ],
  },
  {
    date: "2026-01-11",
    version: "v1.7.1",
    title: "ปรบปรงระบบจดการหลงบาน",
    changes: [
      "เพม Bulk Actions ในตารางมงงะ - เลอกหลายเรองพรอมกนแลวซอน/แสดง/ลบได",
      "ปรบปรง Modal และ Dialog ทงหมดใหมดไซนสวยงามขน (ลด border-radius 50%)",
      "เพม Loading Skeleton ครบทกหนา (9 หนา) - Dashboard, Users, Authors, Comments, Manga List, Manga Create/Edit, Submit",
      "แกไขหนาแกไขมงงะใหใช Prisma โหลดขอมลโดยตรง (แทน fetch API)",
      "แกไข Quick Settings Modal ใหอปเดต state ทนทโดยไมตองรเฟรช",
      "ปรบปรง NotificationModal ใหม spacing และ button styling ทดขน",
    ],
  },
  {
    date: "2026-01-10",
    version: "v1.7.0",
    title: "ระบบจัดการผู้แต่งใหม่",
    changes: [
      "เพิ่มระบบจัดการผู้แต่ง (Author Management) แยกจาก Manga",
      "รองรับหลาย Social Links ต่อผู้แต่ง (Twitter, Pixiv, Facebook, etc.)",
      "ฟีเจอร์ Auto-fetch ดึงชื่อและไอคอนจากลิงก์อัตโนมัติ",
      "หน้ามังงะแสดง Social Links ของผู้แต่งแบบใหม่สวยงามขึ้น",
      "ปรับปรุงโค้ดภายในให้มีประสิทธิภาพยิ่งขึ้น",
    ],
  },
  {
    date: "2026-01-04",
    version: "v1.6.1",
    title: "ปรับปรุงความเร็วในการโหลดหน้าเว็บ",
    changes: [
      "แก้ไขปัญหาหน้าอ่านมังงะโหลดช้า ตอนนี้เปิดอ่านได้เร็วขึ้นมาก",
      "ลดอาการหน้าเว็บกระตุกขณะโหลด",
      "ปรับปรุงประสิทธิภาพการแสดงผลโดยรวม",
    ],
  },
  {
    date: "2026-01-01",
    version: "v1.6.0",
    title: "ปรับปรุงระบบคอมเมนต์และความเร็ว",
    changes: [
      "ระบบคอมเมนต์เร็วและลื่นไหลขึ้น",
      "เพิ่มฟีเจอร์ขยายรูปในคอมเมนต์ กดดูรูปขนาดใหญ่ได้โดยตรง",
      "หน้าหลักและหน้าอ่านมังงะโหลดเร็วขึ้น",
      "เพิ่มอนิเมชันโหลดที่สวยงามขณะรอข้อมูล",
    ],
  },
  {
    date: "2025-12-26",
    version: "v1.5.0",
    title: "ปรับปรุงหน้าตาและความสะดวกในการใช้งาน",
    changes: [
      "เพิ่มหน้าแสดงผลเมื่อไม่พบมังงะ พร้อมปุ่มล้างตัวกรอง",
      "เพิ่มระบบโหลดมังงะเพิ่มอัตโนมัติเมื่อเลื่อนหน้าจอลง",
      "เพิ่มระบบแจ้งเตือนแบบ Popup เมื่อทำรายการสำเร็จหรือเกิดข้อผิดพลาด",
      "เพิ่มแถบแสดงความคืบหน้าการอ่าน บอกว่าอ่านถึงหน้าไหนแล้ว",
      "เพิ่มหน้าต่างขอความยินยอมใช้คุกกี้",
      "ปรับการ์ดมังงะเป็น 2 คอลัมน์บนมือถือ ดูง่ายขึ้น",
      "แก้ไขอาการหน้าเว็บกระตุกขณะโหลด",
      "เพิ่มอนิเมชัน hover ให้สวยงามยิ่งขึ้น",
    ],
  },
  {
    date: "2025-12-08",
    version: "v1.4.1",
    title: "ปรับปรุงความปลอดภัยและแก้ไขบั๊ก",
    changes: [
      "ตรวจสอบและแก้ไขช่องโหว่ความปลอดภัย",
      "แก้ไขปัญหาไอคอนผู้แต่งไม่แสดงผล",
    ],
  },
  {
    date: "2025-12-05",
    version: "v1.4.0",
    title: "เพิ่มหน้านโยบายและปรับปรุงความปลอดภัย",
    changes: [
      'เพิ่มหน้า "นโยบายความเป็นส่วนตัว" ภาษาไทย',
      'เพิ่มหน้า "ข้อตกลงในการใช้งาน" ภาษาไทย',
      'เพิ่มหน้า "รายงานการละเมิดลิขสิทธิ์" (DMCA)',
      "ปรับปรุง Footer ใหม่ให้สวยงามยิ่งขึ้น",
    ],
  },
  {
    date: "2025-12-04",
    version: "v1.3.1",
    title: "อัปเกรดระบบอัปโหลดและความปลอดภัย",
    changes: [
      "เพิ่มแถบแสดงสถานะการอัปโหลดแบบเรียลไทม์ที่มุมขวาล่าง",
      "เพิ่มปุ่มลองใหม่สำหรับไฟล์ที่อัปโหลดไม่สำเร็จ",
      "แก้ไขข้อความแจ้งเตือนให้เข้าใจง่ายขึ้น",
      "อัปเดตระบบความปลอดภัยให้ทันสมัย",
    ],
  },
  {
    date: "2025-12-02",
    version: "v1.3.0",
    title: "ปรับปรุงหน้าตาเว็บไซต์",
    changes: [
      'เพิ่มปุ่ม "ฝากลงมังงะ" ที่เมนูด้านบน',
      "ปรับปรุง Header ให้ติดหน้าจอและโปร่งใสสวยงาม",
      "ปรับปรุง Footer ให้ดูเรียบง่ายและเป็นมืออาชีพ",
      "ปรับดีไซน์การ์ดมังงะใหม่ให้สวยงามยิ่งขึ้น",
    ],
  },
  {
    date: "2025-11-28",
    version: "v1.2.0",
    title: "ปรับปรุงประสิทธิภาพและประสบการณ์ผู้ใช้",
    changes: [
      "เว็บไซต์ตอบสนองเร็วและลื่นไหลยิ่งขึ้น",
      "เพิ่มความเสถียรในการโหลดรูปภาพ",
      "แก้ไขบั๊กเล็กน้อยทั่วไป",
    ],
  },
  {
    date: "2025-11-25",
    version: "v1.1.0",
    title: "ปรับโฉมและจัดระเบียบหน้าเว็บ",
    changes: [
      "ปรับปรุงดีไซน์ให้ทันสมัย สบายตา และใช้งานง่ายขึ้น",
      "จัดระเบียบโครงสร้างการแสดงผลให้เป็นระเบียบ",
      "หน้าเว็บโหลดเร็วขึ้น",
    ],
  },
  {
    date: "2025-11-24",
    version: "v1.0.5",
    title: "ยกระดับประสบการณ์การใช้งาน",
    changes: [
      "เพิ่มเอฟเฟกต์เบลอฉากหลังเมื่อแสดงหน้าต่างยืนยันอายุ",
      "แก้ไขปัญหาการแสดงผลบนมือถือบางรุ่น",
      "ปรับปรุงประสิทธิภาพและแก้ไขบั๊กทั่วไป",
    ],
  },
  {
    date: "2025-11-20",
    version: "v1.0.0",
    title: "เปิดตัวเว็บไซต์อย่างเป็นทางการ",
    changes: [
      "เปิดให้บริการเว็บไซต์อ่านมังงะออนไลน์",
      "ระบบค้นหาและคัดกรองมังงะที่ใช้งานง่าย",
      "รองรับการอ่านทั้งบนคอมพิวเตอร์ แท็บเล็ต และมือถือ",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ mb: 6, textAlign: "center" }}>
        <Typography
          variant="h3"
          component="h1"
          fontWeight="bold"
          gutterBottom
          sx={{ color: "#fafafa" }}
        >
          บันทึกการอัพเดท
        </Typography>
        <Typography variant="subtitle1" sx={{ color: "#a3a3a3" }}>
          ประวัติการปรับปรุงและพัฒนาเว็บไซต์ล่าสุด
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {changelogData.map((item, index) => (
          <Paper
            key={index}
            sx={{
              p: 4,
              bgcolor: "#171717",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 1,
              transition: "transform 0.2s, border-color 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                borderColor: "rgba(139, 92, 246, 0.5)",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
                mb: 2,
                gap: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography
                  variant="h5"
                  component="h2"
                  fontWeight="bold"
                  sx={{ color: "#fafafa" }}
                >
                  {item.title}
                </Typography>
                <Chip
                  label={item.version}
                  size="small"
                  sx={{
                    bgcolor: "rgba(139, 92, 246, 0.1)",
                    color: "#a78bfa",
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "#a3a3a3",
                }}
              >
                <UpdateIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2" component="span">
                  {item.date}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2, borderColor: "rgba(255, 255, 255, 0.05)" }} />

            <List disablePadding>
              {item.changes.map((change, i) => (
                <ListItem
                  key={i}
                  disablePadding
                  sx={{ mb: 1, alignItems: "flex-start" }}
                >
                  <Box
                    component="span"
                    sx={{ color: "#8b5cf6", mr: 1.5, mt: 0.5 }}
                  >
                    •
                  </Box>
                  <ListItemText
                    primary={change}
                    primaryTypographyProps={{
                      variant: "body1",
                      color: "#d4d4d4",
                      component: "h3", // Semantic heading for accessibility if needed, or just keep as body text
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        ))}
      </Box>
    </Container>
  );
}
