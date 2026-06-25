"""Backend tests for Phase 5 Quotations workflow.

Workflow: draft -> sent -> accepted / rejected -> converted (to order)
Endpoints:
  GET    /api/admin/quotations[?status=&q=]
  POST   /api/admin/quotations
  GET    /api/admin/quotations/:id
  PUT    /api/admin/quotations/:id
  DELETE /api/admin/quotations/:id
  POST   /api/admin/quotations/:id/send
  POST   /api/admin/quotations/:id/accept
  POST   /api/admin/quotations/:id/reject
  POST   /api/admin/quotations/:id/convert
"""
import os
import time
import pytest
import requests

BASE_URL = (os.environ.get('REACT_APP_BACKEND_URL') or os.environ.get('NEXT_PUBLIC_BASE_URL') or 'https://npm-setup-6.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@dhara.com"
ADMIN_PASS = "admin123"
USER_EMAIL = "user@dhara.com"
USER_PASS = "user123"


def _login(session, email, password):
    r = session.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=20)
    assert r.status_code == 200, f"login failed {email}: {r.status_code} {r.text}"
    return r.json()


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    _login(s, ADMIN_EMAIL, ADMIN_PASS)
    return s


@pytest.fixture(scope="module")
def user():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    _login(s, USER_EMAIL, USER_PASS)
    return s


# Shared state across tests
state = {}


# ---------- Validation ----------
class TestValidation:
    def test_missing_name_email(self, admin):
        r = admin.post(f"{API}/admin/quotations", json={"items": [{"name": "X", "qty": 1, "price": 10}]}, timeout=20)
        assert r.status_code == 400, r.text

    def test_missing_items(self, admin):
        r = admin.post(f"{API}/admin/quotations", json={
            "customerName": "TEST_NoItems",
            "customerEmail": "test_noitems@example.com",
            "items": []
        }, timeout=20)
        assert r.status_code == 400, r.text

    def test_items_with_zero_qty(self, admin):
        r = admin.post(f"{API}/admin/quotations", json={
            "customerName": "TEST_ZeroQty",
            "customerEmail": "test_zero@example.com",
            "items": [{"name": "X", "qty": 0, "price": 10}]
        }, timeout=20)
        # Should fail because no valid items after filter
        assert r.status_code == 400, r.text


# ---------- Auth / Negative ----------
class TestAuthorization:
    def test_anonymous_cannot_list(self):
        r = requests.get(f"{API}/admin/quotations", timeout=20)
        assert r.status_code in (401, 403), r.text

    def test_user_cannot_list(self, user):
        r = user.get(f"{API}/admin/quotations", timeout=20)
        assert r.status_code in (401, 403), r.text

    def test_user_cannot_create(self, user):
        r = user.post(f"{API}/admin/quotations", json={
            "customerName": "TEST_unauth",
            "customerEmail": "u@example.com",
            "items": [{"name": "I", "qty": 1, "price": 100}]
        }, timeout=20)
        assert r.status_code in (401, 403), r.text


# ---------- Happy path: Draft -> Sent -> Accepted -> Converted ----------
class TestQuoteLifecycle:
    def test_create_draft_quote(self, admin):
        payload = {
            "customerName": "TEST_Quote Customer",
            "customerEmail": "test_quote@example.com",
            "customerPhone": "9999999999",
            "shippingAddress": {"line1": "1 Test St", "city": "Erode", "state": "TN", "pincode": "638502"},
            "items": [
                {"name": "Custom Item A", "qty": 2, "unit": "pcs", "price": 100, "description": "desc"},
                {"name": "Custom Item B", "qty": 3, "unit": "pcs", "price": 50}
            ],
            "taxRate": 5,
            "discount": 50,
            "shipping": 30,
            "notes": "Net 7 days",
            "validUntil": "2026-12-31"
        }
        r = admin.post(f"{API}/admin/quotations", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        q = r.json()
        assert q["status"] == "draft"
        assert q["number"].startswith("QT-"), f"bad number: {q['number']}"
        # Format check: QT-YYYY-NNNN
        parts = q["number"].split("-")
        assert len(parts) == 3 and len(parts[1]) == 4 and len(parts[2]) == 4

        # Total math: 2*100 + 3*50 = 350; - 50 discount = 300; +5% tax = 15; + 30 ship = 345
        assert q["subtotal"] == 350.0
        assert q["discount"] == 50.0
        assert q["tax"] == 15.0
        assert q["shipping"] == 30.0
        assert q["total"] == 345.0
        assert q["customerName"] == "TEST_Quote Customer"
        assert len(q["items"]) == 2
        # No _id leaked
        assert "_id" not in q
        state["quote_id"] = q["id"]
        state["quote_number"] = q["number"]

    def test_get_persisted(self, admin):
        qid = state["quote_id"]
        r = admin.get(f"{API}/admin/quotations/{qid}", timeout=20)
        assert r.status_code == 200
        q = r.json()
        assert q["id"] == qid
        assert q["status"] == "draft"
        assert "_id" not in q

    def test_list_filter_by_status(self, admin):
        r = admin.get(f"{API}/admin/quotations?status=draft", timeout=20)
        assert r.status_code == 200
        items = r.json()["items"]
        assert any(it["id"] == state["quote_id"] for it in items)
        # No _id leaked
        for it in items:
            assert "_id" not in it

    def test_search_filter(self, admin):
        r = admin.get(f"{API}/admin/quotations?q=TEST_Quote", timeout=20)
        assert r.status_code == 200
        items = r.json()["items"]
        assert any(it["id"] == state["quote_id"] for it in items)

    def test_edit_draft_quote(self, admin):
        qid = state["quote_id"]
        r = admin.put(f"{API}/admin/quotations/{qid}", json={
            "customerName": "TEST_Quote Customer",
            "customerEmail": "test_quote@example.com",
            "taxRate": 10,
            "discount": 0,
            "shipping": 0,
            "items": [
                {"name": "Custom Item A", "qty": 2, "unit": "pcs", "price": 100},
                {"name": "Custom Item B", "qty": 3, "unit": "pcs", "price": 50},
                {"name": "Custom Item C", "qty": 1, "unit": "pcs", "price": 100},
            ]
        }, timeout=20)
        assert r.status_code == 200, r.text
        q = r.json()
        # Now subtotal=450, tax 10% = 45, total = 495
        assert q["subtotal"] == 450.0
        assert q["tax"] == 45.0
        assert q["total"] == 495.0
        assert len(q["items"]) == 3

    def test_send_draft(self, admin):
        qid = state["quote_id"]
        r = admin.post(f"{API}/admin/quotations/{qid}/send", json={}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        assert "emailSent" in d
        # Verify status
        r2 = admin.get(f"{API}/admin/quotations/{qid}", timeout=20)
        assert r2.json()["status"] == "sent"

    def test_accept_sent(self, admin):
        qid = state["quote_id"]
        r = admin.post(f"{API}/admin/quotations/{qid}/accept", json={}, timeout=20)
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "accepted"
        # Verify persistence
        r2 = admin.get(f"{API}/admin/quotations/{qid}", timeout=20)
        assert r2.json()["status"] == "accepted"

    def test_cannot_edit_accepted(self, admin):
        qid = state["quote_id"]
        r = admin.put(f"{API}/admin/quotations/{qid}", json={"taxRate": 1}, timeout=20)
        assert r.status_code == 400, r.text

    def test_cannot_delete_accepted(self, admin):
        qid = state["quote_id"]
        r = admin.delete(f"{API}/admin/quotations/{qid}", timeout=20)
        assert r.status_code == 400, r.text

    def test_convert_accepted_to_order(self, admin):
        qid = state["quote_id"]
        r = admin.post(f"{API}/admin/quotations/{qid}/convert", json={}, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        order_id = d["orderId"]
        state["order_id"] = order_id

        # Quote status now converted
        r2 = admin.get(f"{API}/admin/quotations/{qid}", timeout=20)
        q = r2.json()
        assert q["status"] == "converted"
        assert q["convertedToOrderId"] == order_id

        # Order exists with sourceQuoteNumber
        ro = admin.get(f"{API}/admin/orders", timeout=20)
        assert ro.status_code == 200
        orders = ro.json().get("items", [])
        match = [o for o in orders if o.get("id") == order_id]
        assert match, f"order {order_id} not found in admin orders list"
        o = match[0]
        assert o["sourceQuoteNumber"] == state["quote_number"]
        assert o["status"] == "placed"
        assert o["paymentMethod"] == "QUOTE"

    def test_cannot_convert_twice(self, admin):
        qid = state["quote_id"]
        r = admin.post(f"{API}/admin/quotations/{qid}/convert", json={}, timeout=20)
        assert r.status_code == 400, r.text


# ---------- Rejection branch ----------
class TestRejectionBranch:
    def test_reject_and_delete(self, admin):
        # Create new quote
        r = admin.post(f"{API}/admin/quotations", json={
            "customerName": "TEST_Reject Customer",
            "customerEmail": "test_reject@example.com",
            "items": [{"name": "Reject Item", "qty": 1, "unit": "pcs", "price": 200}],
            "taxRate": 0, "discount": 0, "shipping": 0
        }, timeout=20)
        assert r.status_code == 200, r.text
        qid = r.json()["id"]
        # Reject directly from draft
        rj = admin.post(f"{API}/admin/quotations/{qid}/reject", json={}, timeout=20)
        assert rj.status_code == 200
        assert rj.json()["status"] == "rejected"
        # Delete rejected quote (allowed)
        rd = admin.delete(f"{API}/admin/quotations/{qid}", timeout=20)
        assert rd.status_code == 200
        # Should not exist
        rg = admin.get(f"{API}/admin/quotations/{qid}", timeout=20)
        assert rg.status_code == 404


# ---------- Delete draft ----------
class TestDeleteDraft:
    def test_delete_draft_quote(self, admin):
        r = admin.post(f"{API}/admin/quotations", json={
            "customerName": "TEST_Delete Draft",
            "customerEmail": "test_delete@example.com",
            "items": [{"name": "X", "qty": 1, "unit": "pcs", "price": 10}],
        }, timeout=20)
        assert r.status_code == 200
        qid = r.json()["id"]
        rd = admin.delete(f"{API}/admin/quotations/{qid}", timeout=20)
        assert rd.status_code == 200
