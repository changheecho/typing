# 타이핑 마스터 (Typing Master)

영어 타이핑을 체계적으로 연습할 수 있는 웹 기반 타이핑 연습 서비스입니다.

## 🚀 주요 기능

### ✨ 핵심 기능
- **단계별 커리큘럼**: 기초부터 고급까지 5단계 체계적 학습
- **실시간 키보드 가이드**: 시각적 키보드 애니메이션과 손가락 위치 안내
- **계정 관리**: 다중 사용자 지원 및 개인별 진행상황 관리
- **상세한 통계**: WPM, 정확도, 진행률 등 실시간 통계 제공
- **반응형 디자인**: 모바일부터 데스크톱까지 모든 기기 지원

### 📚 학습 단계
1. **레벨 1**: 홈로우 키 연습 (ASDF JKL;)
2. **레벨 2**: 기본 영어 단어 연습
3. **레벨 3**: 문장 및 구문 연습
4. **레벨 4**: 숫자 및 특수문자 연습
5. **레벨 5**: 코딩 텍스트 및 고급 연습

### 🎯 타이핑 지원 기능
- 실시간 WPM (Words Per Minute) 측정
- 정확도 계산 및 오타 표시
- 키보드 애니메이션을 통한 올바른 손가락 위치 안내
- 개인별 최고 기록 저장
- 레슨별 통과 기준 설정

## 🛠 기술 스택

### 백엔드
- **Python 3.11** - 메인 프로그래밍 언어
- **Flask 2.3** - 웹 프레임워크
- **SQLAlchemy** - ORM 및 데이터베이스 관리
- **Flask-Login** - 사용자 인증 및 세션 관리
- **Gunicorn** - WSGI 서버

### 프론트엔드
- **HTML5/CSS3** - 마크업 및 스타일링
- **JavaScript (ES6+)** - 클라이언트 사이드 로직
- **Bootstrap 5** - UI 프레임워크
- **Font Awesome** - 아이콘
- **Google Fonts** - 타이포그래피

### 데이터베이스
- **SQLite** - 기본 데이터베이스 (개발/소규모)
- **PostgreSQL** - 프로덕션 지원 (선택사항)

### 배포 및 인프라
- **Docker** - 컨테이너화
- **Docker Compose** - 멀티 컨테이너 오케스트레이션
- **Nginx** - 리버스 프록시 및 정적 파일 서빙

## 🚀 설치 및 실행

### 필수 요구사항
- Docker & Docker Compose
- Python 3.11+ (로컬 개발 시)

### Docker를 사용한 실행 (권장)

1. **저장소 클론**
```bash
git clone <repository-url>
cd typing
```

2. **환경 설정**
```bash
# 환경 변수 파일 생성
cp env_example.txt .env
# .env 파일을 편집하여 필요한 설정 수정
```

3. **Docker Compose로 실행**
```bash
# 전체 스택 실행 (웹앱 + Nginx)
docker-compose up -d

# 웹앱만 실행
docker-compose up web -d
```

4. **브라우저에서 접속**
```
http://localhost        # Nginx 사용 시
http://localhost:5000   # 직접 Flask 앱 접속 시
```

### 로컬 개발 환경 실행

1. **Python 가상환경 생성**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
```

2. **의존성 설치**
```bash
pip install -r requirements.txt
```

3. **환경 변수 설정**
```bash
export FLASK_APP=app.py
export FLASK_ENV=development
```

4. **데이터베이스 초기화 및 실행**
```bash
python app.py
```

## 📊 데이터베이스 스키마

### 주요 테이블
- **User**: 사용자 정보 및 계정 관리
- **Lesson**: 레슨 콘텐츠 및 설정
- **UserProgress**: 사용자별 레슨 진행상황
- **TypingStats**: 타이핑 연습 통계 및 기록

## 🎮 사용법

### 회원가입 및 로그인
1. 홈페이지에서 "회원가입" 버튼 클릭
2. 사용자명, 이메일, 비밀번호 입력
3. 로그인 후 대시보드에서 학습 시작

### 타이핑 연습
1. 대시보드에서 현재 레벨의 레슨 선택
2. "시작하기" 버튼 클릭 또는 아무 키나 입력하여 시작
3. 화면의 텍스트를 정확히 따라 입력
4. 실시간으로 WPM, 정확도 확인
5. 목표 기준 달성 시 다음 레벨 해제

### 키보드 가이드 활용
- 화면 하단의 가상 키보드에서 다음에 입력할 키 확인
- 손가락 위치 가이드를 참고하여 올바른 타이핑 자세 학습
- 홈로우 위치를 기준으로 한 체계적인 손가락 배치 연습

## 🔧 커스터마이징

### 레슨 추가/수정
`app.py`의 `init_lessons()` 함수에서 레슨 데이터를 수정할 수 있습니다.

### 통과 기준 조정
각 레슨의 `min_wpm`과 `min_accuracy` 값을 조정하여 난이도를 변경할 수 있습니다.

### UI 테마 변경
`static/css/style.css`에서 색상, 폰트, 레이아웃을 커스터마이징할 수 있습니다.

## 🌐 배포

### Docker 기반 프로덕션 배포

1. **환경 변수 설정**
```bash
# .env 파일에서 프로덕션 설정
SECRET_KEY=your-production-secret-key
FLASK_ENV=production
```

2. **SSL 인증서 설정** (HTTPS 사용 시)
```bash
mkdir ssl
# SSL 인증서 파일을 ssl/ 디렉토리에 배치
```

3. **프로덕션 실행**
```bash
docker-compose -f docker-compose.yml up -d
```

### 클라우드 배포
- AWS ECS, Google Cloud Run, Azure Container Instances 등에서 실행 가능
- Kubernetes 클러스터에서의 배포도 지원

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🙏 감사의 말

- Bootstrap 팀 - 훌륭한 UI 프레임워크 제공
- Font Awesome - 아이콘 라이브러리
- Google Fonts - 웹 폰트 서비스
- Flask 커뮤니티 - 강력한 웹 프레임워크

## 📞 지원 및 문의

문제가 발생하거나 제안사항이 있으시면 Issue를 생성해 주세요.

---

**타이핑 마스터**로 체계적이고 재미있는 타이핑 연습을 시작하세요! 🚀
