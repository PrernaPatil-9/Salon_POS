// ============================================
// SALON POS SYSTEM - COMPLETE LOGIC
// ============================================

// Global Variables
let services = [];
let cart = [];
let currentCategory = 'all';
let currentUser = null;
let searchTimeout = null;

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
    
    // Debug: Check CONFIG
    console.log('CONFIG:', CONFIG);
    console.log('Demo Mode:', CONFIG.demoMode);
    console.log('Services URL:', CONFIG.servicesSheet?.apiUrl);
    
    // Load services
    loadServicesFromSheet();
    
    // Setup event listeners
    setupPOSEventListeners();
    
    // Load cart from session
    loadCartFromSession();
}

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
        console.log('Fetching from:', CONFIG.servicesSheet.apiUrl);
        const response = await fetch(CONFIG.servicesSheet.apiUrl);
        const result = await response.json();
        console.log('Received data:', result);
        
        if (result.status === 'success' && result.data) {
            // Map the data from Google Sheets to our service format
            services = result.data.map(item => ({
                id: Number(item.id),
                name: String(item.name),
                price: Number(item.price),
                sku: String(item.sku || ''),
                imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400',
                discount: Number(item.discount) || 0,
                category: String(item.category || getCategoryFromName(item.name)).toLowerCase()
            }));
            
            console.log('Mapped services:', services);
            renderCategories();
            renderServices();
            showToast('Services loaded successfully!');
        } else {
            console.error('Error loading services:', result.message);
            loadDemoServices(); // Fallback to demo data
        }
        
    } catch (error) {
        console.error('Error loading services:', error);
        loadDemoServices(); // Fallback to demo data
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

// Replace your existing calculateTotals function with this:

// Calculate totals with discounts
function calculateTotals() {
    let subtotal = 0;
    let totalDiscount = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        // Commented out discount calculation as requested
        // if (item.discount > 0) {
        //     totalDiscount += (itemTotal * item.discount / 100);
        // }
    });
    
    // Since discount is commented out, total equals subtotal
    const total = subtotal; // - totalDiscount;
    
    console.log('Calculating totals:', { subtotal, total }); // Debug log
    
    return { subtotal, totalDiscount, total };
}

// Update the renderCart function to ensure total is displayed correctly
function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    const { subtotal, totalDiscount, total } = calculateTotals();
    
    console.log('Rendering cart with total:', total); // Debug log
    
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
            // Commented out discount display
            // const discountAmount = item.discount > 0 ? (itemTotal * item.discount / 100) : 0;
            // const finalPrice = itemTotal - discountAmount;
            
            return `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <div class="cart-item-details">
                            <span class="item-price">₹${item.price}</span>
                            ${item.quantity > 1 ? `<span class="item-price">x${item.quantity} = ₹${itemTotal}</span>` : ''}
                            <!-- Discount section commented out -->
                            <!-- ${item.discount > 0 ? `<span class="item-discount">-${item.discount}%</span>` : ''} -->
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
    
    // Update summary - ensure values are numbers
    document.getElementById('subtotal').textContent = `₹${Number(subtotal).toFixed(0)}`;
    // document.getElementById('discount-amount').textContent = `-₹${Number(totalDiscount).toFixed(0)}`;
    document.getElementById('total-amount').textContent = `₹${Number(total).toFixed(0)}`;
    
    // Update checkout button state
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }
}

// Add this function to ensure cart updates properly when items are added
function addToCart(serviceId) {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    console.log('Adding to cart:', service); // Debug log
    
    // Check if already in cart
    const existingItem = cart.find(item => item.id === serviceId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: service.id,
            name: service.name,
            price: service.price,
            // discount: service.discount, // Commented out discount
            quantity: 1,
            sku: service.sku
        });
    }
    
    renderCart();
    saveCartToSession();
    showToast(`${service.name} added to cart!`);
}

// Update quantity function
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

// Process payment function with proper total calculation
function processPayment(paymentMethod, amount) {
    // Get customer details from cart section
    const customerName = document.getElementById('cart-customer-name').value.trim();
    const phoneNumber = document.getElementById('cart-customer-phone').value.trim();
    const staffName = document.getElementById('cart-staff-name').value;
    
    // Validate required fields
    if (!customerName) {
        showToast('Please enter customer name');
        return false;
    }
    
    if (!phoneNumber || phoneNumber.length !== 10 || !/^\d+$/.test(phoneNumber)) {
        showToast('Please enter a valid 10-digit phone number');
        return false;
    }
    
    if (!staffName) {
        showToast('Please select staff member');
        return false;
    }
    
    // Calculate totals
    const { subtotal, total } = calculateTotals();
    
    console.log('Processing payment - Total:', total); // Debug log
    
    // Prepare order data
    const orderData = {
        id: 'ORD' + Date.now(),
        timestamp: new Date().toISOString(),
        customer: {
            customerName: customerName,
            phoneNumber: phoneNumber
        },
        items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
        })),
        staff: staffName,
        paymentMethod: paymentMethod,
        subtotal: subtotal,
        total: total,
        user: currentUser.mobile
    };
    
    // Save order
    saveOrderToLocal(orderData);
    
    // Show success
    showToast(`Payment of ₹${total} received via ${paymentMethod}!`);
    
    // Show bill
    showBill(orderData);
    
    // Clear cart
    cart = [];
    renderCart();
    sessionStorage.removeItem('posCart');
    
    // Clear customer fields
    document.getElementById('cart-customer-name').value = '';
    document.getElementById('cart-customer-phone').value = '';
    document.getElementById('cart-staff-name').value = '';
    
    return true;
}

// Checkout button click handler
document.getElementById('checkout-btn').addEventListener('click', function() {
    if (cart.length === 0) {
        showToast('Please add services to cart first');
        return;
    }
    
    // Get selected payment method
    const selectedPayment = document.querySelector('input[name="payment-method"]:checked');
    if (!selectedPayment) {
        showToast('Please select a payment method');
        return;
    }
    
    const paymentMethod = selectedPayment.value;
    const { total } = calculateTotals();
    
    console.log('Checkout - Total amount:', total); // Debug log
    
    if (paymentMethod === 'GPay' || paymentMethod === 'UPI') {
        // Show QR code for UPI/GPay payments
        showQRCode(total);
    } else {
        // Process cash payment directly
        processPayment('Cash', total);
    }
});

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
    console.log('Sending order to:', CONFIG.ordersSheet.apiUrl);
    
    // For Google Apps Script, we need to use POST with the action parameter
    const response = await fetch(CONFIG.googleScriptUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=saveOrder&data=' + encodeURIComponent(JSON.stringify(orderData))
    });
    
    // Try to get response (but it might be opaque with no-cors)
    try {
        const result = await response.json();
        console.log('Order saved:', result);
    } catch (e) {
        console.log('Order sent (response not parsed)');
    }
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




// Add these functions to your existing script.js

// Updated showQRCode function with actual QR generation
function showQRCode(amount) {
    const qrModal = document.getElementById('qr-modal');
    const qrContainer = document.getElementById('qr-code-container');
    const qrAmount = document.getElementById('qr-amount');
    
    qrAmount.textContent = amount;
    
    // Generate UPI payment link
    const upiId = CONFIG.upiId || 'salon@okhdfcbank';
    const upiLink = `upi://pay?pa=${upiId}&pn=Unisex%20Salon&am=${amount}&cu=INR`;
    
    // Clear previous QR code
    qrContainer.innerHTML = '';
    
    // Generate QR code
    QRCode.toCanvas(upiLink, { width: 200 }, function(error, canvas) {
        if (error) {
            console.error('QR generation failed:', error);
            qrContainer.innerHTML = '<p>Error generating QR code</p>';
            return;
        }
        qrContainer.appendChild(canvas);
    });
    
    qrModal.style.display = 'flex';
    
    // Setup close button
    document.querySelector('.close-qr').onclick = function() {
        qrModal.style.display = 'none';
    };
    
    // Setup paid button
    document.getElementById('qr-paid-btn').onclick = function() {
        qrModal.style.display = 'none';
        processPayment('UPI', amount);
    };
    
    // Click outside to close
    window.onclick = function(event) {
        if (event.target === qrModal) {
            qrModal.style.display = 'none';
        }
    };
}

// Process payment function
function processPayment(paymentMethod, amount) {
    // Get customer details from cart section
    const customerName = document.getElementById('cart-customer-name').value.trim();
    const phoneNumber = document.getElementById('cart-customer-phone').value.trim();
    const staffName = document.getElementById('cart-staff-name').value;
    
    // Validate required fields
    if (!customerName) {
        showToast('Please enter customer name');
        return false;
    }
    
    if (!phoneNumber || phoneNumber.length !== 10 || !/^\d+$/.test(phoneNumber)) {
        showToast('Please enter a valid 10-digit phone number');
        return false;
    }
    
    if (!staffName) {
        showToast('Please select staff member');
        return false;
    }
    
    // Calculate totals
    const { subtotal, total } = calculateTotals();
    
    // Prepare order data
    const orderData = {
        id: 'ORD' + Date.now(),
        timestamp: new Date().toISOString(),
        customer: {
            customerName: customerName,
            phoneNumber: phoneNumber
        },
        items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
        })),
        staff: staffName,
        paymentMethod: paymentMethod,
        subtotal: subtotal,
        total: total,
        user: currentUser.mobile
    };
    
    // Save order
    saveOrderToLocal(orderData);
    
    // Show success
    showToast(`Payment of ₹${total} received via ${paymentMethod}!`);
    
    // Show bill
    showBill(orderData);
    
    // Clear cart
    cart = [];
    renderCart();
    sessionStorage.removeItem('posCart');
    document.getElementById('checkout-btn').disabled = true;
    
    // Clear customer fields
    document.getElementById('cart-customer-name').value = '';
    document.getElementById('cart-customer-phone').value = '';
    document.getElementById('cart-staff-name').value = '';
    
    return true;
}

// Override the checkout button click handler
document.getElementById('checkout-btn').addEventListener('click', function() {
    if (cart.length === 0) {
        showToast('Please add services to cart first');
        return;
    }
    
    // Get selected payment method
    const selectedPayment = document.querySelector('input[name="payment-method"]:checked');
    if (!selectedPayment) {
        showToast('Please select a payment method');
        return;
    }
    
    const paymentMethod = selectedPayment.value;
    const { total } = calculateTotals();
    
    if (paymentMethod === 'GPay' || paymentMethod === 'UPI') {
        // Show QR code for UPI/GPay payments
        showQRCode(total);
    } else {
        // Process cash payment directly
        processPayment('Cash', total);
    }
});

// Make functions globally available
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.filterByCategory = filterByCategory;
window.closeCheckoutModal = closeCheckoutModal;
window.closeBillModal = closeBillModal;


