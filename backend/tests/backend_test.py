"""Backend regression tests for Dhara Aadhvika e-commerce app.
Covers: auth login, product CRUD with unit/specs, admin payments, admin returns
with extended statuses, COD order placement, return submission, newsletter.
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://npm-setup-6.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@dhara.com"
ADMIN_PASS = "admin123"
USER_EMAIL = "user@dhara.com"
USER_PASS = "user123"


def _login(session, email, password):
    r = session.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=20)
    assert r.status_code == 200, f"login failed {email}: {r.status_code} {r.text}"
    return r.json()


@pytest.fixture(scope="session")
def admin():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    _login(s, ADMIN_EMAIL, ADMIN_PASS)
    return s


@pytest.fixture(scope="session")
def user():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    _login(s, USER_EMAIL, USER_PASS)
    return s


# ---------- Health / public ----------
class TestPublic:
    def test_products_list(self):
        r = requests.get(f"{API}/products", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data and isinstance(data["items"], list)
        assert len(data["items"]) > 0

    def test_newsletter_subscribe(self):
        r = requests.post(f"{API}/newsletter", json={"email": "TEST_news@example.com"}, timeout=20)
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ---------- Auth ----------
class TestAuth:
    def test_admin_login(self):
        s = requests.Session()
        data = _login(s, ADMIN_EMAIL, ADMIN_PASS)
        # Login returns user obj directly (not nested under "user")
        assert data.get("role") == "admin"

    def test_user_login(self):
        s = requests.Session()
        data = _login(s, USER_EMAIL, USER_PASS)
        assert data.get("email") == USER_EMAIL


# ---------- Product CRUD + unit/spec fields ----------
class TestProductsAdmin:
    created_id = None

    def test_create_product_with_unit_and_specs(self, admin):
        payload = {
            "name": "TEST_Cold Pressed Oil",
            "price": 250,
            "originalPrice": 300,
            "image": "https://example.com/img.jpg",
            "category": "oils",
            "brand": "dhara",
            "stock": 10,
            "weight": "1",
            "unit": "Litre",
            "description": "Test product",
            "ingredients": "Sesame seeds",
            "benefits": "Healthy",
            "usageInstructions": "Use daily",
            "storageInstructions": "Cool dry place",
            "shelfLife": "6 months",
            "manufacturer": "Dhara Aadhvika",
            "countryOfOrigin": "India",
            "fssaiNumber": "12345678901234",
            "nutritionalInformation": "Calories 884",
            "keyFeatures": ["100% pure"],
            "specifications": [{"key": "Type", "value": "Cold Pressed"}],
            "additionalInfo": [{"key": "Note", "value": "Test"}],
        }
        r = admin.post(f"{API}/admin/products", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        doc = r.json()
        assert doc["unit"] == "Litre"
        assert doc["weight"] == "1"
        assert doc["shelfLife"] == "6 months"
        assert doc["manufacturer"] == "Dhara Aadhvika"
        assert doc["fssaiNumber"] == "12345678901234"
        assert doc["ingredients"] == "Sesame seeds"
        assert "id" in doc
        TestProductsAdmin.created_id = doc["id"]

    def test_get_created_product_persisted(self, admin):
        pid = TestProductsAdmin.created_id
        assert pid, "create test did not run"
        r = requests.get(f"{API}/products/{pid}", timeout=20)
        assert r.status_code == 200
        p = r.json()["product"]
        assert p["unit"] == "Litre"
        assert p["shelfLife"] == "6 months"
        assert p["benefits"] == "Healthy"

    def test_update_product_unit(self, admin):
        pid = TestProductsAdmin.created_id
        r = admin.put(f"{API}/admin/products/{pid}", json={"unit": "Kg", "weight": "2"}, timeout=20)
        assert r.status_code == 200
        # Verify persistence
        r2 = requests.get(f"{API}/products/{pid}", timeout=20)
        p = r2.json()["product"]
        assert p["unit"] == "Kg"
        assert p["weight"] == "2"

    def test_delete_product(self, admin):
        pid = TestProductsAdmin.created_id
        r = admin.delete(f"{API}/admin/products/{pid}", timeout=20)
        assert r.status_code == 200
        r2 = requests.get(f"{API}/products/{pid}", timeout=20)
        assert r2.status_code == 404


# ---------- Admin payments endpoint ----------
class TestAdminPayments:
    def test_admin_payments_listing(self, admin):
        r = admin.get(f"{API}/admin/payments", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data
        for it in data["items"]:
            assert it.get("paymentMethod") == "UPI"

    def test_admin_payments_requires_admin(self, user):
        r = user.get(f"{API}/admin/payments", timeout=20)
        assert r.status_code in (401, 403)


# ---------- COD order + Return flow with extended statuses ----------
class TestReturnFlow:
    order_id = None
    product_id = None

    def test_place_cod_order_and_request_return(self, user, admin):
        # Pick a product
        r = requests.get(f"{API}/products", timeout=20)
        prods = r.json()["items"]
        assert prods
        pid = prods[0]["id"]
        TestReturnFlow.product_id = pid

        # Add to cart
        rc = user.post(f"{API}/cart/add", json={"productId": pid, "qty": 1}, timeout=20)
        assert rc.status_code == 200, rc.text

        # Place COD order
        body = {
            "address": {"name": "Test", "phone": "9999999999", "line1": "x", "city": "Erode", "state": "TN", "pincode": "638502"},
            "paymentMethod": "COD",
        }
        ro = user.post(f"{API}/orders", json=body, timeout=30)
        assert ro.status_code == 200, ro.text
        order = ro.json()
        oid = order["id"]
        TestReturnFlow.order_id = oid
        # Order items snapshot must have weight + unit fields (could be empty string)
        assert "weight" in order["items"][0]
        assert "unit" in order["items"][0]

        # Admin marks delivered
        ru = admin.put(f"{API}/admin/orders/{oid}", json={"status": "delivered"}, timeout=20)
        assert ru.status_code == 200

        # Submit return with allowed reason
        rr = user.post(
            f"{API}/orders/{oid}/return/{pid}",
            json={"reason": "Quality Issue", "description": "TEST return", "image": None},
            timeout=20,
        )
        assert rr.status_code == 200, rr.text
        assert rr.json().get("returnRequest", {}).get("status") == "pending"

    def test_admin_returns_list_and_extended_statuses(self, admin):
        r = admin.get(f"{API}/admin/returns", timeout=20)
        assert r.status_code == 200
        items = r.json()["items"]
        match = [x for x in items if x["orderId"] == TestReturnFlow.order_id and x["productId"] == TestReturnFlow.product_id]
        assert match, "submitted return not visible to admin"

        # Cycle through extended statuses
        for st in ["under_review", "approved", "pickup_scheduled", "pickup_completed", "closed"]:
            rp = admin.put(
                f"{API}/admin/returns/{TestReturnFlow.order_id}/{TestReturnFlow.product_id}",
                json={"status": st},
                timeout=20,
            )
            assert rp.status_code == 200, f"status {st} update failed: {rp.text}"

        # Refund + replacement statuses
        rr = admin.put(
            f"{API}/admin/returns/{TestReturnFlow.order_id}/{TestReturnFlow.product_id}",
            json={"refundStatus": "refunded", "replacementStatus": "delivered", "adminNote": "ok"},
            timeout=20,
        )
        assert rr.status_code == 200

        # Verify persisted
        r2 = admin.get(f"{API}/admin/returns", timeout=20)
        m2 = [x for x in r2.json()["items"] if x["orderId"] == TestReturnFlow.order_id and x["productId"] == TestReturnFlow.product_id][0]
        assert m2["status"] == "closed"
        assert m2["refundStatus"] == "refunded"
        assert m2["replacementStatus"] == "delivered"


# ---------- UPI order placement + admin verify/reject ----------
class TestUpiVerification:
    def test_upi_order_and_admin_verify(self, user, admin):
        r = requests.get(f"{API}/products", timeout=20)
        pid = r.json()["items"][0]["id"]
        user.post(f"{API}/cart/add", json={"productId": pid, "qty": 1}, timeout=20)
        body = {
            "address": {"name": "T", "phone": "9", "line1": "x", "city": "Erode", "state": "TN", "pincode": "638502"},
            "paymentMethod": "UPI",
            "paymentDetails": {"transactionId": "TXN_TEST_" + str(int(time.time())), "screenshot": "data:image/png;base64,AAAA"},
        }
        ro = user.post(f"{API}/orders", json=body, timeout=30)
        assert ro.status_code == 200, ro.text
        order = ro.json()
        assert order["status"] == "payment_verification_pending"
        oid = order["id"]

        # Admin verify (approve)
        ra = admin.post(f"{API}/admin/orders/{oid}/verify-payment", json={"action": "approve"}, timeout=20)
        assert ra.status_code == 200
        assert ra.json()["status"] == "confirmed"

    def test_upi_order_reject(self, user, admin):
        r = requests.get(f"{API}/products", timeout=20)
        pid = r.json()["items"][0]["id"]
        user.post(f"{API}/cart/add", json={"productId": pid, "qty": 1}, timeout=20)
        body = {
            "address": {"name": "T", "phone": "9", "line1": "x", "city": "Erode", "state": "TN", "pincode": "638502"},
            "paymentMethod": "UPI",
            "paymentDetails": {"transactionId": "TXN_REJ_" + str(int(time.time())), "screenshot": "data:image/png;base64,AAAA"},
        }
        ro = user.post(f"{API}/orders", json=body, timeout=30)
        oid = ro.json()["id"]
        rj = admin.post(f"{API}/admin/orders/{oid}/verify-payment", json={"action": "reject", "reason": "Invalid"}, timeout=20)
        assert rj.status_code == 200
        assert rj.json()["status"] == "payment_rejected"
