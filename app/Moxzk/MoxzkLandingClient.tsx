"use client";

import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Cloud,
  Code2,
  Cpu,
  Download,
  FileArchive,
  Layout,
  Wrench,
  Zap,
} from "lucide-react";
import ComparisonSlider from "./components/ComparisonSlider";

const RELEASE_URL = "https://github.com/sathidpong01/Moxzk/releases/latest";
const GITHUB_URL = "https://github.com/sathidpong01/Moxzk";
const ISSUES_URL = "https://github.com/sathidpong01/Moxzk/issues";
const RELEASES_URL = "https://github.com/sathidpong01/Moxzk/releases";
const WIKI_URL = "https://github.com/sathidpong01/Moxzk/blob/master/docs/wiki/README.md";

const CodeIcon = ({ size = 20 }: { size?: number }) => <Code2 size={size} />;

const FloatingCard = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <div
    className={`absolute px-3 py-2.5 text-xs shadow-xl pointer-events-none ${className ?? ""}`}
    style={{
      backdropFilter: "blur(16px)",
      background: "rgba(13,13,16,0.85)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "0.875rem",
    }}
  >
    {children}
  </div>
);

const features = [
  {
    icon: Wrench,
    color: "#14b8a6",
    glow: "rgba(20,184,166,0.12)",
    title: "คลีนข้อความเดิม",
    desc: "ลบข้อความในช่องคำพูดออกจากภาพ แล้วเปิดให้คุณตรวจและแก้จุดที่ยังไม่เนียน",
  },
  {
    icon: Cpu,
    color: "#38bdf8",
    glow: "rgba(56,189,248,0.12)",
    title: "ช่วยอ่านและแปลไทย",
    desc: "ให้ AI ช่วยอ่านข้อความจากภาพและร่างคำแปลไทย เพื่อเริ่มงานได้เร็วขึ้น",
  },
  {
    icon: Layout,
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.12)",
    title: "แก้ข้อความบนภาพ",
    desc: "ปรับคำ ฟอนต์ สี เส้นขอบ ตำแหน่ง และขนาดกรอบข้อความได้จากหน้าแก้ไข",
  },
  {
    icon: BookOpen,
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.12)",
    title: "ทำงานหลายหน้า",
    desc: "เปิดหลายหน้าในงานเดียว สลับหน้า ตรวจภาพรวม และให้แอปช่วยประมวลผลหลายหน้าต่อเนื่อง",
  },
  {
    icon: Cloud,
    color: "#f472b6",
    glow: "rgba(244,114,182,0.12)",
    title: "บันทึกงานไว้ทำต่อ",
    desc: "บันทึกเป็นไฟล์ .moxzk บนเครื่อง หรือใช้บัญชีเพื่อเก็บงานเป็นอัลบั้มและเปิดกลับมาแก้ต่อ",
  },
  {
    icon: FileArchive,
    color: "#94a3b8",
    glow: "rgba(148,163,184,0.1)",
    title: "ส่งออกเป็นรูป",
    desc: "เลือกหน้าที่ต้องการ แล้วส่งออกเป็นไฟล์ภาพหรือชุดไฟล์สำหรับนำไปใช้งานต่อ",
  },
];

const downloadNotes = [
  {
    icon: Download,
    title: "GitHub Releases",
    body: "ใช้ลิงก์ release ล่าสุดของโปรเจคเป็นแหล่งดาวน์โหลด",
  },
  {
    icon: AlertTriangle,
    title: "คำเตือน Windows",
    body: "ตอนนี้แอปยังไม่ได้เซ็นชื่อ Windows อาจเตือนตอนเปิดไฟล์ติดตั้ง",
  },
  {
    icon: CheckCircle2,
    title: "ตรวจไฟล์",
    body: "ถ้า release มี SHA256 ให้ใช้ตรวจไฟล์ก่อนติดตั้ง",
  },
  {
    icon: FileArchive,
    title: "Windows เท่านั้น",
    body: "Moxzk ทำและทดสอบสำหรับ Windows desktop เป็นหลัก",
  },
];

const howToSteps = [
  {
    title: "ติดตั้ง Moxzk",
    body: "ดาวน์โหลดจาก GitHub Releases แล้วติดตั้งบน Windows",
  },
  {
    title: "ตั้งค่าเครื่องมือ",
    body: "เตรียม PanelCleaner, Ollama และโมเดลที่ใช้ช่วยอ่านภาพ",
  },
  {
    title: "คลีนและแปล",
    body: "เพิ่มรูป ให้แอปช่วยลบข้อความเดิมและร่างคำแปลไทย",
  },
  {
    title: "ตรวจงานและส่งออก",
    body: "แก้คำและตำแหน่งข้อความ แล้วบันทึกงานหรือส่งออกเป็นรูป",
  },
];

const faqs = [
  ["ใช้ Windows เท่านั้นไหม?", "ใช่ ตอนนี้ Moxzk ทำและทดสอบสำหรับ Windows เป็นหลัก"],
  ["ต้องสมัครบัญชีไหม?", "ไม่จำเป็นถ้าทำงานบนเครื่องตัวเอง ต้องใช้บัญชีเฉพาะตอนบันทึกงานเป็นอัลบั้มออนไลน์"],
  ["ต้องติดตั้ง Ollama หรือ PanelCleaner ไหม?", "ต้องมีสำหรับการลบข้อความและแปลด้วย AI แอปมีหน้า Settings ช่วยตรวจว่าพร้อมใช้งานหรือยัง"],
  ["รูปภาพออกจากเครื่องไหม?", "งานลบข้อความและแปลทำจากเครื่องเป็นหลัก แต่ถ้าเลือกบันทึกเป็นอัลบั้มออนไลน์ รูปและข้อมูลงานจะถูกอัปโหลดไปเก็บกับบัญชี"],
  ["อัลบั้มออนไลน์คืออะไร?", "พื้นที่บันทึกงานที่ผูกกับบัญชี ใช้เปิดงานหลายหน้ากลับมาแก้ต่อได้สะดวก"],
  ["ทำไม Windows เตือนตอนติดตั้ง?", "เพราะแอปยังไม่ได้เซ็นชื่อ ให้ดาวน์โหลดจาก GitHub Releases ของโปรเจคเท่านั้น และตรวจ SHA256 ถ้ามีให้"],
  ["อัปเดตแอปยังไง?", "แอปเช็คเวอร์ชันใหม่จาก GitHub Releases หรือดาวน์โหลดตัวติดตั้งล่าสุดมาติดตั้งทับได้"],
  ["เปิดไฟล์งานเดิมหรือย้ายเครื่องได้ไหม?", "ได้ บันทึกเป็นไฟล์ .moxzk แล้วย้ายไฟล์ไปเปิดบนเครื่องใหม่ที่ตั้งค่าเครื่องมือพร้อมแล้ว"],
  ["ถ้าแปลหรือคลีนไม่ทำงานต้องเช็คอะไร?", "เช็คหน้า Settings ว่า PanelCleaner, Ollama และโมเดลพร้อมใช้งาน แล้วลองกับรูปหนึ่งหน้าก่อน"],
  ["ใช้ฟรีไหม?", "ดาวน์โหลดจาก GitHub Releases ได้ ส่วนบริการออนไลน์หรือเครื่องมือภายนอกอาจมีข้อจำกัดของบริการนั้น"],
];

export default function MoxzkLandingClient() {
  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background: "#050507",
        color: "white",
        fontFamily: "Kanit, system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          zIndex: 0,
        }}
      />
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "900px",
          height: "600px",
          background:
            "radial-gradient(ellipse at top, rgba(20,184,166,0.12) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />

      <nav
        className="fixed top-0 z-50 flex w-full items-center justify-between px-5 py-4 md:px-8"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
          background: "rgba(5,5,7,0.8)",
        }}
      >
        <div className="flex items-center gap-2.5 text-lg font-bold tracking-normal">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/moxzk-logo.svg" alt="Moxzk" className="h-8 w-8 rounded-lg" />
          <span>Moxzk</span>
        </div>
        <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <a href="#features" className="transition-colors hover:text-white">
            Features
          </a>
          <a href="#how-to" className="transition-colors hover:text-white">
            How it Works
          </a>
          <a href="#faq" className="transition-colors hover:text-white">
            FAQ
          </a>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={GITHUB_URL}
            className="hidden items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white sm:flex"
          >
            <CodeIcon size={18} />
            <span>GitHub</span>
          </a>
          <a
            href={RELEASE_URL}
            className="hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-black transition-all hover:opacity-90 active:scale-95 sm:flex"
            style={{ background: "linear-gradient(135deg,#14b8a6,#0ea5e9)" }}
          >
            <Download size={14} />
            Download
          </a>
        </div>
      </nav>

      <section className="relative z-10 flex min-h-screen items-center pt-20">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-5 md:px-8 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-8">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{
                background: "rgba(20,184,166,0.12)",
                border: "1px solid rgba(20,184,166,0.3)",
                color: "#2dd4bf",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              Free Download · Windows
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-black leading-[1.05] tracking-normal lg:text-7xl">
                Moxzk
                <br />
                <span style={{ color: "#2dd4bf" }}>Manga Editor</span>
              </h1>
              <p className="max-w-lg text-lg leading-relaxed text-zinc-300">
                <span className="block sm:inline">คลีนภาพมังงะ แปลไทย </span>
                <span className="block sm:inline">และจัดข้อความกลับบนภาพ </span>
                <span className="block sm:inline">ในแอปเดสก์ท็อปเดียว</span>
              </p>
              <p className="max-w-lg text-sm leading-7 text-zinc-500">
                <span className="block sm:inline">AI ช่วยลบข้อความเดิม อ่านภาพ </span>
                <span className="block sm:inline">และร่างคำแปลให้เร็วขึ้น </span>
                <span className="block sm:inline">ส่วนคุณยังแก้คำ ฟอนต์ ตำแหน่ง </span>
                <span className="block sm:inline">และส่งออกงานเองได้เหมือนใช้โปรแกรมแก้ภาพ</span>
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={RELEASE_URL}
                className="flex items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-bold text-black shadow-lg transition-all hover:scale-105 hover:opacity-90 active:scale-95"
                style={{
                  background: "linear-gradient(135deg,#14b8a6,#0ea5e9)",
                  boxShadow: "0 0 32px rgba(20,184,166,0.35)",
                }}
              >
                <Download size={16} />
                Download for Windows
              </a>
              <a
                href="#how-to"
                className="flex items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-semibold text-zinc-300 transition-all hover:bg-white/10 hover:text-white"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                อ่านวิธีติดตั้ง
                <ArrowRight size={14} />
              </a>
            </div>

            <p className="max-w-lg text-xs leading-6 text-zinc-600">
              <span className="block sm:inline">ดาวน์โหลดจาก GitHub Releases เท่านั้น </span>
              <span className="block sm:inline">ตอนนี้แอปยังไม่ได้เซ็นชื่อ </span>
              <span className="block sm:inline">Windows อาจแสดงคำเตือนตอนเปิดไฟล์ติดตั้ง</span>
            </p>
          </div>

          <div className="relative px-0 py-8 md:px-4 lg:-ml-8 lg:-mr-20 lg:py-0 xl:-ml-16 xl:-mr-44 2xl:-mr-52">
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(20,184,166,0.1) 0%, transparent 70%)",
              }}
            />
            <div
              className="relative overflow-hidden rounded-2xl shadow-2xl"
              style={{
                transform: "perspective(1200px) rotateY(-3deg) rotateX(1.5deg)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow:
                  "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/moxzk-app.png"
                alt="Moxzk app manga editor"
                className="block h-auto w-full"
                draggable={false}
              />
            </div>

            <FloatingCard className="left-0 top-4 z-20 hidden md:block">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: "rgba(20,184,166,0.2)" }}
                >
                  <Zap size={14} style={{ color: "#2dd4bf" }} />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-white">ลบข้อความ + แปล</div>
                  <div className="text-[10px] text-zinc-500">AI ช่วยเริ่มงานเร็วขึ้น</div>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard className="right-0 bottom-12 z-20 hidden md:block">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: "rgba(14,165,233,0.2)" }}
                >
                  <Cloud size={14} style={{ color: "#38bdf8" }} />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-white">บันทึกเป็นอัลบั้ม</div>
                  <div className="text-[10px] text-zinc-500">เปิดกลับมาแก้ต่อได้</div>
                </div>
              </div>
            </FloatingCard>
          </div>
        </div>
      </section>

      <section
        id="download"
        className="relative z-10 border-y py-16"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-teal-300">
              Download
            </p>
            <h2 className="text-3xl font-black tracking-normal md:text-4xl">
              ดาวน์โหลดอย่างปลอดภัย
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
              ดาวน์โหลดจาก GitHub Releases ของโปรเจคเท่านั้น ถ้ามี SHA256 ให้ตรวจไฟล์ก่อนติดตั้ง และเก็บตัวติดตั้งไว้ใช้เมื่อต้องอัปเดตเอง
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {downloadNotes.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(13,13,16,0.6)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Icon className="mb-4 text-teal-300" size={18} />
                <h3 className="mb-2 text-sm font-bold">{title}</h3>
                <p className="text-sm leading-6 text-zinc-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="compare" className="relative z-10 px-5 py-28 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 space-y-4 text-center">
            <div
              className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: "rgba(20,184,166,0.1)",
                border: "1px solid rgba(20,184,166,0.25)",
                color: "#2dd4bf",
              }}
            >
              Before → After
            </div>
            <h2 className="text-4xl font-black tracking-normal">ดูตัวอย่างก่อนและหลังแปล</h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-zinc-500">
              ลากแถบเพื่อดูภาพต้นฉบับเทียบกับผลลัพธ์ภาษาไทย
            </p>
          </div>
          <ComparisonSlider />
        </div>
      </section>

      <section id="features" className="relative z-10 px-5 py-28 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 space-y-3 text-center">
            <div
              className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: "rgba(56,189,248,0.1)",
                border: "1px solid rgba(56,189,248,0.25)",
                color: "#38bdf8",
              }}
            >
              Features
            </div>
            <h2 className="text-4xl font-black tracking-normal">ฟังก์ชันหลักที่ใช้ทำงานจริง</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, color, glow, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl p-6 transition-all hover:scale-[1.02]"
                style={{
                  background: "rgba(13,13,16,0.6)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{ background: glow, border: `1px solid ${color}30` }}
                >
                  <Icon size={18} color={color} />
                </div>
                <h3 className="mb-2 text-base font-bold">{title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-to" className="relative z-10 px-5 py-28 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-teal-300">
              How it works
            </p>
            <h2 className="text-4xl font-black tracking-normal">
              เริ่มจากรูปหนึ่งหน้า แล้วค่อยทำทั้งเล่ม
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {howToSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(13,13,16,0.6)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400 text-sm font-black text-zinc-950">
                  {index + 1}
                </div>
                <h3 className="mb-2 text-sm font-bold">{step.title}</h3>
                <p className="text-sm leading-6 text-zinc-500">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="relative z-10 px-5 py-28 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-teal-300">
              FAQ
            </p>
            <h2 className="text-4xl font-black tracking-normal">คำถามก่อนดาวน์โหลด</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {faqs.map(([question, answer]) => (
              <details
                key={question}
                className="group rounded-2xl p-5"
                style={{
                  background: "rgba(13,13,16,0.6)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <summary className="cursor-pointer list-none font-bold marker:hidden">
                  <span className="flex items-start justify-between gap-4">
                    {question}
                    <span className="text-teal-300 transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-7 text-zinc-500">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 py-32 md:px-8">
        <div className="relative mx-auto max-w-4xl text-center">
          <div
            className="absolute inset-0 -m-12 rounded-3xl pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse, rgba(20,184,166,0.08) 0%, transparent 70%)",
            }}
          />
          <div
            className="relative rounded-3xl p-8 md:p-16"
            style={{
              background: "rgba(13,13,16,0.8)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              className="mb-6 inline-block rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: "rgba(20,184,166,0.1)",
                border: "1px solid rgba(20,184,166,0.25)",
                color: "#2dd4bf",
              }}
            >
              Free Download · Windows
            </div>
            <h2 className="mb-5 text-4xl font-black tracking-normal md:text-5xl">
              พร้อมเริ่มแปลมังงะหรือยัง?
            </h2>
            <p className="mx-auto mb-10 max-w-md text-sm leading-relaxed text-zinc-500">
              ดาวน์โหลด Moxzk ผ่าน GitHub Releases แล้วลองเริ่มจากรูปหนึ่งหน้าก่อนทำงานหลายหน้า
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href={RELEASE_URL}
                className="flex items-center gap-2.5 rounded-full px-8 py-4 text-sm font-bold text-black transition-all hover:scale-105 hover:opacity-90 active:scale-95"
                style={{
                  background: "linear-gradient(135deg,#14b8a6,#0ea5e9)",
                  boxShadow: "0 0 40px rgba(20,184,166,0.3)",
                }}
              >
                <Download size={16} />
                Download Latest Release
              </a>
              <a
                href={GITHUB_URL}
                className="flex items-center gap-2.5 rounded-full px-8 py-4 text-sm font-semibold text-zinc-300 transition-all hover:bg-white/10 hover:text-white"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <CodeIcon size={16} />
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer
        className="relative z-10 px-5 py-12 text-sm md:px-8"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2 font-bold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/moxzk-logo.svg" alt="Moxzk" className="h-6 w-6 rounded-md" />
            <span>Moxzk</span>
            <span className="ml-1 font-normal text-zinc-600">สำหรับงานแปลมังงะบน Windows</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-zinc-500">
            <a href={GITHUB_URL} className="transition-colors hover:text-white">
              GitHub
            </a>
            <a href={RELEASES_URL} className="transition-colors hover:text-white">
              Releases
            </a>
            <a href={ISSUES_URL} className="transition-colors hover:text-white">
              Issues
            </a>
            <a href={WIKI_URL} className="transition-colors hover:text-white">
              Wiki
            </a>
            <a href={RELEASE_URL} className="transition-colors hover:text-white">
              Download
            </a>
          </div>
          <div className="text-xs text-zinc-600">© 2026 Moxzk</div>
        </div>
      </footer>
    </div>
  );
}
