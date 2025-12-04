# ml_service/app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import numpy as np
import json
from pathlib import Path

app = FastAPI(title="VN House Price Predictor")

# CORS cho dev (ví dụ FE chạy ở 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Load model & danh sách cột ===
MODEL_PATH = Path("house_price_vn_rf.joblib")
FEATURES_PATH = Path("feature_columns.json")

model = joblib.load(MODEL_PATH)

with open(FEATURES_PATH, "r", encoding="utf-8") as f:
    feature_columns = json.load(f)

# feature_columns là dict dạng { "City_Code": "City_Code", ... }
# Lấy thứ tự cột đúng như lúc train
FEATURE_ORDER = list(feature_columns.keys())


# === Pydantic models ===
class HouseFeatures(BaseModel):
    # Tên field trong code là python-friendly,
    # alias là tên đúng trong DataFrame / feature_columns.json

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
        # Cho phép truyền dữ liệu bằng alias (tên cột gốc) hoặc tên field
        populate_by_name = True
        allow_population_by_field_name = True


class PredictIn(BaseModel):
    features: HouseFeatures


class PredictOut(BaseModel):
    predicted_price: float


# === Endpoint trả schema cho FE ===
@app.get("/schema")
def get_schema():
    """
    Trả về danh sách feature theo đúng thứ tự model đang dùng.
    FE có thể dựa vào đây để build form nhập.
    """
    return {
        "features": FEATURE_ORDER
    }


# === Endpoint predict ===
@app.post("/predict", response_model=PredictOut)
def predict(req: PredictIn):
    # Lấy dict với key là alias (tên cột gốc)
    feat_dict = req.features.model_dump(by_alias=True)

    # Sắp xếp đúng thứ tự feature mà model đã train
    ordered_values = [feat_dict[col] for col in FEATURE_ORDER]

    # Convert thành 2D array cho model.predict
    X = np.array([ordered_values], dtype=float)

    y_pred = model.predict(X)[0]

    return {"predicted_price": float(y_pred)}
