import React from 'react';
import { Container, Typography, Box, Paper, List, ListItem, ListItemText, Divider, Chip } from '@mui/material';
import UpdateIcon from '@mui/icons-material/Update';

// Static data for changelog
const changelogData = [
  {
    date: '2025-11-28',
    version: 'v1.2.0',
    title: 'ปรับปรุงประสิทธิภาพและประสบการณ์ผู้ใช้',
    changes: [
      'ปรับปรุงการตอบสนองของระบบ API ให้รวดเร็วและลื่นไหลยิ่งขึ้น',
      'เพิ่มความเสถียรในการโหลดข้อมูลรูปภาพและเนื้อหา',
      'แก้ไขบั๊กเล็กน้อยทั่วไปเพื่อประสบการณ์การใช้งานที่ดียิ่งขึ้น'
    ]
  },
  {
    date: '2025-11-25',
    version: 'v1.1.0',
    title: 'ปรับโฉมและจัดระเบียบหน้าเว็บ',
    changes: [
      'ปรับปรุงดีไซน์หน้าเว็บไซต์ (UI) ให้ดูทันสมัย สบายตา และใช้งานได้ง่ายขึ้น',
      'จัดระเบียบโครงสร้างการแสดงผลให้มีความเป็นระเบียบ',
      'ลบส่วนประกอบที่ไม่จำเป็นออกเพื่อให้หน้าเว็บโหลดเร็วขึ้น',
      'แก้ไขข้อผิดพลาดเล็กน้อยในการแสดงผล'
    ]
  },
  {
    date: '2025-11-24',
    version: 'v1.0.5',
    title: 'ยกระดับประสบการณ์การใช้งาน',
    changes: [
      'เพิ่มเอฟเฟกต์เบลอฉากหลังเมื่อแสดงหน้าต่างยืนยันอายุ (Age Verification) เพื่อความสวยงามและเน้นข้อความเตือน',
      'แก้ไขปัญหาการแสดงผลบนหน้าจอมือถือบางรุ่นให้สมบูรณ์ยิ่งขึ้น',
      'ปรับปรุงประสิทธิภาพการทำงานและแก้ไขบั๊กทั่วไป'
    ]
  },
  {
    date: '2025-11-20',
    version: 'v1.0.0',
    title: 'เปิดตัวเว็บไซต์อย่างเป็นทางการ',
    changes: [
      'เปิดให้บริการเว็บไซต์อ่านมังงะออนไลน์อย่างเต็มรูปแบบ',
      'ระบบค้นหาและคัดกรองมังงะที่ใช้งานง่าย',
      'รองรับการอ่านที่สะดวกสบายทั้งบนคอมพิวเตอร์ แท็บเล็ต และมือถือ'
    ]
  }
];

export default function ChangelogPage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom sx={{ color: '#fafafa' }}>
          บันทึกการอัพเดท
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#a3a3a3' }}>
          ประวัติการปรับปรุงและพัฒนาเว็บไซต์ล่าสุด
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {changelogData.map((item, index) => (
          <Paper 
            key={index}
            sx={{ 
              p: 4, 
              bgcolor: '#171717', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              transition: 'transform 0.2s, border-color 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                borderColor: 'rgba(139, 92, 246, 0.5)'
              }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 2, gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h5" component="h2" fontWeight="bold" sx={{ color: '#fafafa' }}>
                  {item.title}
                </Typography>
                <Chip 
                  label={item.version} 
                  size="small" 
                  sx={{ 
                    bgcolor: 'rgba(139, 92, 246, 0.1)', 
                    color: '#a78bfa', 
                    fontWeight: 600,
                  }} 
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#a3a3a3' }}>
                <UpdateIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2" component="span">
                  {item.date}
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.05)' }} />

            <List disablePadding>
              {item.changes.map((change, i) => (
                <ListItem key={i} disablePadding sx={{ mb: 1, alignItems: 'flex-start' }}>
                  <Box component="span" sx={{ color: '#8b5cf6', mr: 1.5, mt: 0.5 }}>•</Box>
                  <ListItemText 
                    primary={change} 
                    primaryTypographyProps={{ 
                      variant: 'body1', 
                      color: '#d4d4d4',
                      component: 'h3' // Semantic heading for accessibility if needed, or just keep as body text
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
