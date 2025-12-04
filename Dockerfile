# --- GIAI ĐOẠN 1: Môi trường gốc ---
FROM node:18-bullseye

# 1. Cài đặt Python (để chạy AI)
RUN apt-get update && apt-get install -y python3 python3-pip

# 2. Thiết lập thư mục làm việc
WORKDIR /app

# --- GIAI ĐOẠN 2: Cài đặt AI Service ---
COPY ml_service/requirements.txt ./ml_service/
# (Lưu ý: file requirements.txt phải có dòng 'requests')
RUN pip3 install -r ml_service/requirements.txt
COPY ml_service ./ml_service

# --- GIAI ĐOẠN 3: Cài đặt và Build Frontend ---
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy code frontend
COPY frontend ./frontend

# --- 🔥 QUAN TRỌNG: KHAI BÁO BIẾN ĐỂ BUILD FRONTEND ---
# Những dòng này giúp Vite nhận được giá trị từ Render Dashboard
ARG VITE_FIREBASE_API_KEY
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_CLOUDINARY_UPLOAD_PRESET
ARG VITE_SOCKET_ORIGIN
ARG VITE_API_BASE

# Gán giá trị ARG vào ENV để npm run build nhìn thấy
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME
ENV VITE_CLOUDINARY_UPLOAD_PRESET=$VITE_CLOUDINARY_UPLOAD_PRESET
ENV VITE_SOCKET_ORIGIN=$VITE_SOCKET_ORIGIN
# API Base để trống để dùng relative path
ENV VITE_API_BASE="" 

# Build React
RUN cd frontend && npm run build

# --- GIAI ĐOẠN 4: Cài đặt Backend ---
COPY package*.json ./
RUN npm install

# Copy code Backend
COPY api ./api

# --- GIAI ĐOẠN 5: Khởi chạy ---
EXPOSE 3000

# Chạy song song Python và Node
CMD python3 ml_service/app.py & node api/index.js