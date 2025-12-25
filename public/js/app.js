// 필마트 메인 JavaScript

// 전역 상태
let cart = JSON.parse(localStorage.getItem('pilmart_cart')) || [];
let currentUser = null;
let products = [];
let categories = [];

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
    checkAuth();
    updateCartBadge();

    // 엔터키로 검색
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchProducts();
    });
});

// ===== API 호출 함수들 =====

async function loadCategories() {
    try {
        const res = await fetch('/api/categories');
        categories = await res.json();
        renderCategories();
    } catch (error) {
        console.error('카테고리 로드 실패:', error);
    }
}

async function loadProducts(categoryId = null, search = null) {
    try {
        let url = '/api/products?limit=50';
        if (categoryId) url += `&category=${categoryId}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const res = await fetch(url);
        const data = await res.json();
        products = data.products;
        renderProducts();
    } catch (error) {
        console.error('상품 로드 실패:', error);
    }
}

async function checkAuth() {
    try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success && data.user) {
            currentUser = data.user;
            updateUserUI();
        }
    } catch (error) {
        console.error('인증 확인 실패:', error);
    }
}

// ===== 렌더링 함수들 =====

function renderCategories() {
    const container = document.getElementById('categoryList');
    const allBtn = container.querySelector('.category-btn');

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.innerHTML = `<span class="icon">${cat.icon}</span> ${cat.name}`;
        btn.onclick = () => filterCategory(cat.id);
        container.appendChild(btn);
    });
}

function renderProducts() {
    const container = document.getElementById('productList');
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#666; padding:40px;">상품이 없습니다.</p>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image_url || '/images/default-product.png'}" alt="${product.name}" class="product-image" onclick="showProductDetail(${product.id})">
            <div class="product-info">
                <div class="product-name" onclick="showProductDetail(${product.id})">${product.name}</div>
                <div class="product-price">${formatPrice(product.price)}원</div>
                ${product.stock <= 0 ? '<div class="product-stock sold-out">품절</div>' : ''}
                <button class="add-cart-btn" onclick="addToCart(${product.id})" ${product.stock <= 0 ? 'disabled' : ''}>
                    ${product.stock <= 0 ? '품절' : '담기'}
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// ===== 상품 상세 =====

async function showProductDetail(productId) {
    try {
        const res = await fetch(`/api/products/${productId}`);
        const product = await res.json();

        const container = document.getElementById('productDetail');
        container.innerHTML = `
            <img src="${product.image_url || '/images/default-product.png'}" alt="${product.name}" class="product-detail-image">
            <div class="product-detail-info">
                <div class="product-detail-name">${product.name}</div>
                <div class="product-detail-price">${formatPrice(product.price)}원</div>
                ${product.stock <= 0 ? '<div class="product-stock sold-out" style="font-size:18px;">품절된 상품입니다</div>' : ''}
                <div class="product-detail-desc">${product.description || '신선한 상품입니다.'}</div>
            </div>
            <div class="product-detail-actions">
                <button class="add-cart-btn" onclick="addToCart(${product.id}); showToast('장바구니에 담았습니다');" ${product.stock <= 0 ? 'disabled' : ''} style="flex:1;">
                    ${product.stock <= 0 ? '품절' : '장바구니 담기'}
                </button>
                <button class="buy-now-btn" onclick="buyNow(${product.id})" ${product.stock <= 0 ? 'disabled' : ''}>
                    바로구매
                </button>
            </div>
        `;

        showPage('product');
    } catch (error) {
        showToast('상품 정보를 불러올 수 없습니다.');
    }
}

// ===== 장바구니 =====

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;

    const existingItem = cart.find(item => item.product_id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            product_id: productId,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            quantity: 1
        });
    }

    saveCart();
    updateCartBadge();
    showToast('장바구니에 담았습니다');
}

function buyNow(productId) {
    addToCart(productId);
    showPage('cart');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.product_id !== productId);
    saveCart();
    renderCart();
    updateCartBadge();
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.product_id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            renderCart();
        }
    }
}

function saveCart() {
    localStorage.setItem('pilmart_cart', JSON.stringify(cart));
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > 0) {
        badge.textContent = totalItems;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

function renderCart() {
    const container = document.getElementById('cartContainer');
    const summary = document.getElementById('cartSummary');

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <div class="icon">🛒</div>
                <h3>장바구니가 비어있습니다</h3>
                <p>상품을 담아보세요!</p>
                <button class="btn btn-primary mt-20" onclick="showPage('home')">쇼핑하러 가기</button>
            </div>
        `;
        summary.style.display = 'none';
        return;
    }

    let html = '';
    let total = 0;

    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        html += `
            <div class="cart-item">
                <img src="${item.image_url || '/images/default-product.png'}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${formatPrice(subtotal)}원</div>
                    <div class="cart-quantity">
                        <button class="quantity-btn" onclick="updateQuantity(${item.product_id}, -1)">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.product_id}, 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.product_id})">✕</button>
            </div>
        `;
    });

    container.innerHTML = html;
    document.getElementById('cartTotalPrice').textContent = formatPrice(total) + '원';
    summary.style.display = 'block';
}

// ===== 주문하기 =====

function renderCheckout() {
    const itemsContainer = document.getElementById('checkoutItems');
    let html = '';
    let total = 0;

    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        html += `<div style="display:flex; justify-content:space-between; padding:4px 0;">
            <span>${item.name} x ${item.quantity}</span>
            <span>${formatPrice(subtotal)}원</span>
        </div>`;
    });

    itemsContainer.innerHTML = html;
    updateCheckoutTotal();

    // 로그인한 사용자 정보 자동 입력
    if (currentUser) {
        document.getElementById('orderName').value = currentUser.name || '';
        document.getElementById('orderPhone').value = currentUser.phone || '';
        document.getElementById('orderAddress').value = currentUser.address || '';
    }
}

function updateCheckoutTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;
    let deliveryFee = 0;

    if (deliveryType === 'delivery' && subtotal < 30000) {
        deliveryFee = 3000;
    }

    const total = subtotal + deliveryFee;

    document.getElementById('checkoutSubtotal').textContent = formatPrice(subtotal) + '원';
    document.getElementById('checkoutDeliveryFee').textContent = deliveryFee > 0 ? formatPrice(deliveryFee) + '원' : '무료';
    document.getElementById('checkoutTotal').textContent = formatPrice(total) + '원';

    // 최소 주문금액 확인
    const warning = document.getElementById('minOrderWarning');
    const submitBtn = document.getElementById('orderSubmitBtn');
    if (subtotal < 10000) {
        warning.style.display = 'block';
        submitBtn.disabled = true;
    } else {
        warning.style.display = 'none';
        submitBtn.disabled = false;
    }
}

function updateDeliveryOption(input) {
    document.querySelectorAll('input[name="deliveryType"]').forEach(radio => {
        radio.closest('.radio-option').classList.remove('selected');
    });
    input.closest('.radio-option').classList.add('selected');
    updateCheckoutTotal();
}

function updatePaymentOption(input) {
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.closest('.radio-option').classList.remove('selected');
    });
    input.closest('.radio-option').classList.add('selected');
}

async function submitOrder(event) {
    event.preventDefault();

    const name = document.getElementById('orderName').value.trim();
    const phone = document.getElementById('orderPhone').value.trim();
    const address = document.getElementById('orderAddress').value.trim();
    const addressDetail = document.getElementById('orderAddressDetail').value.trim();
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const deliveryRequest = document.getElementById('orderRequest').value.trim();

    if (!name || !phone || !address) {
        showToast('필수 정보를 모두 입력해주세요.');
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (subtotal < 10000) {
        showToast('최소 주문금액은 10,000원입니다.');
        return;
    }

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_name: name,
                user_phone: phone,
                address: address,
                address_detail: addressDetail,
                delivery_type: deliveryType,
                delivery_request: deliveryRequest,
                payment_method: paymentMethod,
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                })),
                total_amount: subtotal
            })
        });

        const data = await res.json();

        if (data.success) {
            document.getElementById('completedOrderNumber').textContent = data.order_number;
            cart = [];
            saveCart();
            updateCartBadge();
            showPage('complete');
        } else {
            showToast(data.message || '주문 처리 중 오류가 발생했습니다.');
        }
    } catch (error) {
        showToast('주문 처리 중 오류가 발생했습니다.');
    }
}

// ===== 주문 내역 =====

async function lookupOrders() {
    const phone = document.getElementById('lookupPhone').value.trim();
    if (!phone) {
        showToast('전화번호를 입력해주세요.');
        return;
    }

    try {
        const res = await fetch(`/api/orders?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();

        if (data.success) {
            renderOrderList(data.orders);
        } else {
            showToast(data.message || '주문 내역을 조회할 수 없습니다.');
        }
    } catch (error) {
        showToast('주문 내역을 조회할 수 없습니다.');
    }
}

async function loadMyOrders() {
    try {
        const res = await fetch('/api/orders');
        const data = await res.json();

        if (data.success) {
            document.getElementById('guestOrderLookup').style.display = 'none';
            renderOrderList(data.orders);
        }
    } catch (error) {
        console.error('주문 내역 로드 실패:', error);
    }
}

function renderOrderList(orders) {
    const container = document.getElementById('orderItems');

    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666; padding:40px;">주문 내역이 없습니다.</p>';
        return;
    }

    const statusLabels = {
        pending: '주문 접수',
        preparing: '준비중',
        delivering: '배달중',
        completed: '완료',
        pickup_ready: '픽업 대기',
        pickup_completed: '픽업 완료',
        cancelled: '취소됨'
    };

    let html = '';
    orders.forEach(order => {
        html += `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <div style="font-weight:bold;">${order.order_number}</div>
                        <div class="order-date">${formatDate(order.created_at)}</div>
                    </div>
                    <span class="order-status ${order.status}">${statusLabels[order.status] || order.status}</span>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item-row">
                            <span>${item.product_name} x ${item.quantity}</span>
                            <span>${formatPrice(item.price * item.quantity)}원</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">
                    <span>총 결제금액</span>
                    <span>${formatPrice(order.total_amount + order.delivery_fee)}원</span>
                </div>
                <div style="margin-top:12px; color:#666; font-size:14px;">
                    ${order.delivery_type === 'delivery' ? '🚗 배달' : '🏪 픽업'} |
                    ${order.payment_method === 'cash' ? '현금결제' : '카드결제'}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ===== 회원 기능 =====

async function login(event) {
    event.preventDefault();

    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password })
        });

        const data = await res.json();

        if (data.success) {
            currentUser = data.user;
            updateUserUI();
            closeModal('loginModal');
            showToast('로그인되었습니다.');
        } else {
            showToast(data.message || '로그인에 실패했습니다.');
        }
    } catch (error) {
        showToast('로그인 중 오류가 발생했습니다.');
    }
}

async function register(event) {
    event.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const address = document.getElementById('regAddress').value.trim();

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, password, address })
        });

        const data = await res.json();

        if (data.success) {
            closeModal('registerModal');
            showToast('회원가입이 완료되었습니다. 로그인해주세요.');
            showLoginModal();
        } else {
            showToast(data.message || '회원가입에 실패했습니다.');
        }
    } catch (error) {
        showToast('회원가입 중 오류가 발생했습니다.');
    }
}

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        currentUser = null;
        updateUserUI();
        showToast('로그아웃되었습니다.');
    } catch (error) {
        console.error('로그아웃 실패:', error);
    }
}

function updateUserUI() {
    const guestView = document.getElementById('guestView');
    const memberView = document.getElementById('memberView');
    const editBtn = document.getElementById('editProfileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const guestLookup = document.getElementById('guestOrderLookup');

    if (currentUser) {
        guestView.style.display = 'none';
        memberView.style.display = 'block';
        editBtn.style.display = 'flex';
        logoutBtn.style.display = 'flex';
        document.getElementById('userNameDisplay').textContent = currentUser.name;
        document.getElementById('userPhoneDisplay').textContent = currentUser.phone;

        if (guestLookup) guestLookup.style.display = 'none';
    } else {
        guestView.style.display = 'block';
        memberView.style.display = 'none';
        editBtn.style.display = 'none';
        logoutBtn.style.display = 'none';

        if (guestLookup) guestLookup.style.display = 'block';
    }
}

// ===== 카테고리 필터 =====

function filterCategory(categoryId) {
    // 버튼 활성화 상태 변경
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.category-btn').classList.add('active');

    loadProducts(categoryId);
}

function searchProducts() {
    const query = document.getElementById('searchInput').value.trim();
    if (query) {
        loadProducts(null, query);
    } else {
        loadProducts();
    }
}

// ===== 페이지 네비게이션 =====

function showPage(pageId) {
    // 모든 페이지 숨기기
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

    // 선택한 페이지 보이기
    const page = document.getElementById('page-' + pageId);
    if (page) page.classList.add('active');

    // 네비게이션 활성화
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const navItem = document.getElementById('nav-' + pageId);
    if (navItem) navItem.classList.add('active');

    // 페이지별 초기화
    if (pageId === 'cart') {
        renderCart();
    } else if (pageId === 'checkout') {
        if (cart.length === 0) {
            showToast('장바구니가 비어있습니다.');
            showPage('cart');
            return;
        }
        renderCheckout();
    } else if (pageId === 'orders' && currentUser) {
        loadMyOrders();
    }

    // 스크롤 맨 위로
    window.scrollTo(0, 0);
}

// ===== 모달 =====

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
}

function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// 모달 바깥 클릭 시 닫기
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.style.display = 'none';
        }
    });
});

// ===== 유틸리티 =====

function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 2500);
}
