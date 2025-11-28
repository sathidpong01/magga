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
        <Typography variant="h6" sx={{ color: '#a3a3a3' }}>
          ประวัติการปรับปรุงและพัฒนาเว็บไซต์ล่าสุด
        </Typography>
      </Box>

      <Box sx={{ position: 'relative' }}>
        {/* Vertical line */}
        <Box 
          sx={{ 
            position: 'absolute', 
            left: { xs: 20, md: '50%' }, 
            top: 0, 
            bottom: 0, 
            width: 2, 
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            transform: { md: 'translateX(-50%)' }
          }} 
        />

        {changelogData.map((item, index) => (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: index % 2 === 0 ? 'row' : 'row-reverse' },
              alignItems: 'center',
              mb: 6,
              position: 'relative'
            }}
          >
            {/* Date/Version Bubble */}
            <Box 
              sx={{ 
                width: { xs: 'auto', md: '50%' }, 
                px: { xs: 0, md: 4 }, 
                pl: { xs: 6, md: index % 2 === 0 ? 0 : 4 },
                pr: { xs: 0, md: index % 2 === 0 ? 4 : 0 },
                textAlign: { xs: 'left', md: index % 2 === 0 ? 'right' : 'left' },
                mb: { xs: 2, md: 0 }
              }}
            >
              <Typography variant="h6" sx={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                {item.date}
              </Typography>
              <Chip 
                label={item.version} 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(139, 92, 246, 0.1)', 
                  color: '#a78bfa', 
                  fontWeight: 600,
                  mt: 0.5
                }} 
              />
            </Box>

            {/* Center Icon */}
            <Box 
              sx={{ 
                position: 'absolute', 
                left: { xs: 20, md: '50%' }, 
                width: 40, 
                height: 40, 
                borderRadius: '50%', 
                bgcolor: '#171717', 
                border: '2px solid #8b5cf6',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                zIndex: 1,
                transform: { xs: 'translateX(-50%)', md: 'translateX(-50%)' }
              }}
            >
              <UpdateIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />
            </Box>

            {/* Content Card */}
            <Box sx={{ width: { xs: '100%', md: '50%' }, pl: { xs: 6, md: index % 2 === 0 ? 4 : 0 }, pr: { xs: 0, md: index % 2 === 0 ? 0 : 4 } }}>
              <Paper 
                sx={{ 
                  p: 3, 
                  bgcolor: '#171717', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'rgba(139, 92, 246, 0.3)'
                  }
                }}
              >
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#fafafa' }}>
                  {item.title}
                </Typography>
                <List dense disablePadding>
                  {item.changes.map((change, i) => (
                    <ListItem key={i} disablePadding sx={{ mb: 0.5 }}>
                      <Box component="span" sx={{ color: '#a3a3a3', mr: 1 }}>•</Box>
                      <ListItemText primary={change} primaryTypographyProps={{ variant: 'body2', color: '#d4d4d4' }} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          </Box>
        ))}
      </Box>
    </Container>
  );
}
