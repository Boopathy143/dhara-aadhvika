#!/usr/bin/env python3
"""
Comprehensive backend test for DHARA AADHVIKA ecommerce platform
Tests all endpoints including new profile, addresses, forgot/reset, admin features
"""
import requests
import json
import sys

BASE_URL = "https://nextgen-retail-hub.preview.emergentagent.com/api"

# Test results tracking
passed = 0
failed = 0
test_results = []

def log_test(name, success, message=""):
    global passed, failed
    if success:
        passed += 1
        print(f"✅ PASS: {name}")
        test_results.append({"test": name, "status": "PASS", "message": message})
    else:
        failed += 1
        print(f"❌ FAIL: {name} - {message}")
        test_results.append({"test": name, "status": "FAIL", "message": message})

def test_seed_check():
    """Test 1: SEED CHECK - verify 24 products, 12 categories, 4 brands"""
    print("\n=== TEST 1: SEED CHECK ===")
    
    # Test products count
    try:
        r = requests.get(f"{BASE_URL}/products")
        data = r.json()
        total = data.get('total', 0)
        if total == 24:
            log_test("Products count = 24", True)
        else:
            log_test("Products count = 24", False, f"Got {total} products instead of 24")
    except Exception as e:
        log_test("Products count = 24", False, str(e))
    
    # Test categories count
    try:
        r = requests.get(f"{BASE_URL}/categories")
        data = r.json()
        if isinstance(data, list):
            count = len(data)
        else:
            count = len(data.get('items', []))
        if count == 12:
            log_test("Categories count = 12", True)
        else:
            log_test("Categories count = 12", False, f"Got {count} categories instead of 12")
    except Exception as e:
        log_test("Categories count = 12", False, str(e))
    
    # Test brands count
    try:
        r = requests.get(f"{BASE_URL}/brands")
        data = r.json()
        if isinstance(data, list):
            count = len(data)
        else:
            count = len(data.get('items', []))
        if count == 4:
            log_test("Brands count = 4", True)
        else:
            log_test("Brands count = 4", False, f"Got {count} brands instead of 4")
    except Exception as e:
        log_test("Brands count = 4", False, str(e))
    
    # Test specific products
    try:
        r = requests.get(f"{BASE_URL}/products/p-001")
        data = r.json()
        product = data.get('product', {})
        name = product.get('name', '')
        if 'Palm Sprout' in name or 'Panai Vidai' in name:
            log_test("p-001 is Palm Sprout Powder", True)
        else:
            log_test("p-001 is Palm Sprout Powder", False, f"Got: {name}")
        
        # Check for new fields
        has_ingredients = 'ingredients' in product
        has_benefits = 'benefits' in product
        has_nutrition = 'nutrition' in product
        if has_ingredients and has_benefits and has_nutrition:
            log_test("Product has ingredients/benefits/nutrition fields", True)
        else:
            log_test("Product has ingredients/benefits/nutrition fields", False, 
                    f"Missing fields: ingredients={has_ingredients}, benefits={has_benefits}, nutrition={has_nutrition}")
    except Exception as e:
        log_test("p-001 is Palm Sprout Powder", False, str(e))
    
    try:
        r = requests.get(f"{BASE_URL}/products/p-002")
        data = r.json()
        product = data.get('product', {})
        name = product.get('name', '')
        if 'Moringa' in name:
            log_test("p-002 is Moringa Leaf Powder", True)
        else:
            log_test("p-002 is Moringa Leaf Powder", False, f"Got: {name}")
    except Exception as e:
        log_test("p-002 is Moringa Leaf Powder", False, str(e))

def test_existing_regression():
    """Test 2: EXISTING REGRESSION - products, auth, cart, wishlist"""
    print("\n=== TEST 2: EXISTING REGRESSION ===")
    
    # Product search
    try:
        r = requests.get(f"{BASE_URL}/products?q=moringa")
        data = r.json()
        items = data.get('items', [])
        if len(items) >= 1:
            log_test("Search q=moringa returns results", True)
        else:
            log_test("Search q=moringa returns results", False, "No results found")
    except Exception as e:
        log_test("Search q=moringa returns results", False, str(e))
    
    # Category filter
    try:
        r = requests.get(f"{BASE_URL}/products?category=cold-pressed-oils")
        data = r.json()
        items = data.get('items', [])
        if len(items) >= 3:
            log_test("Category cold-pressed-oils returns ≥3 products", True)
        else:
            log_test("Category cold-pressed-oils returns ≥3 products", False, f"Got {len(items)} products")
    except Exception as e:
        log_test("Category cold-pressed-oils returns ≥3 products", False, str(e))
    
    # Best seller filter
    try:
        r = requests.get(f"{BASE_URL}/products?bestSeller=1")
        data = r.json()
        items = data.get('items', [])
        if len(items) >= 4:
            log_test("bestSeller=1 returns ≥4 products", True)
        else:
            log_test("bestSeller=1 returns ≥4 products", False, f"Got {len(items)} products")
    except Exception as e:
        log_test("bestSeller=1 returns ≥4 products", False, str(e))
    
    # Sort by price ascending
    try:
        r = requests.get(f"{BASE_URL}/products?sort=price_asc&limit=5")
        data = r.json()
        items = data.get('items', [])
        if len(items) >= 2:
            prices = [item.get('price', 0) for item in items]
            is_ascending = all(prices[i] <= prices[i+1] for i in range(len(prices)-1))
            if is_ascending:
                log_test("Sort price_asc works correctly", True)
            else:
                log_test("Sort price_asc works correctly", False, f"Prices not ascending: {prices}")
        else:
            log_test("Sort price_asc works correctly", False, "Not enough products")
    except Exception as e:
        log_test("Sort price_asc works correctly", False, str(e))

def test_auth():
    """Test auth endpoints and return sessions"""
    print("\n=== TEST 3: AUTH ===")
    
    # Create sessions
    admin_session = requests.Session()
    user_session = requests.Session()
    
    # Admin login
    try:
        r = admin_session.post(f"{BASE_URL}/auth/login", 
                              json={"email": "admin@dhara.com", "password": "admin123"})
        if r.status_code == 200:
            data = r.json()
            if data.get('role') == 'admin':
                log_test("Admin login successful", True)
            else:
                log_test("Admin login successful", False, f"Role is {data.get('role')}")
        else:
            log_test("Admin login successful", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("Admin login successful", False, str(e))
    
    # User login
    try:
        r = user_session.post(f"{BASE_URL}/auth/login", 
                             json={"email": "user@dhara.com", "password": "user123"})
        if r.status_code == 200:
            data = r.json()
            if data.get('role') == 'user':
                log_test("User login successful", True)
            else:
                log_test("User login successful", False, f"Role is {data.get('role')}")
        else:
            log_test("User login successful", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("User login successful", False, str(e))
    
    # Test /auth/me
    try:
        r = user_session.get(f"{BASE_URL}/auth/me")
        data = r.json()
        user = data.get('user')
        if user and user.get('email') == 'user@dhara.com':
            log_test("GET /auth/me returns user", True)
        else:
            log_test("GET /auth/me returns user", False, f"Got: {user}")
    except Exception as e:
        log_test("GET /auth/me returns user", False, str(e))
    
    return admin_session, user_session

def test_admin_stats(admin_session):
    """Test admin stats endpoint"""
    print("\n=== TEST 4: ADMIN STATS ===")
    
    try:
        r = admin_session.get(f"{BASE_URL}/admin/stats")
        if r.status_code == 200:
            data = r.json()
            required_fields = ['revenue', 'orders', 'products', 'users', 'byStatus', 'days']
            missing = [f for f in required_fields if f not in data]
            if not missing:
                log_test("Admin stats has all required fields", True)
                
                # Check days array
                days = data.get('days', [])
                if len(days) == 7:
                    log_test("Stats days array has 7 entries", True)
                    
                    # Check each day has required fields
                    if all('date' in d and 'revenue' in d and 'orders' in d for d in days):
                        log_test("Each day entry has date/revenue/orders", True)
                    else:
                        log_test("Each day entry has date/revenue/orders", False, "Missing fields in days")
                else:
                    log_test("Stats days array has 7 entries", False, f"Got {len(days)} entries")
            else:
                log_test("Admin stats has all required fields", False, f"Missing: {missing}")
        else:
            log_test("Admin stats returns 200", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("Admin stats endpoint", False, str(e))

def test_cart_wishlist(user_session):
    """Test cart and wishlist"""
    print("\n=== TEST 5: CART & WISHLIST ===")
    
    # Add to cart
    try:
        r = user_session.post(f"{BASE_URL}/cart/add", json={"productId": "p-001", "qty": 2})
        if r.status_code == 200:
            log_test("Add to cart works", True)
        else:
            log_test("Add to cart works", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("Add to cart works", False, str(e))
    
    # Get cart
    try:
        r = user_session.get(f"{BASE_URL}/cart")
        data = r.json()
        if 'items' in data and 'subtotal' in data and 'tax' in data and 'shipping' in data:
            log_test("GET cart returns items/subtotal/tax/shipping", True)
        else:
            log_test("GET cart returns items/subtotal/tax/shipping", False, f"Missing fields")
    except Exception as e:
        log_test("GET cart returns items/subtotal/tax/shipping", False, str(e))
    
    # Update cart
    try:
        r = user_session.post(f"{BASE_URL}/cart/update", json={"productId": "p-001", "qty": 1})
        if r.status_code == 200:
            log_test("Update cart works", True)
        else:
            log_test("Update cart works", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("Update cart works", False, str(e))
    
    # Remove from cart
    try:
        r = user_session.post(f"{BASE_URL}/cart/remove", json={"productId": "p-001"})
        if r.status_code == 200:
            log_test("Remove from cart works", True)
        else:
            log_test("Remove from cart works", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("Remove from cart works", False, str(e))
    
    # Wishlist toggle
    try:
        r = user_session.post(f"{BASE_URL}/wishlist/toggle", json={"productId": "p-002"})
        if r.status_code == 200:
            data = r.json()
            if 'added' in data:
                log_test("Wishlist toggle works", True)
            else:
                log_test("Wishlist toggle works", False, "No 'added' field")
        else:
            log_test("Wishlist toggle works", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("Wishlist toggle works", False, str(e))

def test_profile(user_session):
    """Test 3a: Profile update and password change"""
    print("\n=== TEST 6: PROFILE UPDATE & PASSWORD CHANGE ===")
    
    # Update profile name
    try:
        r = user_session.put(f"{BASE_URL}/profile", json={"name": "New Test Name"})
        if r.status_code == 200:
            log_test("PUT /profile updates name", True)
            
            # Verify name changed
            r2 = user_session.get(f"{BASE_URL}/auth/me")
            data = r2.json()
            user = data.get('user', {})
            if user.get('name') == 'New Test Name':
                log_test("Profile name reflected in /auth/me", True)
            else:
                log_test("Profile name reflected in /auth/me", False, f"Got: {user.get('name')}")
        else:
            log_test("PUT /profile updates name", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("PUT /profile updates name", False, str(e))
    
    # Change password
    try:
        r = user_session.post(f"{BASE_URL}/profile/password", 
                             json={"oldPassword": "user123", "newPassword": "newpass1"})
        if r.status_code == 200:
            log_test("POST /profile/password changes password", True)
            
            # Try login with old password (should fail)
            test_session = requests.Session()
            r2 = test_session.post(f"{BASE_URL}/auth/login", 
                                  json={"email": "user@dhara.com", "password": "user123"})
            if r2.status_code == 401:
                log_test("Old password login fails after change", True)
            else:
                log_test("Old password login fails after change", False, f"Status {r2.status_code}")
            
            # Try login with new password (should work)
            r3 = test_session.post(f"{BASE_URL}/auth/login", 
                                  json={"email": "user@dhara.com", "password": "newpass1"})
            if r3.status_code == 200:
                log_test("New password login works", True)
                
                # Reset password back to user123
                r4 = test_session.post(f"{BASE_URL}/profile/password", 
                                      json={"oldPassword": "newpass1", "newPassword": "user123"})
                if r4.status_code == 200:
                    log_test("Password reset back to user123", True)
                else:
                    log_test("Password reset back to user123", False, f"Status {r4.status_code}")
            else:
                log_test("New password login works", False, f"Status {r3.status_code}")
        else:
            log_test("POST /profile/password changes password", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("Password change flow", False, str(e))

def test_addresses(user_session):
    """Test 3b: Addresses CRUD"""
    print("\n=== TEST 7: ADDRESSES CRUD ===")
    
    # Get addresses (should be empty initially)
    try:
        r = user_session.get(f"{BASE_URL}/addresses")
        data = r.json()
        if 'items' in data:
            log_test("GET /addresses returns items array", True)
        else:
            log_test("GET /addresses returns items array", False, f"Got: {data}")
    except Exception as e:
        log_test("GET /addresses returns items array", False, str(e))
    
    # Create address
    address_id = None
    try:
        r = user_session.post(f"{BASE_URL}/addresses", json={
            "name": "Test User",
            "phone": "9876543210",
            "line1": "123 Test Street",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001"
        })
        if r.status_code == 200:
            data = r.json()
            if 'id' in data:
                address_id = data['id']
                log_test("POST /addresses creates address", True)
            else:
                log_test("POST /addresses creates address", False, "No id in response")
        else:
            log_test("POST /addresses creates address", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("POST /addresses creates address", False, str(e))
    
    # Get addresses again (should have 1 item)
    try:
        r = user_session.get(f"{BASE_URL}/addresses")
        data = r.json()
        items = data.get('items', [])
        if len(items) >= 1:
            log_test("GET /addresses shows created address", True)
        else:
            log_test("GET /addresses shows created address", False, f"Got {len(items)} items")
    except Exception as e:
        log_test("GET /addresses shows created address", False, str(e))
    
    # Delete address
    if address_id:
        try:
            r = user_session.delete(f"{BASE_URL}/addresses/{address_id}")
            if r.status_code == 200:
                log_test("DELETE /addresses/:id works", True)
                
                # Verify deleted
                r2 = user_session.get(f"{BASE_URL}/addresses")
                data = r2.json()
                items = data.get('items', [])
                if not any(item.get('id') == address_id for item in items):
                    log_test("Address deleted successfully", True)
                else:
                    log_test("Address deleted successfully", False, "Address still exists")
            else:
                log_test("DELETE /addresses/:id works", False, f"Status {r.status_code}")
        except Exception as e:
            log_test("DELETE /addresses/:id works", False, str(e))

def test_forgot_reset():
    """Test 3c: Forgot/Reset password"""
    print("\n=== TEST 8: FORGOT/RESET PASSWORD ===")
    
    # Forgot password
    dev_token = None
    try:
        r = requests.post(f"{BASE_URL}/auth/forgot", json={"email": "user@dhara.com"})
        if r.status_code == 200:
            data = r.json()
            if 'devToken' in data:
                dev_token = data['devToken']
                log_test("POST /auth/forgot returns devToken", True)
            else:
                log_test("POST /auth/forgot returns devToken", False, "No devToken in response")
        else:
            log_test("POST /auth/forgot returns devToken", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("POST /auth/forgot returns devToken", False, str(e))
    
    # Try reset with invalid token
    try:
        r = requests.post(f"{BASE_URL}/auth/reset", json={"token": "INVALID", "password": "x"})
        if r.status_code == 401:
            log_test("POST /auth/reset with invalid token returns 401", True)
        else:
            log_test("POST /auth/reset with invalid token returns 401", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("POST /auth/reset with invalid token returns 401", False, str(e))
    
    # Reset with valid token
    if dev_token:
        try:
            r = requests.post(f"{BASE_URL}/auth/reset", json={"token": dev_token, "password": "restored1"})
            if r.status_code == 200:
                log_test("POST /auth/reset with valid token works", True)
                
                # Try login with new password
                test_session = requests.Session()
                r2 = test_session.post(f"{BASE_URL}/auth/login", 
                                      json={"email": "user@dhara.com", "password": "restored1"})
                if r2.status_code == 200:
                    log_test("Login with reset password works", True)
                    
                    # Reset back to user123
                    r3 = requests.post(f"{BASE_URL}/auth/forgot", json={"email": "user@dhara.com"})
                    if r3.status_code == 200:
                        token2 = r3.json().get('devToken')
                        r4 = requests.post(f"{BASE_URL}/auth/reset", 
                                          json={"token": token2, "password": "user123"})
                        if r4.status_code == 200:
                            log_test("Password reset back to user123", True)
                        else:
                            log_test("Password reset back to user123", False, f"Status {r4.status_code}")
                else:
                    log_test("Login with reset password works", False, f"Status {r2.status_code}")
            else:
                log_test("POST /auth/reset with valid token works", False, f"Status {r.status_code}")
        except Exception as e:
            log_test("Reset password flow", False, str(e))

def test_admin_coupons(admin_session):
    """Test 3d: Admin coupons CRUD"""
    print("\n=== TEST 9: ADMIN COUPONS ===")
    
    # Get coupons
    try:
        r = admin_session.get(f"{BASE_URL}/admin/coupons")
        if r.status_code == 200:
            data = r.json()
            items = data.get('items', [])
            codes = [c.get('code') for c in items]
            if 'DHARA10' in codes and 'PURE500' in codes and 'NEWLEAF' in codes:
                log_test("GET /admin/coupons contains seed coupons", True)
            else:
                log_test("GET /admin/coupons contains seed coupons", False, f"Got codes: {codes}")
        else:
            log_test("GET /admin/coupons works", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("GET /admin/coupons works", False, str(e))
    
    # Create coupon
    coupon_id = None
    try:
        r = admin_session.post(f"{BASE_URL}/admin/coupons", json={
            "code": "testcp",
            "discountPct": 5,
            "minOrder": 0,
            "description": "test coupon"
        })
        if r.status_code == 200:
            data = r.json()
            if data.get('code') == 'TESTCP':  # Should be uppercased
                coupon_id = data.get('id')
                log_test("POST /admin/coupons creates coupon (code uppercased)", True)
            else:
                log_test("POST /admin/coupons creates coupon (code uppercased)", False, 
                        f"Code is {data.get('code')}")
        else:
            log_test("POST /admin/coupons creates coupon", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("POST /admin/coupons creates coupon", False, str(e))
    
    # Delete coupon
    if coupon_id:
        try:
            r = admin_session.delete(f"{BASE_URL}/admin/coupons/{coupon_id}")
            if r.status_code == 200:
                log_test("DELETE /admin/coupons/:id works", True)
            else:
                log_test("DELETE /admin/coupons/:id works", False, f"Status {r.status_code}")
        except Exception as e:
            log_test("DELETE /admin/coupons/:id works", False, str(e))

def test_admin_reviews_users(admin_session, user_session):
    """Test 3e: Admin reviews & users"""
    print("\n=== TEST 10: ADMIN REVIEWS & USERS ===")
    
    # Create a review as user
    review_id = None
    try:
        r = user_session.post(f"{BASE_URL}/reviews", json={
            "productId": "p-001",
            "rating": 5,
            "comment": "Great product!"
        })
        if r.status_code == 200:
            data = r.json()
            review_id = data.get('id')
            log_test("POST /reviews creates review", True)
        else:
            log_test("POST /reviews creates review", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("POST /reviews creates review", False, str(e))
    
    # Get reviews as admin
    try:
        r = admin_session.get(f"{BASE_URL}/admin/reviews")
        if r.status_code == 200:
            data = r.json()
            items = data.get('items', [])
            if any(item.get('id') == review_id for item in items):
                log_test("GET /admin/reviews shows created review", True)
            else:
                log_test("GET /admin/reviews shows created review", False, "Review not found")
        else:
            log_test("GET /admin/reviews works", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("GET /admin/reviews works", False, str(e))
    
    # Delete review
    if review_id:
        try:
            r = admin_session.delete(f"{BASE_URL}/admin/reviews/{review_id}")
            if r.status_code == 200:
                log_test("DELETE /admin/reviews/:id works", True)
            else:
                log_test("DELETE /admin/reviews/:id works", False, f"Status {r.status_code}")
        except Exception as e:
            log_test("DELETE /admin/reviews/:id works", False, str(e))
    
    # Get users
    try:
        r = admin_session.get(f"{BASE_URL}/admin/users")
        if r.status_code == 200:
            data = r.json()
            items = data.get('items', [])
            emails = [u.get('email') for u in items]
            if 'admin@dhara.com' in emails and 'user@dhara.com' in emails:
                log_test("GET /admin/users contains both users", True)
                
                # Check no password field
                if not any('password' in u for u in items):
                    log_test("GET /admin/users excludes password field", True)
                else:
                    log_test("GET /admin/users excludes password field", False, "Password field present")
            else:
                log_test("GET /admin/users contains both users", False, f"Got emails: {emails}")
        else:
            log_test("GET /admin/users works", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("GET /admin/users works", False, str(e))

def test_order_cancel_reorder(user_session):
    """Test 3f: Order cancel + reorder"""
    print("\n=== TEST 11: ORDER CANCEL & REORDER ===")
    
    # Add product to cart
    try:
        user_session.post(f"{BASE_URL}/cart/add", json={"productId": "p-005", "qty": 1})
    except:
        pass
    
    # Create order
    order_id = None
    try:
        r = user_session.post(f"{BASE_URL}/orders", json={
            "address": {
                "name": "Test",
                "phone": "9876543210",
                "line1": "Test St",
                "city": "Mumbai",
                "state": "MH",
                "pincode": "400001"
            },
            "paymentMethod": "COD"
        })
        if r.status_code == 200:
            data = r.json()
            order_id = data.get('id')
            log_test("Create order for cancel test", True)
        else:
            log_test("Create order for cancel test", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("Create order for cancel test", False, str(e))
    
    # Cancel order
    if order_id:
        try:
            r = user_session.post(f"{BASE_URL}/orders/{order_id}/cancel")
            if r.status_code == 200:
                log_test("POST /orders/:id/cancel works", True)
                
                # Verify status is cancelled
                r2 = user_session.get(f"{BASE_URL}/orders/{order_id}")
                data = r2.json()
                if data.get('status') == 'cancelled':
                    log_test("Order status is cancelled", True)
                else:
                    log_test("Order status is cancelled", False, f"Status is {data.get('status')}")
                
                # Try to cancel again (should fail)
                r3 = user_session.post(f"{BASE_URL}/orders/{order_id}/cancel")
                if r3.status_code == 400:
                    log_test("Cannot cancel already cancelled order", True)
                else:
                    log_test("Cannot cancel already cancelled order", False, f"Status {r3.status_code}")
            else:
                log_test("POST /orders/:id/cancel works", False, f"Status {r.status_code}")
        except Exception as e:
            log_test("Order cancel flow", False, str(e))
    
    # Create another order for reorder test
    order_id2 = None
    try:
        user_session.post(f"{BASE_URL}/cart/add", json={"productId": "p-003", "qty": 2})
        r = user_session.post(f"{BASE_URL}/orders", json={
            "address": {
                "name": "Test",
                "phone": "9876543210",
                "line1": "Test St",
                "city": "Mumbai",
                "state": "MH",
                "pincode": "400001"
            },
            "paymentMethod": "COD"
        })
        if r.status_code == 200:
            order_id2 = r.json().get('id')
            log_test("Create order for reorder test", True)
        else:
            log_test("Create order for reorder test", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("Create order for reorder test", False, str(e))
    
    # Reorder
    if order_id2:
        try:
            r = user_session.post(f"{BASE_URL}/orders/{order_id2}/reorder")
            if r.status_code == 200:
                log_test("POST /orders/:id/reorder works", True)
                
                # Check cart has items
                r2 = user_session.get(f"{BASE_URL}/cart")
                data = r2.json()
                items = data.get('items', [])
                if len(items) > 0:
                    log_test("Reorder adds items to cart", True)
                else:
                    log_test("Reorder adds items to cart", False, "Cart is empty")
            else:
                log_test("POST /orders/:id/reorder works", False, f"Status {r.status_code}")
        except Exception as e:
            log_test("Reorder flow", False, str(e))

def test_contact_newsletter():
    """Test 3g: Contact + newsletter"""
    print("\n=== TEST 12: CONTACT & NEWSLETTER ===")
    
    # Contact form
    try:
        r = requests.post(f"{BASE_URL}/contact", json={
            "name": "Test User",
            "email": "test@example.com",
            "message": "Test message"
        })
        if r.status_code == 200:
            log_test("POST /contact works", True)
        else:
            log_test("POST /contact works", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("POST /contact works", False, str(e))
    
    # Newsletter signup
    try:
        r = requests.post(f"{BASE_URL}/newsletter", json={"email": "sub@example.com"})
        if r.status_code == 200:
            log_test("POST /newsletter works", True)
            
            # Try again (should also work - upsert)
            r2 = requests.post(f"{BASE_URL}/newsletter", json={"email": "sub@example.com"})
            if r2.status_code == 200:
                log_test("POST /newsletter upsert works", True)
            else:
                log_test("POST /newsletter upsert works", False, f"Status {r2.status_code}")
        else:
            log_test("POST /newsletter works", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("POST /newsletter works", False, str(e))
    
    # Newsletter without email (should fail)
    try:
        r = requests.post(f"{BASE_URL}/newsletter", json={})
        if r.status_code == 400:
            log_test("POST /newsletter without email returns 400", True)
        else:
            log_test("POST /newsletter without email returns 400", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("POST /newsletter without email returns 400", False, str(e))

def test_coupon_validation():
    """Test 4: Coupon validation"""
    print("\n=== TEST 13: COUPON VALIDATION ===")
    
    # DHARA10 - 10% off, no min
    try:
        r = requests.post(f"{BASE_URL}/coupons/validate", json={"code": "DHARA10", "subtotal": 100})
        if r.status_code == 200:
            data = r.json()
            if data.get('discount') == 10:
                log_test("DHARA10 gives 10% discount", True)
            else:
                log_test("DHARA10 gives 10% discount", False, f"Discount is {data.get('discount')}")
        else:
            log_test("DHARA10 validation works", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("DHARA10 validation works", False, str(e))
    
    # PURE500 - ₹500 off, min ₹2500 (should fail with ₹1000)
    try:
        r = requests.post(f"{BASE_URL}/coupons/validate", json={"code": "PURE500", "subtotal": 1000})
        if r.status_code == 400:
            log_test("PURE500 fails with subtotal < min order", True)
        else:
            log_test("PURE500 fails with subtotal < min order", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("PURE500 fails with subtotal < min order", False, str(e))
    
    # PURE500 with ₹3000 (should work)
    try:
        r = requests.post(f"{BASE_URL}/coupons/validate", json={"code": "PURE500", "subtotal": 3000})
        if r.status_code == 200:
            data = r.json()
            if data.get('discount') == 500:
                log_test("PURE500 gives ₹500 discount", True)
            else:
                log_test("PURE500 gives ₹500 discount", False, f"Discount is {data.get('discount')}")
        else:
            log_test("PURE500 validation works", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("PURE500 validation works", False, str(e))
    
    # NEWLEAF - 15% off, min ₹1000
    try:
        r = requests.post(f"{BASE_URL}/coupons/validate", json={"code": "NEWLEAF", "subtotal": 1500})
        if r.status_code == 200:
            data = r.json()
            expected = round(1500 * 0.15)  # 225
            if data.get('discount') == expected:
                log_test("NEWLEAF gives 15% discount", True)
            else:
                log_test("NEWLEAF gives 15% discount", False, 
                        f"Expected {expected}, got {data.get('discount')}")
        else:
            log_test("NEWLEAF validation works", False, f"Status {r.status_code}")
    except Exception as e:
        log_test("NEWLEAF validation works", False, str(e))

def main():
    print("=" * 80)
    print("DHARA AADHVIKA Backend Test Suite")
    print("=" * 80)
    
    # Run all tests
    test_seed_check()
    test_existing_regression()
    admin_session, user_session = test_auth()
    test_admin_stats(admin_session)
    test_cart_wishlist(user_session)
    test_profile(user_session)
    test_addresses(user_session)
    test_forgot_reset()
    test_admin_coupons(admin_session)
    test_admin_reviews_users(admin_session, user_session)
    test_order_cancel_reorder(user_session)
    test_contact_newsletter()
    test_coupon_validation()
    
    # Print summary
    print("\n" + "=" * 80)
    print(f"TEST SUMMARY: {passed} PASSED, {failed} FAILED")
    print("=" * 80)
    
    # Print failed tests
    if failed > 0:
        print("\nFAILED TESTS:")
        for result in test_results:
            if result['status'] == 'FAIL':
                print(f"  ❌ {result['test']}: {result['message']}")
    
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
