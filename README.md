# 프로젝트 이름

이 프로젝트는 Flask와 React를 사용하여 AI 기반 Q&A 서비스를 제공합니다.

---

## Backend

### 의존성 설치 및 실행

```bash
cd backend
# Linux/macOS
python3 -m venv venv && source venv/bin/activate
# Windows
python3 -m venv venv && venv\Scripts\activate

pip install -r requirements.txt
python3 prepare_embeddings.py
python3 app.py
```
---

## Frontend

### 의존성 설치 및 실행

```bash
cd frontend
pnpm install
pnpm dev
```
---

## 추가 정보

- 백엔드 기본 URL: http://127.0.0.1:5000
- 프론트엔드 기본 URL: http://localhost:5173
