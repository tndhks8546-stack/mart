const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// 데이터 파일 경로
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

// 데이터 디렉토리 생성
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 데이터 로드/저장 함수
function loadData(file, defaultData = []) {
    try {
        if (fs.existsSync(file)) {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        }
    } catch (e) {
        console.error('데이터 로드 실패:', e);
    }
    return defaultData;
}

function saveData(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// 초기 데이터 설정
function initializeData() {
    // 카테고리 초기화
    if (!fs.existsSync(CATEGORIES_FILE)) {
        const categories = [
            { id: 1, name: '신선식품', icon: '🥬', sort_order: 1 },
            { id: 2, name: '가공식품', icon: '🍜', sort_order: 2 },
            { id: 3, name: '생활용품', icon: '🧴', sort_order: 3 }
        ];
        saveData(CATEGORIES_FILE, categories);
    }

    // 상품 초기화
    if (!fs.existsSync(PRODUCTS_FILE)) {
        const products = [
            // 신선식품
            { id: 1, name: '사과 (1kg)', price: 5000, category_id: 1, description: '달콤한 국산 사과', image_url: '/images/default-product.png', stock: 50, is_active: 1, created_at: new Date().toISOString() },
            { id: 2, name: '배 (1kg)', price: 6000, category_id: 1, description: '시원한 국산 배', image_url: '/images/default-product.png', stock: 30, is_active: 1, created_at: new Date().toISOString() },
            { id: 3, name: '바나나 (1송이)', price: 3000, category_id: 1, description: '필리핀산 바나나', image_url: '/images/default-product.png', stock: 40, is_active: 1, created_at: new Date().toISOString() },
            { id: 4, name: '감귤 (1kg)', price: 4000, category_id: 1, description: '제주산 감귤', image_url: '/images/default-product.png', stock: 60, is_active: 1, created_at: new Date().toISOString() },
            { id: 5, name: '양파 (1kg)', price: 2500, category_id: 1, description: '국산 양파', image_url: '/images/default-product.png', stock: 100, is_active: 1, created_at: new Date().toISOString() },
            { id: 6, name: '감자 (1kg)', price: 3000, category_id: 1, description: '국산 감자', image_url: '/images/default-product.png', stock: 80, is_active: 1, created_at: new Date().toISOString() },
            { id: 7, name: '당근 (500g)', price: 2000, category_id: 1, description: '싱싱한 당근', image_url: '/images/default-product.png', stock: 70, is_active: 1, created_at: new Date().toISOString() },
            { id: 8, name: '시금치 (200g)', price: 2500, category_id: 1, description: '무농약 시금치', image_url: '/images/default-product.png', stock: 30, is_active: 1, created_at: new Date().toISOString() },
            { id: 9, name: '삼겹살 (500g)', price: 15000, category_id: 1, description: '국내산 삼겹살', image_url: '/images/default-product.png', stock: 20, is_active: 1, created_at: new Date().toISOString() },
            { id: 10, name: '닭가슴살 (500g)', price: 8000, category_id: 1, description: '신선한 닭가슴살', image_url: '/images/default-product.png', stock: 25, is_active: 1, created_at: new Date().toISOString() },
            { id: 11, name: '고등어 (2마리)', price: 7000, category_id: 1, description: '국내산 고등어', image_url: '/images/default-product.png', stock: 15, is_active: 1, created_at: new Date().toISOString() },
            { id: 12, name: '새우 (300g)', price: 12000, category_id: 1, description: '신선한 새우', image_url: '/images/default-product.png', stock: 10, is_active: 1, created_at: new Date().toISOString() },
            // 가공식품
            { id: 13, name: '신라면 (5개입)', price: 4000, category_id: 2, description: '매콤한 신라면', image_url: '/images/default-product.png', stock: 100, is_active: 1, created_at: new Date().toISOString() },
            { id: 14, name: '진라면 (5개입)', price: 3500, category_id: 2, description: '구수한 진라면', image_url: '/images/default-product.png', stock: 80, is_active: 1, created_at: new Date().toISOString() },
            { id: 15, name: '짜파게티 (5개입)', price: 4500, category_id: 2, description: '맛있는 짜파게티', image_url: '/images/default-product.png', stock: 60, is_active: 1, created_at: new Date().toISOString() },
            { id: 16, name: '만두 (500g)', price: 5000, category_id: 2, description: '고기만두', image_url: '/images/default-product.png', stock: 40, is_active: 1, created_at: new Date().toISOString() },
            { id: 17, name: '피자 (냉동)', price: 8000, category_id: 2, description: '콤비네이션 피자', image_url: '/images/default-product.png', stock: 20, is_active: 1, created_at: new Date().toISOString() },
            { id: 18, name: '치킨너겟 (300g)', price: 6000, category_id: 2, description: '바삭한 치킨너겟', image_url: '/images/default-product.png', stock: 30, is_active: 1, created_at: new Date().toISOString() },
            { id: 19, name: '코카콜라 (1.5L)', price: 2500, category_id: 2, description: '시원한 콜라', image_url: '/images/default-product.png', stock: 50, is_active: 1, created_at: new Date().toISOString() },
            { id: 20, name: '사이다 (1.5L)', price: 2000, category_id: 2, description: '청량 사이다', image_url: '/images/default-product.png', stock: 50, is_active: 1, created_at: new Date().toISOString() },
            { id: 21, name: '우유 (1L)', price: 2800, category_id: 2, description: '신선한 우유', image_url: '/images/default-product.png', stock: 30, is_active: 1, created_at: new Date().toISOString() },
            { id: 22, name: '요거트 (4개입)', price: 3500, category_id: 2, description: '딸기 요거트', image_url: '/images/default-product.png', stock: 40, is_active: 1, created_at: new Date().toISOString() },
            // 생활용품
            { id: 23, name: '세탁세제 (2L)', price: 12000, category_id: 3, description: '고농축 세탁세제', image_url: '/images/default-product.png', stock: 25, is_active: 1, created_at: new Date().toISOString() },
            { id: 24, name: '섬유유연제 (2L)', price: 8000, category_id: 3, description: '향기로운 섬유유연제', image_url: '/images/default-product.png', stock: 30, is_active: 1, created_at: new Date().toISOString() },
            { id: 25, name: '주방세제 (500ml)', price: 3000, category_id: 3, description: '기름때 세척', image_url: '/images/default-product.png', stock: 50, is_active: 1, created_at: new Date().toISOString() },
            { id: 26, name: '화장지 (30롤)', price: 15000, category_id: 3, description: '부드러운 화장지', image_url: '/images/default-product.png', stock: 20, is_active: 1, created_at: new Date().toISOString() },
            { id: 27, name: '물티슈 (100매)', price: 2500, category_id: 3, description: '촉촉한 물티슈', image_url: '/images/default-product.png', stock: 60, is_active: 1, created_at: new Date().toISOString() },
            { id: 28, name: '샴푸 (500ml)', price: 8000, category_id: 3, description: '두피 케어 샴푸', image_url: '/images/default-product.png', stock: 35, is_active: 1, created_at: new Date().toISOString() }
        ];
        saveData(PRODUCTS_FILE, products);
    }

    // 사용자 초기화
    if (!fs.existsSync(USERS_FILE)) {
        saveData(USERS_FILE, []);
    }

    // 주문 초기화
    if (!fs.existsSync(ORDERS_FILE)) {
        saveData(ORDERS_FILE, []);
    }
}

initializeData();

// Multer 설정 (이미지 업로드)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public', 'images');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'pilmart-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ===== 회원 API =====

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, phone, password, address } = req.body;
        const users = loadData(USERS_FILE, []);

        if (users.find(u => u.phone === phone)) {
            return res.status(400).json({ success: false, message: '이미 등록된 전화번호입니다.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: users.length + 1,
            name,
            phone,
            password: hashedPassword,
            address: address || '',
            created_at: new Date().toISOString()
        };

        users.push(newUser);
        saveData(USERS_FILE, users);

        res.json({ success: true, userId: newUser.id });
    } catch (error) {
        res.status(500).json({ success: false, message: '회원가입 중 오류가 발생했습니다.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        const users = loadData(USERS_FILE, []);
        const user = users.find(u => u.phone === phone);

        if (!user) {
            return res.status(401).json({ success: false, message: '등록되지 않은 전화번호입니다.' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
        }

        req.session.user = { id: user.id, name: user.name, phone: user.phone, address: user.address };
        res.json({ success: true, user: req.session.user });
    } catch (error) {
        res.status(500).json({ success: false, message: '로그인 중 오류가 발생했습니다.' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
    if (req.session.user) {
        res.json({ success: true, user: req.session.user });
    } else {
        res.json({ success: false, user: null });
    }
});

app.put('/api/auth/update', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    const { name, phone, address } = req.body;
    const users = loadData(USERS_FILE, []);
    const userIndex = users.findIndex(u => u.id === req.session.user.id);

    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], name, phone, address };
        saveData(USERS_FILE, users);
        req.session.user = { ...req.session.user, name, phone, address };
    }

    res.json({ success: true, user: req.session.user });
});

// ===== 카테고리/상품 API =====

app.get('/api/categories', (req, res) => {
    const categories = loadData(CATEGORIES_FILE, []);
    res.json(categories.sort((a, b) => a.sort_order - b.sort_order));
});

app.get('/api/products', (req, res) => {
    const { category, search, page = 1, limit = 20 } = req.query;
    let products = loadData(PRODUCTS_FILE, []).filter(p => p.is_active === 1);
    const categories = loadData(CATEGORIES_FILE, []);

    if (category) {
        products = products.filter(p => p.category_id === parseInt(category));
    }

    if (search) {
        products = products.filter(p => p.name.includes(search));
    }

    // 카테고리 이름 추가
    products = products.map(p => ({
        ...p,
        category_name: categories.find(c => c.id === p.category_id)?.name || ''
    }));

    const total = products.length;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    products = products.slice(offset, offset + parseInt(limit));

    res.json({ products, total, page: parseInt(page), limit: parseInt(limit) });
});

app.get('/api/products/:id', (req, res) => {
    const products = loadData(PRODUCTS_FILE, []);
    const categories = loadData(CATEGORIES_FILE, []);
    const product = products.find(p => p.id === parseInt(req.params.id));

    if (product) {
        res.json({
            ...product,
            category_name: categories.find(c => c.id === product.category_id)?.name || ''
        });
    } else {
        res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }
});

// ===== 주문 API =====

app.post('/api/orders', (req, res) => {
    const {
        user_name, user_phone, address, address_detail,
        delivery_type, delivery_request, payment_method,
        items, total_amount
    } = req.body;

    if (total_amount < 10000) {
        return res.status(400).json({ success: false, message: '최소 주문금액은 10,000원입니다.' });
    }

    let delivery_fee = 0;
    if (delivery_type === 'delivery' && total_amount < 30000) {
        delivery_fee = 3000;
    }

    const fullAddress = address + (address_detail ? ' ' + address_detail : '');
    const orders = loadData(ORDERS_FILE, []);
    const products = loadData(PRODUCTS_FILE, []);

    // 주문번호 생성
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const todayOrders = orders.filter(o => o.order_number?.startsWith(today)).length;
    const orderNumber = `${today}-${String(todayOrders + 1).padStart(4, '0')}`;

    const orderItems = items.map(item => {
        const product = products.find(p => p.id === item.product_id);
        return {
            product_id: item.product_id,
            product_name: product?.name || '',
            quantity: item.quantity,
            price: product?.price || 0
        };
    });

    const newOrder = {
        id: orders.length + 1,
        order_number: orderNumber,
        user_id: req.session.user?.id || null,
        user_name,
        user_phone,
        address: fullAddress,
        delivery_type,
        delivery_request: delivery_request || '',
        payment_method,
        total_amount,
        delivery_fee,
        status: 'pending',
        admin_memo: '',
        items: orderItems,
        created_at: new Date().toISOString()
    };

    orders.push(newOrder);
    saveData(ORDERS_FILE, orders);

    // 재고 감소
    items.forEach(item => {
        const productIndex = products.findIndex(p => p.id === item.product_id);
        if (productIndex !== -1 && products[productIndex].stock >= item.quantity) {
            products[productIndex].stock -= item.quantity;
        }
    });
    saveData(PRODUCTS_FILE, products);

    res.json({
        success: true,
        order_number: orderNumber,
        order_id: newOrder.id,
        delivery_fee,
        final_amount: total_amount + delivery_fee
    });
});

app.get('/api/orders', (req, res) => {
    const { phone } = req.query;
    let orders = loadData(ORDERS_FILE, []);

    if (req.session.user) {
        orders = orders.filter(o => o.user_id === req.session.user.id);
    } else if (phone) {
        orders = orders.filter(o => o.user_phone === phone);
    } else {
        return res.status(400).json({ success: false, message: '전화번호를 입력해주세요.' });
    }

    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ success: true, orders });
});

app.get('/api/orders/:orderNumber', (req, res) => {
    const orders = loadData(ORDERS_FILE, []);
    const order = orders.find(o => o.order_number === req.params.orderNumber);

    if (!order) {
        return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    res.json({ success: true, order });
});

// ===== 관리자 API =====

const adminAuth = (req, res, next) => {
    if (req.session.admin) {
        next();
    } else {
        res.status(401).json({ success: false, message: '관리자 로그인이 필요합니다.' });
    }
};

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'pilmart2024') {
        req.session.admin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
    }
});

app.post('/api/admin/logout', (req, res) => {
    req.session.admin = false;
    res.json({ success: true });
});

app.get('/api/admin/check', (req, res) => {
    res.json({ success: true, isAdmin: !!req.session.admin });
});

app.get('/api/admin/products', adminAuth, (req, res) => {
    const { search } = req.query;
    let products = loadData(PRODUCTS_FILE, []);
    const categories = loadData(CATEGORIES_FILE, []);

    if (search) {
        products = products.filter(p => p.name.includes(search));
    }

    products = products.map(p => ({
        ...p,
        category_name: categories.find(c => c.id === p.category_id)?.name || ''
    }));

    res.json(products);
});

app.post('/api/admin/products', adminAuth, upload.single('image'), (req, res) => {
    const { name, price, category_id, description, stock } = req.body;
    const products = loadData(PRODUCTS_FILE, []);

    const newProduct = {
        id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
        name,
        price: parseInt(price),
        category_id: parseInt(category_id),
        description: description || '',
        image_url: req.file ? '/images/' + req.file.filename : '/images/default-product.png',
        stock: parseInt(stock) || 0,
        is_active: 1,
        created_at: new Date().toISOString()
    };

    products.push(newProduct);
    saveData(PRODUCTS_FILE, products);

    res.json({ success: true, productId: newProduct.id });
});

app.put('/api/admin/products/:id', adminAuth, upload.single('image'), (req, res) => {
    const { name, price, category_id, description, stock, is_active } = req.body;
    const products = loadData(PRODUCTS_FILE, []);
    const index = products.findIndex(p => p.id === parseInt(req.params.id));

    if (index !== -1) {
        products[index] = {
            ...products[index],
            name,
            price: parseInt(price),
            category_id: parseInt(category_id),
            description: description || '',
            stock: parseInt(stock),
            is_active: parseInt(is_active)
        };

        if (req.file) {
            products[index].image_url = '/images/' + req.file.filename;
        }

        saveData(PRODUCTS_FILE, products);
    }

    res.json({ success: true });
});

app.delete('/api/admin/products/:id', adminAuth, (req, res) => {
    const products = loadData(PRODUCTS_FILE, []);
    const index = products.findIndex(p => p.id === parseInt(req.params.id));

    if (index !== -1) {
        products[index].is_active = 0;
        saveData(PRODUCTS_FILE, products);
    }

    res.json({ success: true });
});

app.post('/api/admin/products/:id/toggle-stock', adminAuth, (req, res) => {
    const products = loadData(PRODUCTS_FILE, []);
    const index = products.findIndex(p => p.id === parseInt(req.params.id));

    if (index !== -1) {
        products[index].stock = products[index].stock > 0 ? 0 : 100;
        saveData(PRODUCTS_FILE, products);
        res.json({ success: true, stock: products[index].stock });
    } else {
        res.status(404).json({ success: false });
    }
});

app.get('/api/admin/orders', adminAuth, (req, res) => {
    const { status, date } = req.query;
    let orders = loadData(ORDERS_FILE, []);

    if (status) {
        orders = orders.filter(o => o.status === status);
    }

    if (date) {
        orders = orders.filter(o => o.created_at.slice(0, 10) === date);
    }

    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(orders);
});

app.put('/api/admin/orders/:id/status', adminAuth, (req, res) => {
    const { status } = req.body;
    const orders = loadData(ORDERS_FILE, []);
    const index = orders.findIndex(o => o.id === parseInt(req.params.id));

    if (index !== -1) {
        orders[index].status = status;
        saveData(ORDERS_FILE, orders);
    }

    res.json({ success: true });
});

app.put('/api/admin/orders/:id/memo', adminAuth, (req, res) => {
    const { memo } = req.body;
    const orders = loadData(ORDERS_FILE, []);
    const index = orders.findIndex(o => o.id === parseInt(req.params.id));

    if (index !== -1) {
        orders[index].admin_memo = memo;
        saveData(ORDERS_FILE, orders);
    }

    res.json({ success: true });
});

app.get('/api/admin/stats', adminAuth, (req, res) => {
    const orders = loadData(ORDERS_FILE, []);
    const today = new Date().toISOString().slice(0, 10);

    const todayOrders = orders.filter(o => o.created_at.slice(0, 10) === today);
    const todaySales = todayOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total_amount + o.delivery_fee, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    const weekSales = orders
        .filter(o => o.created_at.slice(0, 10) >= weekStartStr && o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total_amount + o.delivery_fee, 0);

    const newOrders = orders.filter(o => o.status === 'pending').length;

    res.json({
        todayOrders: todayOrders.length,
        todaySales,
        weekSales,
        newOrders
    });
});

// 서버 시작
const server = require('http').createServer(app);
server.listen(PORT, () => {
    console.log(`\n=================================`);
    console.log(`  필마트 서버가 시작되었습니다!`);
    console.log(`=================================`);
    console.log(`\n  고객 페이지: http://localhost:${PORT}`);
    console.log(`  관리자 페이지: http://localhost:${PORT}/admin.html`);
    console.log(`\n  관리자 로그인 정보:`);
    console.log(`  - 아이디: admin`);
    console.log(`  - 비밀번호: pilmart2024`);
    console.log(`\n=================================\n`);
});
