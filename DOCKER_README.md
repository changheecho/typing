# 🐳 도커 환경에서 타이핑 마스터 실행하기

타이핑 마스터를 도커 환경에서 실행하는 방법을 안내합니다.

## 🚀 빠른 시작

### 1. 기본 실행 (단일 컨테이너)

```bash
# 도커 이미지 빌드
docker build -t typing-master .

# 컨테이너 실행
docker run -d \
  --name typing-master-app \
  -p 5000:5000 \
  -v typing_data:/app/data \
  typing-master
```

브라우저에서 `http://localhost:5000` 접속

### 2. Docker Compose 사용 (권장)

```bash
# 기본 실행
docker-compose up -d

# 빌드와 함께 실행
docker-compose up -d --build
```

## 📋 실행 옵션

### 기본 실행 (SQLite)
```bash
docker-compose up -d
```

### Nginx 프록시와 함께 실행
```bash
docker-compose --profile production up -d
```

### PostgreSQL 데이터베이스 사용
```bash
docker-compose --profile postgres up -d
```

### Redis 캐시 포함 전체 구성
```bash
docker-compose --profile production --profile postgres --profile cache up -d
```

## 🔧 환경 설정

### 환경 변수 파일 생성

1. **환경 변수 파일 복사**
   ```bash
   cp env_example.txt .env
   ```

2. **설정 수정** (`.env` 파일 편집)
   ```bash
   # 필수 설정
   SECRET_KEY=your-super-secret-production-key
   
   # 선택적 설정
   FLASK_ENV=production
   DATABASE_URL=sqlite:///instance/typing_practice.db
   ```

### 주요 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `SECRET_KEY` | Flask 보안 키 | `your-secret-key-here` |
| `FLASK_ENV` | Flask 환경 | `production` |
| `DATABASE_URL` | 데이터베이스 URL | `sqlite:///data/typing_practice.db` |
| `HOST` | 바인딩 호스트 | `0.0.0.0` |
| `PORT` | 포트 번호 | `5000` |

## 🗄️ 데이터베이스 옵션

### SQLite (기본)
```yaml
environment:
  - DATABASE_URL=sqlite:///data/typing_practice.db
```

### PostgreSQL
```yaml
environment:
  - DATABASE_URL=postgresql://typing_user:typing_password@postgres:5432/typing_practice
```

## 🌐 네트워크 구성

### 포트 매핑

| 서비스 | 내부 포트 | 외부 포트 | 설명 |
|--------|-----------|-----------|------|
| Flask App | 5000 | 5000 | 메인 애플리케이션 |
| Nginx | 80 | 80 | HTTP 프록시 |
| Nginx | 443 | 443 | HTTPS 프록시 |
| PostgreSQL | 5432 | - | 데이터베이스 (내부만) |
| Redis | 6379 | - | 캐시 (내부만) |

## 📊 모니터링 및 로그

### 컨테이너 상태 확인
```bash
# 실행 중인 컨테이너 확인
docker-compose ps

# 로그 확인
docker-compose logs -f typing-app

# 특정 서비스 로그
docker-compose logs -f nginx
```

### 헬스체크
```bash
# 애플리케이션 헬스체크
curl http://localhost:5000/

# 컨테이너 헬스 상태 확인
docker inspect --format='{{.State.Health.Status}}' typing-master-app
```

## 🔒 보안 설정

### SSL 인증서 설정 (HTTPS)

1. **인증서 디렉토리 생성**
   ```bash
   mkdir ssl
   ```

2. **인증서 파일 배치**
   ```
   ssl/
   ├── cert.pem
   └── key.pem
   ```

3. **HTTPS로 실행**
   ```bash
   docker-compose --profile production up -d
   ```

### 방화벽 설정 (선택사항)
```bash
# UFW 사용 시
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000  # 개발환경만
```

## 🔄 업데이트 및 백업

### 애플리케이션 업데이트
```bash
# 이미지 재빌드
docker-compose build --no-cache

# 서비스 재시작
docker-compose up -d --force-recreate
```

### 데이터 백업
```bash
# SQLite 백업
docker cp typing-master-app:/app/data/typing_practice.db ./backup.db

# PostgreSQL 백업
docker-compose exec postgres pg_dump -U typing_user typing_practice > backup.sql
```

### 데이터 복원
```bash
# SQLite 복원
docker cp ./backup.db typing-master-app:/app/data/typing_practice.db

# PostgreSQL 복원
docker-compose exec -T postgres psql -U typing_user typing_practice < backup.sql
```

## 🛠️ 개발 환경

### 개발용 실행
```bash
# 개발 모드로 실행
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 또는 환경 변수 설정
FLASK_ENV=development FLASK_DEBUG=true docker-compose up -d
```

### 코드 변경 시 자동 재로드
```yaml
# docker-compose.dev.yml
services:
  typing-app:
    volumes:
      - .:/app
    environment:
      - FLASK_ENV=development
      - FLASK_DEBUG=true
```

## 🔍 문제 해결

### 일반적인 문제들

1. **포트 충돌**
   ```bash
   # 다른 포트 사용
   docker-compose up -d
   # 또는 docker-compose.yml의 ports 수정
   ```

2. **권한 문제**
   ```bash
   # 볼륨 권한 확인
   docker-compose exec typing-app ls -la /app/data/
   ```

3. **데이터베이스 초기화**
   ```bash
   # 데이터베이스 볼륨 삭제 후 재생성
   docker-compose down -v
   docker-compose up -d
   ```

4. **이미지 캐시 문제**
   ```bash
   # 캐시 없이 다시 빌드
   docker-compose build --no-cache
   ```

### 로그 확인
```bash
# 전체 서비스 로그
docker-compose logs

# 특정 서비스 로그 (실시간)
docker-compose logs -f typing-app

# 에러 로그만 확인
docker-compose logs typing-app 2>&1 | grep -i error
```

## ⚡ 성능 최적화

### 프로덕션 최적화 설정
```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

### Nginx 캐시 설정
- 정적 파일 1년 캐시
- Gzip 압축 활성화
- HTTP/2 지원

## 📈 확장성

### 수평 확장 (여러 인스턴스)
```bash
# 애플리케이션 인스턴스 3개로 확장
docker-compose up -d --scale typing-app=3
```

### 로드 밸런서 설정
Nginx가 자동으로 여러 인스턴스 간 로드 밸런싱을 수행합니다.

---

## 🎯 추천 구성

### 개발 환경
```bash
docker-compose up -d
```

### 스테이징 환경
```bash
docker-compose --profile production up -d
```

### 프로덕션 환경
```bash
docker-compose --profile production --profile postgres --profile cache up -d
```

이제 도커 환경에서 타이핑 마스터를 안전하고 효율적으로 실행할 수 있습니다! 🎉
