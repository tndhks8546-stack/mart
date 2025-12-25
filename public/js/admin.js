// 필마트 관리자 JavaScript

let orders = [];
let products = [];
let lastOrderCount = 0;
let checkInterval;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
});

// ===== 인증 =====

async function checkAdminAuth() {
    try {
        const res = await fetch('/api/admin/check');
        const data = await res.json();
        if (data.isAdmin) {
            showAdminMain();
        }
    } catch (error) {
        console.error('인증 확인 실패:', error);
    }
}

async function adminLogin(event) {
    event.preventDefault();

    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (data.success) {
            showAdminMain();
        } else {
            alert(data.message || '로그인에 실패했습니다.');
        }
    } catch (error) {
        alert('로그인 중 오류가 발생했습니다.');
    }
}

async function adminLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    clearInterval(checkInterval);
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminMain').style.display = 'none';
}

function showAdminMain() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminMain').style.display = 'flex';
    loadDashboard();
    loadOrders();
    loadAdminProducts();

    // 30초마다 새 주문 체크
    checkInterval = setInterval(checkNewOrders, 30000);
}

// ===== 대시보드 =====

async function loadDashboard() {
    try {
        const res = await fetch('/api/admin/stats');
        const stats = await res.json();

        document.getElementById('statTodayOrders').textContent = stats.todayOrders + '건';
        document.getElementById('statTodaySales').textContent = formatPrice(stats.todaySales) + '원';
        document.getElementById('statWeekSales').textContent = formatPrice(stats.weekSales) + '원';
        document.getElementById('statNewOrders').textContent = stats.newOrders + '건';

        // 신규 주문 배지
        const badge = document.getElementById('newOrderBadge');
        if (stats.newOrders > 0) {
            badge.textContent = stats.newOrders;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }

        lastOrderCount = stats.newOrders;

        // 최근 주문 로드
        loadRecentOrders();
    } catch (error) {
        console.error('대시보드 로드 실패:', error);
    }
}

async function loadRecentOrders() {
    try {
        const res = await fetch('/api/admin/orders');
        const allOrders = await res.json();
        const recent = allOrders.slice(0, 5);

        const container = document.getElementById('recentOrders');
        if (recent.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#666; padding:20px;">주문이 없습니다.</p>';
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

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>주문번호</th>
                        <th>고객명</th>
                        <th>금액</th>
                        <th>상태</th>
                        <th>시간</th>
                    </tr>
                </thead>
                <tbody>
        `;

        recent.forEach(order => {
            html += `
                <tr onclick="showOrderDetail(${order.id})" style="cursor:pointer;">
                    <td><strong>${order.order_number}</strong></td>
                    <td>${order.user_name}</td>
                    <td>${formatPrice(order.total_amount + order.delivery_fee)}원</td>
                    <td><span class="order-status ${order.status}">${statusLabels[order.status]}</span></td>
                    <td>${formatTime(order.created_at)}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (error) {
        console.error('최근 주문 로드 실패:', error);
    }
}

// ===== 주문 관리 =====

async function loadOrders() {
    try {
        const status = document.getElementById('orderStatusFilter').value;
        const date = document.getElementById('orderDateFilter').value;

        let url = '/api/admin/orders?';
        if (status) url += `status=${status}&`;
        if (date) url += `date=${date}&`;

        const res = await fetch(url);
        orders = await res.json();
        renderOrders();
    } catch (error) {
        console.error('주문 목록 로드 실패:', error);
    }
}

function renderOrders() {
    const container = document.getElementById('orderList');

    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666; padding:40px;">주문이 없습니다.</p>';
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
        const itemSummary = order.items.map(i => `${i.product_name} x${i.quantity}`).join(', ');
        html += `
            <div class="order-card" onclick="showOrderDetail(${order.id})">
                <div class="order-card-header">
                    <div>
                        <div class="order-number">${order.order_number}</div>
                        <div class="order-date">${formatDateTime(order.created_at)}</div>
                    </div>
                    <span class="order-status ${order.status}">${statusLabels[order.status]}</span>
                </div>
                <div class="order-info">
                    <div class="order-info-item">
                        <span class="order-info-label">고객명</span>
                        <span class="order-info-value">${order.user_name}</span>
                    </div>
                    <div class="order-info-item">
                        <span class="order-info-label">연락처</span>
                        <span class="order-info-value">
                            <a href="tel:${order.user_phone}" onclick="event.stopPropagation();">${order.user_phone}</a>
                        </span>
                    </div>
                    <div class="order-info-item">
                        <span class="order-info-label">배송방법</span>
                        <span class="order-info-value">${order.delivery_type === 'delivery' ? '🚗 배달' : '🏪 픽업'}</span>
                    </div>
                    <div class="order-info-item">
                        <span class="order-info-label">결제금액</span>
                        <span class="order-info-value" style="color:#388e3c; font-size:18px;">${formatPrice(order.total_amount + order.delivery_fee)}원</span>
                    </div>
                </div>
                <div style="margin-top:12px; font-size:14px; color:#666;">
                    ${itemSummary}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function showOrderDetail(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const statusLabels = {
        pending: '주문 접수',
        preparing: '준비중',
        delivering: '배달중',
        completed: '완료',
        pickup_ready: '픽업 대기',
        pickup_completed: '픽업 완료',
        cancelled: '취소됨'
    };

    const isDelivery = order.delivery_type === 'delivery';
    const statuses = isDelivery
        ? ['pending', 'preparing', 'delivering', 'completed', 'cancelled']
        : ['pending', 'preparing', 'pickup_ready', 'pickup_completed', 'cancelled'];

    const statusButtons = statuses.map(s => `
        <button class="status-btn ${order.status === s ? 'active' : ''}" onclick="updateOrderStatus(${order.id}, '${s}')">
            ${statusLabels[s]}
        </button>
    `).join('');

    const content = `
        <div class="order-detail-section">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h2 style="margin:0;">${order.order_number}</h2>
                <span class="order-status ${order.status}" style="font-size:16px;">${statusLabels[order.status]}</span>
            </div>
        </div>

        <div class="order-detail-section">
            <h4>👤 고객 정보</h4>
            <div class="order-detail-grid">
                <div class="order-detail-item">
                    <div class="order-detail-label">이름</div>
                    <div class="order-detail-value">${order.user_name}</div>
                </div>
                <div class="order-detail-item">
                    <div class="order-detail-label">연락처</div>
                    <div class="order-detail-value">
                        <a href="tel:${order.user_phone}" style="color:#4CAF50; font-weight:bold;">${order.user_phone}</a>
                    </div>
                </div>
                <div class="order-detail-item" style="grid-column:1/-1;">
                    <div class="order-detail-label">주소</div>
                    <div class="order-detail-value">${order.address}</div>
                </div>
                ${order.delivery_request ? `
                <div class="order-detail-item" style="grid-column:1/-1;">
                    <div class="order-detail-label">배송 요청사항</div>
                    <div class="order-detail-value">${order.delivery_request}</div>
                </div>
                ` : ''}
            </div>
        </div>

        <div class="order-detail-section">
            <h4>📦 주문 상품</h4>
            <div class="order-items-list">
                ${order.items.map(item => `
                    <div class="order-item-row">
                        <span>${item.product_name} x ${item.quantity}</span>
                        <span>${formatPrice(item.price * item.quantity)}원</span>
                    </div>
                `).join('')}
                <div class="order-item-row" style="background:#f8f9fa;">
                    <span>상품 금액</span>
                    <span>${formatPrice(order.total_amount)}원</span>
                </div>
                <div class="order-item-row" style="background:#f8f9fa;">
                    <span>배달비</span>
                    <span>${order.delivery_fee > 0 ? formatPrice(order.delivery_fee) + '원' : '무료'}</span>
                </div>
                <div class="order-item-row" style="background:#e8f5e9; font-weight:bold; font-size:18px;">
                    <span>총 결제금액</span>
                    <span style="color:#388e3c;">${formatPrice(order.total_amount + order.delivery_fee)}원</span>
                </div>
            </div>
        </div>

        <div class="order-detail-section">
            <h4>📋 주문 정보</h4>
            <div class="order-detail-grid">
                <div class="order-detail-item">
                    <div class="order-detail-label">배송 방법</div>
                    <div class="order-detail-value">${order.delivery_type === 'delivery' ? '🚗 배달' : '🏪 매장 픽업'}</div>
                </div>
                <div class="order-detail-item">
                    <div class="order-detail-label">결제 방법</div>
                    <div class="order-detail-value">${order.payment_method === 'cash' ? '💵 현금' : '💳 카드'}</div>
                </div>
                <div class="order-detail-item">
                    <div class="order-detail-label">주문 시간</div>
                    <div class="order-detail-value">${formatDateTime(order.created_at)}</div>
                </div>
            </div>
        </div>

        <div class="order-detail-section">
            <h4>🔄 상태 변경</h4>
            <div class="status-buttons">
                ${statusButtons}
            </div>
        </div>

        <div class="order-detail-section">
            <h4>📝 사장님 메모</h4>
            <textarea class="memo-textarea" id="orderMemo" placeholder="메모를 입력하세요...">${order.admin_memo || ''}</textarea>
            <button class="btn btn-outline btn-sm" style="margin-top:8px;" onclick="saveOrderMemo(${order.id})">메모 저장</button>
        </div>
    `;

    document.getElementById('orderModalContent').innerHTML = content;
    document.getElementById('orderModal').style.display = 'flex';
}

async function updateOrderStatus(orderId, status) {
    try {
        const res = await fetch(`/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (res.ok) {
            // 상태 버튼 업데이트
            document.querySelectorAll('.status-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.textContent.trim() === getStatusLabel(status)) {
                    btn.classList.add('active');
                }
            });

            // 주문 목록 새로고침
            loadOrders();
            loadDashboard();
            showToast('상태가 변경되었습니다.');
        }
    } catch (error) {
        console.error('상태 변경 실패:', error);
        alert('상태 변경에 실패했습니다.');
    }
}

async function saveOrderMemo(orderId) {
    const memo = document.getElementById('orderMemo').value;

    try {
        await fetch(`/api/admin/orders/${orderId}/memo`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memo })
        });
        showToast('메모가 저장되었습니다.');
    } catch (error) {
        alert('메모 저장에 실패했습니다.');
    }
}

function getStatusLabel(status) {
    const labels = {
        pending: '주문 접수',
        preparing: '준비중',
        delivering: '배달중',
        completed: '완료',
        pickup_ready: '픽업 대기',
        pickup_completed: '픽업 완료',
        cancelled: '취소됨'
    };
    return labels[status];
}

// ===== 상품 관리 =====

async function loadAdminProducts() {
    try {
        const search = document.getElementById('productSearch')?.value || '';
        const url = search ? `/api/admin/products?search=${encodeURIComponent(search)}` : '/api/admin/products';

        const res = await fetch(url);
        products = await res.json();
        renderAdminProducts();
    } catch (error) {
        console.error('상품 목록 로드 실패:', error);
    }
}

function renderAdminProducts() {
    const container = document.getElementById('productList');

    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666; padding:40px;">상품이 없습니다.</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th style="width:60px;">이미지</th>
                    <th>상품명</th>
                    <th>가격</th>
                    <th>카테고리</th>
                    <th>재고</th>
                    <th>상태</th>
                    <th>관리</th>
                </tr>
            </thead>
            <tbody>
    `;

    products.forEach(product => {
        html += `
            <tr>
                <td>
                    <img src="${product.image_url || '/images/default-product.png'}"
                         style="width:50px; height:50px; object-fit:cover; border-radius:6px;">
                </td>
                <td><strong>${product.name}</strong></td>
                <td>${formatPrice(product.price)}원</td>
                <td>${product.category_name || '-'}</td>
                <td>${product.stock > 0 ? product.stock + '개' : '<span style="color:#f44336;">품절</span>'}</td>
                <td>${product.is_active ? '판매중' : '<span style="color:#999;">비활성</span>'}</td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="editProduct(${product.id})">수정</button>
                    <button class="btn btn-outline btn-sm" onclick="toggleStock(${product.id})">
                        ${product.stock > 0 ? '품절처리' : '재입고'}
                    </button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function searchAdminProducts(event) {
    if (event.key === 'Enter') {
        loadAdminProducts();
    }
}

function showProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('productModalTitle');
    const activeGroup = document.getElementById('productActiveGroup');

    form.reset();
    document.getElementById('productId').value = '';

    if (productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
            title.textContent = '상품 수정';
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productCategory').value = product.category_id;
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productStock').value = product.stock;
            document.getElementById('productActive').checked = product.is_active;
            activeGroup.style.display = 'block';
        }
    } else {
        title.textContent = '상품 등록';
        activeGroup.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function editProduct(productId) {
    showProductModal(productId);
}

async function saveProduct(event) {
    event.preventDefault();

    const productId = document.getElementById('productId').value;
    const formData = new FormData();

    formData.append('name', document.getElementById('productName').value);
    formData.append('price', document.getElementById('productPrice').value);
    formData.append('category_id', document.getElementById('productCategory').value);
    formData.append('description', document.getElementById('productDescription').value);
    formData.append('stock', document.getElementById('productStock').value);

    if (productId) {
        formData.append('is_active', document.getElementById('productActive').checked ? 1 : 0);
    }

    const imageFile = document.getElementById('productImage').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const url = productId ? `/api/admin/products/${productId}` : '/api/admin/products';
        const method = productId ? 'PUT' : 'POST';

        const res = await fetch(url, { method, body: formData });

        if (res.ok) {
            closeModal('productModal');
            loadAdminProducts();
            showToast(productId ? '상품이 수정되었습니다.' : '상품이 등록되었습니다.');
        } else {
            throw new Error('저장 실패');
        }
    } catch (error) {
        alert('상품 저장에 실패했습니다.');
    }
}

async function toggleStock(productId) {
    try {
        const res = await fetch(`/api/admin/products/${productId}/toggle-stock`, { method: 'POST' });
        if (res.ok) {
            loadAdminProducts();
            showToast('재고 상태가 변경되었습니다.');
        }
    } catch (error) {
        alert('재고 변경에 실패했습니다.');
    }
}

// ===== 신규 주문 알림 =====

async function checkNewOrders() {
    try {
        const res = await fetch('/api/admin/stats');
        const stats = await res.json();

        if (stats.newOrders > lastOrderCount) {
            // 새 주문이 있음
            playNotificationSound();
            showNotificationPopup(stats.newOrders - lastOrderCount);
            loadDashboard();
            loadOrders();
        }

        lastOrderCount = stats.newOrders;
    } catch (error) {
        console.error('주문 확인 실패:', error);
    }
}

function playNotificationSound() {
    const audio = document.getElementById('notificationSound');
    if (audio) {
        audio.play().catch(() => { });
    }
}

function showNotificationPopup(count) {
    const popup = document.createElement('div');
    popup.className = 'notification-popup';
    popup.innerHTML = `
        <h4>🔔 새 주문이 들어왔습니다!</h4>
        <p>${count}건의 새로운 주문</p>
    `;
    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 5000);
}

// ===== 섹션 전환 =====

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));

    document.getElementById('section-' + sectionId).classList.add('active');
    event.target.closest('.nav-link').classList.add('active');

    if (sectionId === 'dashboard') loadDashboard();
    else if (sectionId === 'orders') loadOrders();
    else if (sectionId === 'products') loadAdminProducts();
}

// ===== 모달 =====

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

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

function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2500);
}
