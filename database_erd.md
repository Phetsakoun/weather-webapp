# Database ERD - Weather Web Application

นี่คือ Entity Relationship Diagram (ERD) ของฐานข้อมูลสำหรับ Weather Web Application

```mermaid
erDiagram
    PROVINCES {
        int id PK
        varchar name_th
        varchar name_en
        timestamp created_at
    }

    CITIES {
        int id PK
        varchar name_th
        varchar name_en
        int province_id FK
        float lat
        float lon
        varchar region
        timestamp created_at
    }

    VILLAGES {
        int id PK
        varchar name
        float latitude
        float longitude
        varchar stationCode UK
        enum status
        enum region
        int cityId FK
    }

    USERS {
        int id PK
        varchar username UK
        varchar email UK
        varchar password
        varchar role
        enum status
        timestamp created_at
    }

    WEATHER {
        int id PK
        int city_id FK
        datetime timestamp
        float temperature
        float humidity
        float wind_speed
        float pressure
        float rainfall
        varchar description
        timestamp created_at
    }

    WEATHER_FORECAST {
        int id PK
        int city_id FK
        datetime timestamp
        float temperature
        float humidity
        float predicted_temperature
        float predicted_humidity
        float predicted_rainfall
        varchar description
        timestamp created_at
    }

    NEWS {
        int id PK
        varchar title
        text description
        int created_by FK
        enum status
        boolean is_admin_content
        varchar youtube_url
        varchar image_url
        boolean is_highlight
        timestamp created_at
    }

    YOUTUBE_VIDEOS {
        int id PK
        varchar title
        text description
        int created_by FK
        enum status
        boolean is_admin_content
        varchar youtube_url
        varchar thumbnail_url
        boolean is_featured
        timestamp created_at
    }

    LOGS {
        int id PK
        varchar action
        int user_id FK
        timestamp created_at
    }

    WEATHER_ALERTS {
        int id PK
        int city_id FK
        varchar alert_type
        varchar severity_level
        varchar title
        text description
        datetime start_time
        datetime end_time
        boolean is_active
        int created_by FK
        timestamp created_at
    }

    PROVINCES ||--o{ CITIES : has
    CITIES ||--o{ VILLAGES : contains
    CITIES ||--o{ WEATHER : records
    CITIES ||--o{ WEATHER_FORECAST : forecasts
    CITIES ||--o{ WEATHER_ALERTS : issues
    USERS ||--o{ NEWS : creates
    USERS ||--o{ YOUTUBE_VIDEOS : uploads
    USERS ||--o{ WEATHER_ALERTS : creates
    USERS ||--o{ LOGS : generates
```

## คำอธิบายความสัมพันธ์

### ความสัมพันธ์หลัก:
1. **PROVINCES → CITIES** (1:N): จังหวัดหนึ่งมีหลายเมือง
2. **CITIES → VILLAGES** (1:N): เมืองหนึ่งมีหลายหมู่บ้าน/ชุมชน
3. **CITIES → WEATHER** (1:N): เมืองหนึ่งมีข้อมูลสภาพอากาศหลายรายการ
4. **CITIES → WEATHER_FORECAST** (1:N): เมืองหนึ่งมีการพยากรณ์อากาศหลายรายการ
5. **CITIES → WEATHER_ALERTS** (1:N): เมืองหนึ่งมีการแจ้งเตือนสภาพอากาศหลายรายการ
6. **USERS → NEWS** (1:N): ผู้ใช้หนึ่งคนสร้างข่าวได้หลายข่าว
7. **USERS → YOUTUBE_VIDEOS** (1:N): ผู้ใช้หนึ่งคนสร้างวิดีโอได้หลายวิดีโอ
8. **USERS → WEATHER_ALERTS** (1:N): ผู้ใช้หนึ่งคนสร้างการแจ้งเตือนได้หลายรายการ
9. **USERS → LOGS** (1:N): ผู้ใช้หนึ่งคนมีการบันทึกการกระทำหลายรายการ
8. **CITIES → WEATHER_ALERTS** (1:N): เมืองหนึ่งมีการแจ้งเตือนสภาพอากาศหลายรายการ
9. **USERS → WEATHER_ALERTS** (1:N): ผู้ใช้หนึ่งคนสร้างการแจ้งเตือนสภาพอากาศได้หลายรายการ

### ตารางหลัก:
- **PROVINCES**: เก็บข้อมูลจังหวัดในประเทศลาว
- **CITIES**: เก็บข้อมูลเมือง/อำเภอ พร้อมพิกัดทางภูมิศาสตร์
- **VILLAGES**: เก็บข้อมูลหมู่บ้าน/ชุมชน และสถานีวัดอากาศ
- **WEATHER**: เก็บข้อมูลสภาพอากาศปัจจุบัน
- **WEATHER_FORECAST**: เก็บข้อมูลพยากรณ์อากาศจาก ML Model
- **WEATHER_ALERTS**: เก็บข้อมูลการแจ้งเตือนสภาพอากาศอันตราย (พายุ, น้ำท่วม, ฝนตกหนัก)
- **NEWS**: เก็บข้อมูลข่าวสาร
- **YOUTUBE_VIDEOS**: เก็บข้อมูลวิดีโอ YouTube
- **USERS**: เก็บข้อมูลผู้ใช้และผู้ดูแลระบบ
- **LOGS**: เก็บประวัติการใช้งานระบบ
- **WEATHER_ALERTS**: เก็บข้อมูลการแจ้งเตือนสภาพอากาศ
