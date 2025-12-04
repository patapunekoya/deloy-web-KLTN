# --- GIAI ĐOẠN 1: Build môi trường ---
FROM node:18-bullseye

# 1. Cài đặt Python và PIP (để chạy AI)
RUN apt-get update && apt-get install -y python3 python3-pip

# 2. Thiết lập thư mục làm việc
WORKDIR /app

# --- GIAI ĐOẠN 2: Cài đặt và Build AI Service ---
COPY ml_service/requirements.txt ./ml_service/
RUN pip3 install -r ml_service/requirements.txt
COPY ml_service ./ml_service

# --- GIAI ĐOẠN 3: Cài đặt và Build Frontend ---
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy mã nguồn Frontend
COPY frontend ./frontend

# Đặt biến môi trường ảo để Build (Sẽ bị ghi đè bởi Render, nhưng cần có để không lỗi)
ENV VITE_API_BASE=""
ENV VITE_SOCKET_ORIGIN=""

# Build React ra folder dist
RUN cd frontend && npm run build

# --- GIAI ĐOẠN 4: Cài đặt Backend ---
COPY package*.json ./
RUN npm install

# Copy mã nguồn Backend
COPY api ./api
# KHÔNG COPY FILE .ENV (Render sẽ lo việc này)

# --- GIAI ĐOẠN 5: Khởi chạy ---
# Mở cổng 3000 (Cổng chính của web)
EXPOSE 3000

# Lệnh chạy song song: Python (8001) chạy ngầm & Node (3000) chạy chính
CMD python3 ml_service/app.py & node api/index.js