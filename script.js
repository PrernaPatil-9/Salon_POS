// ============================================
// SALON POS SYSTEM - COMPLETE LOGIC
// ============================================

// Global Variables
let services = [];
let cart = [];
let currentCategory = 'all';
let currentUser = null;
let searchTimeout = null;

// ============================================
// PAGE INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Check which page we're on
    if (document.getElementById('mobile-number')) {
        initLoginPage();
    } else {
        initPOSPage();
    }
});

// Initialize Login Page
function initLoginPage() {
    const loginBtn = document.getElementById('login-btn');
    const mobileInput = document.getElementById('mobile-number');
    
    loginBtn.addEventListener('click', handleLogin);
    
    mobileInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    // Auto-focus on mobile input
    mobileInput.focus();
}

// Handle Login
function handleLogin() {
    const mobile = document.getElementById('mobile-number').value.trim();
    const messageDiv = document.getElementById('login-message');
    
    // Validate mobile number (10 digits)
    if (!mobile || mobile.length !== 10 || !/^\d+$/.test(mobile)) {
        showLoginMessage('Please enter a valid 10-digit mobile number', 'error');
        return;
    }
    
    // Store user info
    currentUser = {
        mobile: mobile,
        loginTime: new Date().toISOString()
    };
    
    // Save to session storage
    sessionStorage.setItem('posUser', JSON.stringify(currentUser));
    
    // Show success message
    showLoginMessage('Login Successful! Redirecting...', 'success');
    
    // Redirect to POS dashboard
    setTimeout(() => {
        window.location.href = 'pos-dashboard.html';
    }, 1500);
}

function showLoginMessage(message, type) {
    const messageDiv = document.getElementById('login-message');
    messageDiv.textContent = message;
    messageDiv.className = `login-message ${type}`;
}

// Initialize POS Page
function initPOSPage() {
    // Check if user is logged in
    const userData = sessionStorage.getItem('posUser');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    document.getElementById('user-mobile').textContent = currentUser.mobile;
    
    // Load services
    loadServicesFromSheet();
    
    // Setup event listeners
    setupPOSEventListeners();
    
    // Load cart from session
    loadCartFromSession();
}

// Setup POS Event Listeners
function setupPOSEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterServices();
        }, 300);
    });
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        sessionStorage.removeItem('posUser');
        window.location.href = 'index.html';
    });
    
    // Clear cart button
    document.getElementById('clear-cart').addEventListener('click', clearCart);
    
    // Checkout button
    document.getElementById('checkout-btn').addEventListener('click', openCheckoutModal);
    
    // Modal close
    document.querySelector('.close').addEventListener('click', closeCheckoutModal);
    
    // Click outside modal to close
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeCheckoutModal();
            closeBillModal();
        }
    });
    
    // Checkout form submission
    document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
}

// ============================================
// GOOGLE SHEETS INTEGRATION
// ============================================

// Load services from Google Sheets
async function loadServicesFromSheet() {
    try {
        const servicesGrid = document.getElementById('services-grid');
        servicesGrid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading services...</div>';
        
        if (CONFIG.demoMode) {
            // Load demo data
            setTimeout(() => {
                loadDemoServices();
            }, 1000);
            return;
        }
        
        // Fetch from Google Sheets
        const response = await fetch(CONFIG.servicesSheet.apiUrl);
        const data = await response.json();
        
        // Parse data based on your sheet structure
        // Assuming columns: Service ID, Name, Price, SKU, Image URL, Discount, Category
        services = data.map(row => ({
            id: row[0],
            name: row[1],
            price: parseFloat(row[2]),
            sku: row[3],
            imageUrl: row[4] || 'assets/images/default-service.jpg',
            discount: parseInt(row[5]) || 0,
            category: row[6] || getCategoryFromName(row[1])
        }));
        
        renderCategories();
        renderServices();
        showToast('Services loaded successfully!');
        
    } catch (error) {
        console.error('Error loading services:', error);
        loadDemoServices();
    }
}

// Demo services data with high-quality Unsplash images
function loadDemoServices() {
    services = [
        { id: 101, name: 'Premium Hair Cut', price: 499, sku: 'HC001', imageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400', discount: 10, category: 'hair' },
        { id: 102, name: 'Beard Styling', price: 199, sku: 'BT001', imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400', discount: 0, category: 'beard' },
        { id: 103, name: 'Hair Spa Treatment', price: 999, sku: 'HS001', imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400', discount: 15, category: 'spa' },
        { id: 104, name: 'Gold Facial', price: 1499, sku: 'FC001', imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400', discount: 20, category: 'skin' },
        { id: 105, name: 'Hair Color', price: 1999, sku: 'HC002', imageUrl: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400', discount: 10, category: 'hair' },
        { id: 106, name: 'Manicure', price: 399, sku: 'MN001', imageUrl: 'https://images.unsplash.com/photo-1610992015732-2449b0bb0a86?w=400', discount: 5, category: 'skin' },
        { id: 107, name: 'Pedicure', price: 499, sku: 'PD001', imageUrl: 'https://images.unsplash.com/photo-1519010470956-6d877008eaa4?w=400', discount: 5, category: 'skin' },
        { id: 108, name: 'Facial Cleanup', price: 299, sku: 'CL001', imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400', discount: 0, category: 'skin' },
        { id: 109, name: 'Aroma Massage', price: 1499, sku: 'MS001', imageUrl: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400', discount: 10, category: 'spa' },
        { id: 110, name: 'Threading', price: 99, sku: 'TH001', imageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400', discount: 0, category: 'skin' },
        { id: 111, name: 'Waxing', price: 399, sku: 'WX001', imageUrl: 'https://images.unsplash.com/photo-1515685251707-27c47aacb84a?w=400', discount: 10, category: 'skin' },
        { id: 112, name: 'Bridal Makeup', price: 4999, sku: 'BM001', imageUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400', discount: 15, category: 'skin' }
    ];
    
    renderCategories();
    renderServices();
    showToast('Using demo services - Connect Google Sheets for live data');
}

// Determine category based on service name
function getCategoryFromName(name) {
    name = name.toLowerCase();
    if (name.includes('hair') && !name.includes('beard')) return 'hair';
    if (name.includes('beard') || name.includes('trim') || name.includes('shave')) return 'beard';
    if (name.includes('facial') || name.includes('cleanup') || name.includes('manicure') || 
        name.includes('pedicure') || name.includes('thread') || name.includes('wax') || 
        name.includes('makeup')) return 'skin';
    if (name.includes('spa') || name.includes('massage')) return 'spa';
    return 'hair';
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

// Render category tabs
function renderCategories() {
    const categories = ['all', ...new Set(services.map(s => s.category))];
    const categoryNames = {
        'all': 'All Services',
        'hair': 'Hair',
        'beard': 'Beard',
        'skin': 'Skin',
        'spa': 'Spa'
    };
    
    const tabsContainer = document.getElementById('category-tabs');
    tabsContainer.innerHTML = categories.map(cat => `
        <button class="category-btn ${cat === currentCategory ? 'active' : ''}" 
                onclick="filterByCategory('${cat}')">
            ${categoryNames[cat] || cat}
        </button>
    `).join('');
}

// Filter by category
function filterByCategory(category) {
    currentCategory = category;
    renderCategories();
    filterServices();
}

// Filter services by category and search
function filterServices() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    const filtered = services.filter(service => {
        const matchesCategory = currentCategory === 'all' || service.category === currentCategory;
        const matchesSearch = service.name.toLowerCase().includes(searchTerm) ||
                             service.sku.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesSearch;
    });
    
    renderServices(filtered);
}

// Render services grid
function renderServices(servicesToRender = null) {
    const grid = document.getElementById('services-grid');
    const servicesList = servicesToRender || services.filter(s => 
        currentCategory === 'all' || s.category === currentCategory
    );
    
    if (servicesList.length === 0) {
        grid.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-search"></i>
                <p>No services found</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = servicesList.map(service => `
        <div class="service-card" onclick="addToCart(${service.id})">
            <img src="${service.imageUrl}" alt="${service.name}" class="service-image" 
                 onerror="this.src='assets/images/default-service.jpg'">
            <div class="service-info">
                <div class="service-name">${service.name}</div>
                <div class="service-price">₹${service.price}</div>
            </div>
            ${service.discount > 0 ? `<span class="discount-badge">${service.discount}% OFF</span>` : ''}
        </div>
    `).join('');
}

// ============================================
// CART FUNCTIONS
// ============================================

// Add to cart
function addToCart(serviceId) {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    // Check if already in cart
    const existingItem = cart.find(item => item.id === serviceId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: service.id,
            name: service.name,
            price: service.price,
            discount: service.discount,
            quantity: 1,
            sku: service.sku
        });
    }
    
    renderCart();
    saveCartToSession();
    showToast(`${service.name} added to cart!`);
    
    // Enable checkout button
    document.getElementById('checkout-btn').disabled = false;
}

// Update quantity
function updateQuantity(index, change) {
    if (cart[index].quantity + change > 0) {
        cart[index].quantity += change;
    } else {
        removeFromCart(index);
        return;
    }
    
    renderCart();
    saveCartToSession();
}

// Remove from cart
function removeFromCart(index) {
    const removedItem = cart[index];
    cart.splice(index, 1);
    renderCart();
    saveCartToSession();
    showToast(`${removedItem.name} removed from cart`);
    
    // Disable checkout if cart is empty
    if (cart.length === 0) {
        document.getElementById('checkout-btn').disabled = true;
    }
}

// Clear entire cart
function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('Clear all items from cart?')) {
        cart = [];
        renderCart();
        saveCartToSession();
        document.getElementById('checkout-btn').disabled = true;
        showToast('Cart cleared');
    }
}

// Calculate totals with discounts
function calculateTotals() {
    let subtotal = 0;
    let totalDiscount = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        if (item.discount > 0) {
            totalDiscount += (itemTotal * item.discount / 100);
        }
    });
    
    const total = subtotal - totalDiscount;
    
    return { subtotal, totalDiscount, total };
}

// Render cart
function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    const { subtotal, totalDiscount, total } = calculateTotals();
    
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-box-open"></i>
                <p>No services added yet</p>
            </div>
        `;
    } else {
        cartContainer.innerHTML = cart.map((item, index) => {
            const itemTotal = item.price * item.quantity;
            const discountAmount = item.discount > 0 ? (itemTotal * item.discount / 100) : 0;
            const finalPrice = itemTotal - discountAmount;
            
            return `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <div class="cart-item-details">
                            <span class="item-price">₹${item.price}</span>
                            ${item.discount > 0 ? `<span class="item-discount">-${item.discount}%</span>` : ''}
                        </div>
                    </div>
                    <div class="item-quantity">
                        <button class="qty-btn" onclick="updateQuantity(${index}, -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${index}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <span class="remove-item" onclick="removeFromCart(${index})">
                        <i class="fas fa-trash-alt"></i>
                    </span>
                </div>
            `;
        }).join('');
    }
    
    // Update summary
    document.getElementById('subtotal').textContent = `₹${subtotal}`;
    document.getElementById('discount-amount').textContent = `-₹${totalDiscount}`;
    document.getElementById('total-amount').textContent = `₹${total}`;
}

// Save cart to session storage
function saveCartToSession() {
    sessionStorage.setItem('posCart', JSON.stringify(cart));
}

// Load cart from session storage
function loadCartFromSession() {
    const savedCart = sessionStorage.getItem('posCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        renderCart();
        if (cart.length > 0) {
            document.getElementById('checkout-btn').disabled = false;
        }
    }
}

// ============================================
// CHECKOUT FUNCTIONS
// ============================================

// Open checkout modal
function openCheckoutModal() {
    if (cart.length === 0) {
        showToast('Please add services to cart first');
        return;
    }
    
    // Populate order summary
    const orderItemsList = document.getElementById('order-items-list');
    const { subtotal, totalDiscount, total } = calculateTotals();
    
    orderItemsList.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        const discountAmount = item.discount > 0 ? (itemTotal * item.discount / 100) : 0;
        const finalPrice = itemTotal - discountAmount;
        
        return `
            <div class="order-item">
                <span>${item.name} x${item.quantity}</span>
                <span>₹${finalPrice}</span>
            </div>
        `;
    }).join('');
    
    // Update modal totals
    document.getElementById('modal-subtotal').textContent = `₹${subtotal}`;
    document.getElementById('modal-discount').textContent = `-₹${totalDiscount}`;
    document.getElementById('modal-total').textContent = `₹${total}`;
    
    document.getElementById('checkout-modal').style.display = 'block';
}

// Close checkout modal
function closeCheckoutModal() {
    document.getElementById('checkout-modal').style.display = 'none';
    document.getElementById('checkout-form').reset();
}

// Close bill modal
function closeBillModal() {
    document.getElementById('bill-modal').style.display = 'none';
}

// Handle checkout form submission
async function handleCheckout(event) {
    event.preventDefault();
    
    // Get form data
    const formData = {
        customerName: document.getElementById('customer-name').value.trim(),
        phoneNumber: document.getElementById('customer-phone').value.trim(),
        staffName: document.getElementById('staff-name').value,
        paymentMethod: document.getElementById('payment-method').value
    };
    
    // Validate
    if (!formData.customerName || !formData.phoneNumber || !formData.staffName || !formData.paymentMethod) {
        showToast('Please fill in all required fields');
        return;
    }
    
    if (formData.phoneNumber.length !== 10 || !/^\d+$/.test(formData.phoneNumber)) {
        showToast('Please enter a valid 10-digit phone number');
        return;
    }
    
    // Calculate totals
    const { subtotal, totalDiscount, total } = calculateTotals();
    
    // Prepare order data
    const orderData = {
        id: 'ORD' + Date.now(),
        timestamp: new Date().toISOString(),
        customer: formData,
        items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            total: (item.price * item.quantity) * (1 - item.discount/100)
        })),
        staff: formData.staffName,
        paymentMethod: formData.paymentMethod,
        subtotal: subtotal,
        discount: totalDiscount,
        total: total,
        user: currentUser.mobile
    };
    
    // Show loading
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;
    
    try {
        if (!CONFIG.demoMode) {
            // Send to Google Sheets
            await fetch(CONFIG.ordersSheet.apiUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });
        }
        
        // Save to local storage for demo
        saveOrderToLocal(orderData);
        
        // Show success
        showToast('Booking confirmed!');
        
        // Close checkout modal
        closeCheckoutModal();
        
        // Show bill
        showBill(orderData);
        
        // Clear cart
        cart = [];
        renderCart();
        sessionStorage.removeItem('posCart');
        document.getElementById('checkout-btn').disabled = true;
        
    } catch (error) {
        console.error('Checkout error:', error);
        showToast('Error processing booking. Please try again.');
    } finally {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Save order to local storage (for demo)
function saveOrderToLocal(orderData) {
    let orders = JSON.parse(localStorage.getItem('salonOrders') || '[]');
    orders.push(orderData);
    localStorage.setItem('salonOrders', JSON.stringify(orders));
}

// Show bill
function showBill(orderData) {
    const billDetails = document.getElementById('bill-details');
    
    const date = new Date(orderData.timestamp);
    const formattedDate = date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    billDetails.innerHTML = `
        <div class="bill-header">
            <h3>Unisex Salon</h3>
            <p>Bill Receipt</p>
            <small>${formattedDate}</small>
        </div>
        
        <div class="bill-info">
            <p><strong>Customer:</strong> ${orderData.customer.customerName}</p>
            <p><strong>Phone:</strong> ${orderData.customer.phoneNumber}</p>
            <p><strong>Staff:</strong> ${orderData.staff}</p>
            <p><strong>Payment:</strong> ${orderData.paymentMethod}</p>
        </div>
        
        <div class="bill-items">
            ${orderData.items.map(item => `
                <div class="bill-item">
                    <span>${item.name} x${item.quantity}</span>
                    <span>₹${item.total.toFixed(0)}</span>
                </div>
            `).join('')}
        </div>
        
        <div class="bill-total">
            <p>Subtotal: ₹${orderData.subtotal}</p>
            <p>Discount: -₹${orderData.discount}</p>
            <p><strong>Total: ₹${orderData.total}</strong></p>
        </div>
    `;
    
    document.getElementById('bill-modal').style.display = 'block';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Make functions globally available
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.filterByCategory = filterByCategory;
window.closeCheckoutModal = closeCheckoutModal;
window.closeBillModal = closeBillModal;