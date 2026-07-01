def test_register_success(client):
    r = client.post("/auth/register", json={"phone": "9876543210", "pin": "1234", "nickname": "Alice"})
    assert r.status_code == 200
    data = r.json()
    assert "token" in data
    assert data["nickname"] == "Alice"

def test_register_duplicate_phone(client):
    body = {"phone": "9876543210", "pin": "1234", "nickname": "Alice"}
    client.post("/auth/register", json=body)
    r = client.post("/auth/register", json=body)
    assert r.status_code == 409

def test_register_invalid_phone(client):
    r = client.post("/auth/register", json={"phone": "12345", "pin": "1234", "nickname": "Alice"})
    assert r.status_code == 422

def test_register_invalid_pin(client):
    r = client.post("/auth/register", json={"phone": "9876543210", "pin": "ab", "nickname": "Alice"})
    assert r.status_code == 422

def test_login_success(client):
    client.post("/auth/register", json={"phone": "9876543210", "pin": "1234", "nickname": "Alice"})
    r = client.post("/auth/login", json={"phone": "9876543210", "pin": "1234"})
    assert r.status_code == 200
    assert "token" in r.json()

def test_login_wrong_pin(client):
    client.post("/auth/register", json={"phone": "9876543210", "pin": "1234", "nickname": "Alice"})
    r = client.post("/auth/login", json={"phone": "9876543210", "pin": "9999"})
    assert r.status_code == 401

def test_login_unknown_phone(client):
    r = client.post("/auth/login", json={"phone": "9999999999", "pin": "1234"})
    assert r.status_code == 401

def test_get_players_requires_auth(client):
    r = client.get("/players")
    assert r.status_code == 401

def test_get_players_returns_self(client, auth_headers, registered):
    r = client.get("/players", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["nickname"] == registered["nickname"]
