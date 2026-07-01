import uuid

GAME_BODY = {
    "id": str(uuid.uuid4()),
    "mode": "full",
    "claims_config": [{"type": "full_house", "label": "Full House", "prize": 501}],
    "started_at": "2026-07-01T10:00:00",
    "ended_at":   "2026-07-01T11:00:00",
    "players": [{"player_id": None, "nickname": "Alice"}],
    "called_numbers": [
        {"number": 42, "sequence_order": 1, "called_at": None},
        {"number": 7,  "sequence_order": 2, "called_at": None},
    ],
    "claims": [{"claim_type": "full_house", "winner_player_id": None, "won_at": None}],
}

def test_sync_game(client, auth_headers):
    r = client.post("/games/sync", json=GAME_BODY, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_sync_game_requires_auth(client):
    r = client.post("/games/sync", json=GAME_BODY)
    assert r.status_code == 401

def test_get_games_empty(client, auth_headers):
    r = client.get("/games", headers=auth_headers)
    assert r.status_code == 200
    assert r.json() == []

def test_get_games_after_sync(client, auth_headers):
    client.post("/games/sync", json=GAME_BODY, headers=auth_headers)
    r = client.get("/games", headers=auth_headers)
    assert r.status_code == 200
    games = r.json()
    assert len(games) == 1
    assert games[0]["mode"] == "full"
    assert len(games[0]["claims"]) == 1

def test_resync_game_updates(client, auth_headers):
    client.post("/games/sync", json=GAME_BODY, headers=auth_headers)
    updated = {**GAME_BODY, "mode": "quick", "players": [], "called_numbers": [], "claims": []}
    client.post("/games/sync", json=updated, headers=auth_headers)
    r = client.get("/games", headers=auth_headers)
    assert r.json()[0]["mode"] == "quick"

def test_cannot_sync_another_users_game(client):
    # User A creates a game
    r1 = client.post("/auth/register", json={"phone": "1111111111", "pin": "1234", "nickname": "A"})
    headers_a = {"Authorization": f"Bearer {r1.json()['token']}"}
    client.post("/games/sync", json=GAME_BODY, headers=headers_a)

    # User B tries to overwrite it
    r2 = client.post("/auth/register", json={"phone": "2222222222", "pin": "1234", "nickname": "B"})
    headers_b = {"Authorization": f"Bearer {r2.json()['token']}"}
    r = client.post("/games/sync", json=GAME_BODY, headers=headers_b)
    assert r.status_code == 403
