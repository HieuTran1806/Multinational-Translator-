# Giới thiệu
Ứng dụng web/mobile giúp **khách du lịch** khám phá địa điểm và **nghe thuyết minh tự động** theo vị trí GPS, hỗ trợ **đa ngôn ngữ**, hoạt động cả **online và offline**. Hệ thống có trang **admin** để quản lý địa điểm và nội dung thuyết minh.

# Thành viên nhóm 
3124560031 - Trần Viết Hiếu
- 
- 

### 🎯 Mục tiêu
- Tự động phát thuyết minh khi khách đến gần địa điểm (geofencing)
- Hỗ trợ nhiều ngôn ngữ qua Google Cloud TTS
- Hoạt động offline với audio cache sẵn
- CI/CD tự động hóa build & deploy

---

# Tính năng chính

--
--

# Demo

### Màn hình chính

### Nghe thuyết minh

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Mobile** | React Native (Expo) + TypeScript |
| **Web Admin** | ReactJS + Vite + TailwindCSS |
| **Backend** | Java 17 + Spring Boot |
| **Database** | PostgreSQL |
| **Bản đồ** | Google Maps SDK / react-native-maps |
| **TTS** | Google Cloud TTS + react-native-tts (offline) |
| **CI/CD** | GitHub Actions |
| **Deploy** | Vercel (web) + Render/VPS (BE) |

---

## 🏗️ Kiến trúc hệ thống
┌──────────────┐ HTTPS ┌──────────────┐ JDBC ┌──────────┐
│ Mobile App │────────────►│ Backend API │─────────►│PostgreSQL│
│(React Native)│◄────────────│(Spring Boot) │◄─────────│ │
└──────────────┘ └──────┬───────┘ └──────────┘
┌──────────────┐ │
│ Web Admin │────────────────────┘
│ (ReactJS) │ ┌──────────────┐
└──────────────┘ │ Google Cloud │
│ TTS + Maps │
└──────────────┘

## Cấu trúc thư mục
.
├── mobile/ # React Native app
│ ├── src/
│ │ ├── screens/
│ │ ├── components/
│ │ ├── services/ # gọi API
│ │ └── utils/
│ └── package.json
├── web-admin/ # ReactJS admin
│ └── src/
├── backend/ # Spring Boot
│ ├── src/main/java/
│ └── pom.xml
├── docs/ # Tài liệu, diagram, screenshot
│ ├── diagrams/
│ ├── screenshots/
│ └── architecture.md
├── .github/workflows/ # CI/CD
│ ├── ci-backend.yml
│ ├── ci-mobile.yml
│ └── deploy-web.yml
└── README.md
