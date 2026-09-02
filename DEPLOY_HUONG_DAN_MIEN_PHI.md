# HƯỚNG DẪN XUẤT BẢN & CHIA SẺ ỨNG DỤNG HOÀN TOÀN MIỄN PHÍ (100% FREE)

Ứng dụng **AI Social Content Generator - Order Siêu Nhàn** đã được đóng gói và cấu hình đầy đủ để bạn có thể xuất bản lên internet và chia sẻ cho cả team sử dụng trên máy tính & điện thoại di động (4G/5G/Wifi) mà **không mất bất kỳ chi phí nào** và **100% không bị nhà mạng Việt Nam chặn**.

---

## ⚠️ LƯU Ý QUAN TRỌNG VỀ SURGE.SH
* **Khuyến cáo:** Tránh dùng tên miền `*.surge.sh` làm kênh truy cập chính tại Việt Nam. Toàn bộ dải `*.surge.sh` đã bị các nhà mạng viễn thông (Viettel, VinaPhone, MobiFone, FPT, VNPT) áp dụng chặn DNS (NXDOMAIN) và lọc SNI (TCP Reset) do Surge bị lợi dụng cho các trang web lừa đảo/cờ bạc quốc tế.
* Dự án đã tự động cấu hình tệp `dist/200.html` để Surge hỗ trợ SPA routing, nhưng giải pháp tối ưu bền vững nhất là sử dụng **Cloudflare Pages** hoặc **Vercel** bên dưới.

---

## 🥇 CÁCH 1: Xuất Bản Lên Cloudflare Pages (KHUYÊN DÙNG SỐ 1 - BĂNG THÔNG VÔ HẠN)
> **Ưu điểm vượt trội:** Băng thông **KHÔNG GIỚI HẠN**, máy chủ CDN Anycast đặt trực tiếp tại **Hà Nội & TP. Hồ Chí Minh** qua trạm trung chuyển Internet quốc gia VNIX, tốc độ tải trang 10ms - 25ms, không bao giờ bị nghẽn mạng hay đứt cáp biển!

1. Đăng nhập [dash.cloudflare.com](https://dash.cloudflare.com) bằng tài khoản Gmail của bạn (hoàn toàn miễn phí).
2. Chọn **Workers & Pages** ở cột trái -> Bấm **Create application** -> Chọn tab **Pages** -> Bấm **Connect to Git**.
3. Chọn tài khoản GitHub của bạn và chọn kho: `9BaoTran1/AI-Social-Content-Generator`.
4. Cấu hình bản dựng:
   * **Framework preset:** Chọn `Vite`.
   * **Build command:** `npm run build`
   * **Build output directory:** `dist`
5. Bấm **Save and Deploy**. Sau 45 giây, bạn nhận ngay đường link chính thức siêu tốc:
   👉 `https://ai-social-content-generator.pages.dev`

---

## 🥈 CÁCH 2: Xuất Bản Lên Vercel (1-Click Deploy - 30 Giây Là Xong)
> **Ưu điểm:** Cực kỳ nhanh chóng, giao diện hiện đại, tự động nhận diện cấu hình `vercel.json`, băng thông 100GB/tháng miễn phí trọn đời.

1. Nhấp trực tiếp vào đường link 1-Click Deploy:  
   👉 **[Deploy ngay lên Vercel với 1 cú nhấp chuột](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2F9BaoTran1%2FAI-Social-Content-Generator)**
2. Đăng nhập Vercel bằng tài khoản GitHub.
3. Bấm **Deploy**. Sau 30 giây bạn sẽ có ngay đường link:
   👉 `https://ai-social-content-generator.vercel.app`

---

## 🥉 CÁCH 3: Xuất Bản Lên Render.com
Render cung cấp 2 chế độ miễn phí:
* **Chế độ A - Static Site (Khuyên dùng cho Frontend):**
  1. Đăng nhập [Render.com](https://render.com) -> Bấm **New +** -> Chọn **Static Site**.
  2. Kết nối repo `9BaoTran1/AI-Social-Content-Generator`.
  3. Điền Build Command: `npm run build`, Publish Directory: `dist`.
  4. Bấm **Create Static Site** -> Website chạy 24/7 không bao giờ ngủ.
* **Chế độ B - Web Service (Nếu muốn chạy Node.js server backend `server.ts`):**
  1. Chọn **New +** -> **Web Service** -> Chọn repo GitHub.
  2. Điền biến môi trường `GEMINI_API_KEY`.
  3. Lưu ý: Chế độ Web Service miễn phí sẽ ngủ sau 15 phút không có người dùng, lần truy cập đầu tiên sẽ mất 30-50s để khởi động (cold start).

---

## 🌟 CÁCH 4: Dùng Ngay Đường Link Trực Tiếp Có Sẵn (Google AI Studio)
👉 **Link truy cập:** [https://ais-pre-uknv4krjpmjdfpeyonciya-338735247285.asia-southeast1.run.app](https://ais-pre-uknv4krjpmjdfpeyonciya-338735247285.asia-southeast1.run.app)
* Bấm nút **"Share"** (Chia sẻ) ở góc phải màn hình AI Studio -> Bật chế độ công khai để gửi cho đồng đội.

---

## 🛠️ CÁC TÍNH NĂNG NÂNG CẤP ĐÃ ĐƯỢC TÍCH HỢP SẴN:
1. **Tự Động Tạo `200.html`**: Hỗ trợ SPA routing hoàn hảo trên tất cả các dịch vụ static hosting.
2. **Multi-Key Pool Engine**: Tự động xoay vòng danh sách Gemini API Key, nhảy key thông minh khi chạm hạn ngạch 429 mà không bị gián đoạn.
3. **Smart Cache 0.1s**: Tự động lưu cache kết quả tạo content, tiết kiệm 100% quota AI cho các yêu cầu trùng lặp.
4. **Hệ thống Gemini 3.6 & 3.7 Flash**: Tốc độ xử lý siêu tốc, chất lượng nội dung sắc sảo, tự nhiên 100% không văn mẫu chatbot.
