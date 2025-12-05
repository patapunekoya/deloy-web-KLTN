import joblib
import os
import requests
import numpy as np
import json
import gc  # <--- 1. THÊM THƯ VIỆN NÀY
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="VN House Price Predictor")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === CẤU HÌNH MODEL & DOWNLOAD TỰ ĐỘNG ===
MODEL_PATH = "house_price_vn_rf.joblib"

# <--- 2. CẬP NHẬT LINK (Thêm ?download=true)
MODEL_URL = "https://huggingface.co/nekoyae2/house_sale_deloy/resolve/main/house_price_vn_rf.joblib?download=true"

def load_model_safely():
    # Nếu file chưa tồn tại thì tải về
    if not os.path.exists(MODEL_PATH):
        print(f"Model not found at {MODEL_PATH}. Downloading from Hugging Face...")
        try:
            response = requests.get(MODEL_URL, stream=True) # Thêm stream=True cho file lớn
            response.raise_for_status()
            with open(MODEL_PATH, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print("Download complete!")
        except Exception as e:
            print(f"Failed to download model: {e}")
            # Xóa file lỗi nếu tải dở dang
            if os.path.exists(MODEL_PATH):
                os.remove(MODEL_PATH)
            raise e
    
    print("Loading model...")
    loaded_model = joblib.load(MODEL_PATH)
    
    # <--- 3. QUAN TRỌNG: Dọn dẹp RAM ngay sau khi load xong
    gc.collect()
    print("Model loaded & Memory cleaned.")
    return loaded_model

# Load model khi khởi động app
model = load_model_safely()

# === Load danh sách cột ===
FEATURES_PATH = Path("feature_columns.json")
with open(FEATURES_PATH, "r", encoding="utf-8") as f:
    feature_columns = json.load(f)

# Lấy thứ tự cột đúng như lúc train
FEATURE_ORDER = list(feature_columns.keys())

# === Pydantic models ===
class HouseFeatures(BaseModel):
    city_code: float = Field(..., alias="City_Code")
    district_code: float = Field(..., alias="District_Code")
    ward_code: float = Field(..., alias="Ward_Code")

    area: float = Field(..., alias="Area")
    frontage: float = Field(..., alias="Frontage")
    access_road: float = Field(..., alias="Access Road")

    house_direction: float = Field(..., alias="House direction")
    balcony_direction: float = Field(..., alias="Balcony direction")

    floors: float = Field(..., alias="Floors")
    bedrooms: float = Field(..., alias="Bedrooms")
    bathrooms: float = Field(..., alias="Bathrooms")

    legal_status: float = Field(..., alias="Legal status")
    furniture_state: float = Field(..., alias="Furniture state")

    class Config:
        populate_by_name = True
        # Pydantic V2 dùng 'populate_by_name', V1 dùng 'allow_population_by_field_name'
        # Để tương thích cả 2, giữ cả 2 dòng này là ổn
        allow_population_by_field_name = True

class PredictIn(BaseModel):
    features: HouseFeatures

class PredictOut(BaseModel):
    predicted_price: float

# === Endpoint trả schema cho FE ===
@app.get("/schema")
def get_schema():
    return {
        "features": FEATURE_ORDER
    }

# === Endpoint predict ===
@app.post("/predict", response_model=PredictOut)
def predict(req: PredictIn):
    # Lấy dict với key là alias (tên cột gốc)
    try:
        # Pydantic V2
        feat_dict = req.features.model_dump(by_alias=True)
    except AttributeError:
        # Fallback cho Pydantic V1 (nếu server cài bản cũ)
        feat_dict = req.features.dict(by_alias=True)

    # Sắp xếp đúng thứ tự feature mà model đã train
    ordered_values = [feat_dict[col] for col in FEATURE_ORDER]

    # Convert thành 2D array cho model.predict
    X = np.array([ordered_values], dtype=float)

    y_pred = model.predict(X)[0]

    return {"predicted_price": float(y_pred)}