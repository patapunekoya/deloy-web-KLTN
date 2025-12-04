# 1. Dùng Image gốc là Node.js (để chạy Backend + Build Frontend)
FROM node:18-bullseye

# 2. Cài đặt thêm Python và PIP (để chạy ML Service)
RUN apt-get update && apt-get install -y python3 python3-pip

# 3. Thiết lập thư mục làm việc
WORKDIR /app

# --- PHẦN FRONTEND ---
# Copy và cài đặt dependencies Frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy code frontend và Build ra thư mục dist
COPY frontend ./frontend
RUN cd frontend && npm run build

# --- PHẦN ML SERVICE (AI) ---
# Copy requirements và cài đặt thư viện Python
COPY ml_service/requirements.txt ./ml_service/
RUN pip3 install -r ml_service/requirements.txt

# Copy code Python
COPY ml_service ./ml_service

# --- PHẦN BACKEND ---
# Copy và cài đặt dependencies Backend
COPY package*.json ./
RUN npm install

# Copy code Backend
COPY api ./api
COPY .env ./

# --- KHỞI CHẠY ---
# Mở cổng 3000 cho web
EXPOSE 3000

# Tạo script để chạy song song cả Python (8001) và Node (3000)
# Python chạy background (&), Node chạy chính
CMD python3 ml_service/app.py & node api/index.js