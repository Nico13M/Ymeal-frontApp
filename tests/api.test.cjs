const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/load-typescript.cjs");

test("protected requests send a real Bearer token and cookies, never user ID headers", async (t) => {
  let sent;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    sent = { url, options };
    return Response.json({ success: true });
  });
  const api = load("src/lib/api.ts");
  const headers = { Bearer: "123", "X-User-Id": "123", authorization: "old-value", "X-CSRF-TOKEN": "csrf-value" };
  await api.apiRequest("/admin/user/preferences/diets", { method: "POST", token: "session-token", headers, body: { diet_ids: [1] } });
  const actual = new Headers(sent.options.headers);
  assert.equal(actual.get("Authorization"), "Bearer session-token");
  assert.equal(actual.has("Bearer"), false);
  assert.equal(actual.has("X-User-Id"), false);
  assert.equal(actual.get("X-CSRF-TOKEN"), "csrf-value");
  assert.equal(actual.get("Content-Type"), "application/json");
  assert.equal(sent.options.credentials, "include");
  assert.equal(sent.url.includes("session-token"), false);
  assert.deepEqual(JSON.parse(sent.options.body), { diet_ids: [1] });
  assert.equal(headers.authorization, "old-value");
});

test("registration keeps JSON and credentials without fake authentication or CORS bypass", async (t) => {
  let sent;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    sent = options;
    return Response.json({ data: { token: "new-token" } });
  });
  const { apiRequest } = load("src/lib/api.ts");
  await apiRequest("/admin/auth/register", { method: "POST", body: { email: "alice@example.test" } });
  const headers = new Headers(sent.headers);
  assert.equal(headers.has("Authorization"), false);
  assert.equal(headers.has("Access-Control-Allow-Origin"), false);
  assert.equal(headers.has("X-CSRF-TOKEN"), false);
  assert.equal(headers.get("Content-Type"), "application/json");
  assert.equal(sent.credentials, "include");
  assert.notEqual(sent.mode, "no-cors");
});

test("failed fetches get a readable network message without retrying registration", async (t) => {
  let requests = 0;
  const failure = new TypeError("NetworkError when attempting to fetch resource.");
  t.mock.method(globalThis, "fetch", async () => { requests++; throw failure; });
  const { apiRequest, ApiNetworkError, getHumanErrorMessage } = load("src/lib/api.ts");
  await assert.rejects(apiRequest("/admin/auth/register", { method: "POST", body: {} }), (error) => {
    assert.ok(error instanceof ApiNetworkError);
    assert.equal(error.originalError, failure);
    assert.match(getHumanErrorMessage(error), /Impossible de contacter le serveur/);
    assert.doesNotMatch(error.message, /NetworkError/);
    return true;
  });
  assert.equal(requests, 1);
});

test("HTTP failures keep their status and payload instead of being mistaken for network failures", async (t) => {
  const api = load("src/lib/api.ts");
  let status;
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: "Rejected" }, { status }));
  for (status of [400, 401, 403, 429]) {
    await assert.rejects(api.apiRequest("/admin/test"), (error) => {
      assert.ok(error instanceof api.ApiError);
      assert.equal(error.status, status);
      assert.deepEqual(error.details, { error: "Rejected" });
      return true;
    });
  }
});
