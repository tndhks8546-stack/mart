# 필마트 - 동네 식자재 마트 온라인 주문 시스템

## 프로젝트 소개
동네 식자재 마트의 온라인 주문 시스템입니다.
고객이 모바일/웹으로 편리하게 주문하고 배달 또는 픽업으로 받을 수 있습니다.

## 주요 기능

### 고객용
- 상품 목록 및 검색 (카테고리별)
- 장바구니 기능
- 주문하기 (배달/픽업 선택)
- 주문 내역 조회
- 회원가입/로그인 (비회원 주문도 가능)

### 관리자용 (/admin.html)
- 대시보드 (오늘 주문, 매출 통계)
- 주문 관리 (상태 변경, 메모)
- 상품 관리 (등록/수정/품절처리)
- 신규 주문 알림

## 기술 스택
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **스타일**: 모바일 우선 반응형

## 설치 및 실행

### 1. 패키지 설치
```bash
npm install
```

### 2. 데이터베이스 초기화
```bash
npm run init-db
```

### 3. 서버 실행
```bash
npm start
```
또는 개발 모드:
```bash
npm run dev
```

### 4. 접속
- 고객 페이지: http://localhost:3000
- 관리자 페이지: http://localhost:3000/admin.html

## 관리자 로그인
- 아이디: `admin`
- 비밀번호: `pilmart2024`

## 프로젝트 구조
```
필마트/
├── server.js           # Express 서버 (API)
├── pilmart.db          # SQLite 데이터베이스
├── package.json        # 프로젝트 설정
├── scripts/
│   └── init-db.js      # DB 초기화 스크립트
└── public/
    ├── index.html      # 고객용 메인 페이지
    ├── admin.html      # 관리자 페이지
    ├── css/
    │   ├── style.css   # 고객용 스타일
    │   └── admin.css   # 관리자 스타일
    ├── js/
    │   ├── app.js      # 고객용 JavaScript
    │   └── admin.js    # 관리자 JavaScript
    └── images/         # 상품 이미지 저장
```

## 운영 조건
- 배달 지역: 마트 반경 2km 이내
- 영업 시간: 오전 9시 ~ 오후 9시
- 최소 주문금액: 10,000원
- 배달비: 3,000원 (30,000원 이상 무료)

## 결제 방법
- 만나서 결제 (현금/카드)
- 온라인 결제는 추후 구현 예정

## 배포
- Vercel, Netlify (프론트엔드)
- Railway, Render (백엔드)
