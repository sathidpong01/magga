import { Container, Typography, Box, Paper, Divider, Alert } from "@mui/material";
import { Metadata } from "next";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import EmailIcon from "@mui/icons-material/Email";
import Link from "next/link";

export const metadata: Metadata = {
  title: "รายงานการละเมิด - MAGGA",
  description: "แจ้งเรื่องการละเมิดลิขสิทธิ์และนโยบาย DMCA ของ MAGGA",
};

export default function ReportPage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, bgcolor: '#171717', borderRadius: 1, border: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <ReportProblemIcon sx={{ color: '#fbbf24', fontSize: 32 }} />
          <Typography variant="h4" component="h1" fontWeight="bold" sx={{ color: '#fafafa' }}>
            รายงานการละเมิด
          </Typography>
        </Box>

        <Typography variant="body1" sx={{ color: '#d4d4d4', mb: 4, lineHeight: 1.8 }}>
          หากต้องการแจ้งเรื่องการละเมิดลิขสิทธิ์กับเว็บไซต์ MAGGA คุณจะต้องส่งคำร้องเป็นลายลักษณ์อักษรผ่านช่องทางการติดต่อ 
          โดยต้องมีข้อมูลตามที่ระบุไว้ในมาตรา 512(c)(3) ของกฎหมาย Digital Millennium Copyright Act (DMCA)
        </Typography>

        <Alert 
          severity="info" 
          icon={<EmailIcon />}
          sx={{ 
            mb: 4, 
            bgcolor: 'rgba(59, 130, 246, 0.1)', 
            border: '1px solid rgba(59, 130, 246, 0.3)',
            '& .MuiAlert-message': { color: '#93c5fd' }
          }}
        >
          <Typography variant="body2">
            ติดต่อแจ้งเรื่องที่: <strong>Facebook @nightsu9</strong>
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Section title="ขั้นตอนในการเขียนคำร้อง DMCA">
            <Typography paragraph>
              รายละเอียดที่ต้องระบุในคำร้อง DMCA ได้แก่:
            </Typography>
            
            <Box sx={{ pl: 2 }}>
              <Typography paragraph sx={{ mb: 2 }}>
                <strong style={{ color: '#fbbf24' }}>ก) ระบุตัวตน:</strong> แจ้งว่าคุณเป็นเจ้าของลิขสิทธิ์ผลงานหรือสิทธิ์แต่เพียงผู้เดียวที่ถูกละเมิด 
                หรือเป็นผู้ที่ได้รับมอบอำนาจให้กระทำการแทนเจ้าของ พร้อมแนบลายเซ็นจริงหรือลายเซ็นอิเล็กทรอนิกส์
              </Typography>

              <Typography paragraph sx={{ mb: 2 }}>
                <strong style={{ color: '#fbbf24' }}>ข) ระบุผลงาน:</strong> ระบุผลงานที่คุณเชื่อว่าถูกละเมิดลิขสิทธิ์ หากมีหลายผลงาน ให้ระบุเป็นรายการ
              </Typography>

              <Typography paragraph sx={{ mb: 2 }}>
                <strong style={{ color: '#fbbf24' }}>ค) ระบุตำแหน่งของเนื้อหาที่ละเมิดลิขสิทธิ์:</strong> ระบุ URL ของหน้าที่ละเมิดลิขสิทธิ์ในเว็บไซต์ 
                ห้ามส่งไฟล์แนบใดๆ เช่น รูปภาพ หรือไฟล์ PDF ให้ใส่ URL ทั้งหมดในเนื้อหาจดหมาย เพื่อการดำเนินการที่รวดเร็วยิ่งขึ้น
              </Typography>

              <Typography paragraph sx={{ mb: 2 }}>
                <strong style={{ color: '#fbbf24' }}>ง) ข้อมูลติดต่อของคุณ:</strong> ระบุชื่อ ที่อยู่ และอีเมล 
                หากกระทำการแทนเจ้าของลิขสิทธิ์ ให้ระบุความเกี่ยวข้องของคุณ (เช่น ทนายความ, ตัวแทน)
              </Typography>

              <Typography paragraph sx={{ mb: 2 }}>
                <strong style={{ color: '#fbbf24' }}>จ) ยืนยันว่าคุณเชื่อโดยสุจริต:</strong> ระบุว่าคุณเชื่อโดยสุจริตว่าการใช้เนื้อหาดังกล่าวไม่ได้รับอนุญาตจากเจ้าของลิขสิทธิ์ 
                ตัวแทน หรือไม่ชอบด้วยกฎหมาย
              </Typography>

              <Typography paragraph>
                <strong style={{ color: '#fbbf24' }}>ฉ) ยืนยันความถูกต้องของข้อมูล:</strong> ระบุข้อความต่อไปนี้เพื่อรับรองความถูกต้องของข้อมูลภายใต้บทลงโทษของการให้การเท็จ:
              </Typography>
              
              <Paper sx={{ p: 2, bgcolor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#a3a3a3', fontStyle: 'italic' }}>
                  "I swear, under penalty of perjury, that the information in the notification is accurate and that I am the (copyright) owner 
                  or am authorized to act on behalf of the owner of an exclusive right that is allegedly infringed."
                </Typography>
              </Paper>
            </Box>
          </Section>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

          <Section title="ข้อกำหนดเพิ่มเติม">
            <Alert severity="warning" sx={{ mb: 3, bgcolor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
              <Typography variant="body2" sx={{ color: '#fcd34d' }}>
                คำร้องจะต้องมีครบทั้ง 6 ข้อ หากข้อมูลไม่ครบถ้วน จะไม่สามารถดำเนินการได้
              </Typography>
            </Alert>
            <Typography paragraph>
              ตามที่ระบุไว้ในกฎหมาย 17 U.S. Code § 512(c)(3):
            </Typography>
            <Typography variant="body2" sx={{ color: '#737373', fontStyle: 'italic', pl: 2 }}>
              (B) คำร้องที่ไม่สมบูรณ์ - หากเนื้อหาหรือกิจกรรมที่ถูกอ้างว่าละเมิดลิขสิทธิ์ 
              ไม่สอดคล้องกับข้อกำหนดในอนุมาตรา (A) อย่างมีนัยสำคัญ จะไม่ได้รับการพิจารณาภายใต้ย่อหน้า (1)(C)...
            </Typography>
            <Typography sx={{ mt: 2, color: '#fbbf24', fontWeight: 500 }}>
              กรุณาเขียนคำร้องเป็นภาษาอังกฤษ
            </Typography>
          </Section>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

          <Section title="การดำเนินการหลังจากได้รับคำร้อง">
            <Typography paragraph>
              คำร้องที่กรอกข้อมูลถูกต้อง จะถูกดำเนินการลบเนื้อหา 100% 
              หาก MAGGA ได้รับแจ้งการละเมิดลิขสิทธิ์ที่ถูกต้อง จะดำเนินการลบเนื้อหาที่ละเมิดอย่างรวดเร็ว
            </Typography>
            <Typography>
              อย่างไรก็ตาม MAGGA จะไม่ส่งการยืนยันการดำเนินการลบเนื้อหาซ้ำให้แก่ผู้แจ้ง 
              โปรดให้เวลาที่เหมาะสมในการตรวจสอบกรณี หากไม่มีการดำเนินการใดๆ ภายในระยะเวลาที่เหมาะสม โปรดติดต่อเราอีกครั้งเพื่อตรวจสอบซ้ำ
            </Typography>
          </Section>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

          <Section title="นโยบายและข้อมูลเพิ่มเติม">
            <ul>
              <li>MAGGA เป็นเว็บไซต์ที่ให้บริการด้านการอ่านและเผยแพร่เนื้อหาที่เกี่ยวข้องกับการ์ตูนแปลไทย</li>
              <li>
                ลิงก์และรูปภาพที่ปรากฏในเว็บไซต์ อาจเป็นการอ้างอิงจากแหล่งข้อมูลที่เผยแพร่บนเครือข่ายอินเทอร์เน็ต 
                โดยถูกนำเสนอในลักษณะ "ตามสภาพที่เป็นอยู่" (as is) เว็บไซต์ไม่สามารถรับประกันความถูกต้อง ครบถ้วน หรือความทันสมัยของข้อมูลเหล่านั้นได้
              </li>
              <li>
                เว็บไซต์อนุญาตให้ผู้ใช้งานทั่วไปและผู้ใช้งานที่ลงทะเบียนส่งข้อมูลหรือความคิดเห็นเข้ามาได้ 
                โดยข้อมูลดังกล่าวจะถูกเผยแพร่ในรูปแบบ "ตามสภาพที่เป็นอยู่" เช่นเดียวกัน
              </li>
              <li>
                หากมีการแจ้งเรื่องการละเมิดลิขสิทธิ์ เนื้อหานั้นจะต้องถูกพิจารณาผ่านกระบวนการที่เหมาะสม 
                และเว็บไซต์อาจดำเนินการลบหรือระงับการเข้าถึงตามสมควร
              </li>
              <li>
                ความคิดเห็น ข้อความ และลิงก์ที่ผู้ใช้งานเผยแพร่ ถือเป็นความรับผิดชอบของผู้ใช้งานแต่ละราย 
                เว็บไซต์ขอสงวนสิทธิ์ในการลบ แก้ไข หรือจำกัดการเข้าถึง หากเนื้อหาดังกล่าวไม่เหมาะสม ผิดกฎหมาย หรือมีการร้องเรียนอย่างเป็นทางการ
              </li>
            </ul>
          </Section>
        </Box>

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="body2" color="text.secondary">
            ติดต่อเรา: <Link href="https://www.facebook.com/nightsu9/" target="_blank" style={{ color: '#fbbf24' }}>Facebook @nightsu9</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" sx={{ color: '#fbbf24', mb: 2 }}>
        {title}
      </Typography>
      <Box sx={{ 
        color: '#a3a3a3', 
        '& ul': { pl: 3, mt: 1, mb: 2 }, 
        '& li': { mb: 1.5, lineHeight: 1.7 },
        '& p': { mb: 2, lineHeight: 1.8 },
        '& strong': { color: '#d4d4d4' }
      }}>
        {children}
      </Box>
    </Box>
  );
}
