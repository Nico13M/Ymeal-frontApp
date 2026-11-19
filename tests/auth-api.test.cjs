const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/load-typescript.cjs");

const storage = {
  getItem: async () => JSON.stringify({ token: "session-token", user: { id: 99 } }),
  setItem: async () => {},
  removeItem: async () => {},
};

test("login and registration accept data.token from the documented backend response", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return Response.json({ data: { token: "backend-token", token_type: "Bearer", expires_in: 604800, user: { id: 99 } } });
  });
  const auth = load("src/services/auth.ts", { "@react-native-async-storage/async-storage": storage });
  const credentials = { email: "alice@example.test", password: "Abcdefghi1!x" };
  assert.equal((await auth.loginRequest(credentials)).token, "backend-token");
  assert.equal((await auth.registerRequest({ ...credentials, firstname: "Alice", lastname: "Martin" })).token, "backend-token");
  for (const { options } of calls) {
    assert.equal(options.credentials, "include");
    assert.equal(new Headers(options.headers).has("Authorization"), false);
  }
});

test("editing the current account sends its real token alongside CSRF and session cookies", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return Response.json(url.endsWith("/csrf-token") ? { csrfToken: "csrf-value" } : { success: true });
  });
  const auth = load("src/services/auth.ts", { "@react-native-async-storage/async-storage": storage });
  await auth.updateUserRequest(99, { firstname: "Alice", lastname: "Martin", email: "alice@example.test" });
  assert.equal(calls.length, 2);
  const patch = calls[1].options;
  assert.equal(patch.method, "PATCH");
  assert.equal(new Headers(patch.headers).get("Authorization"), "Bearer session-token");
  assert.equal(new Headers(patch.headers).get("X-CSRF-TOKEN"), "csrf-value");
  assert.equal(patch.credentials, "include");
});

test("profile, fridge and recipe requests use JWT authentication without a user ID header", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return Response.json(url.includes("favorite-cuisines") ? [{ id: 1, name: "Italienne" }] : []);
  });
  const authMock = { getSession: async () => ({ token: "session-token", user: { id: 99 } }), getCsrfToken: async () => "csrf-value" };
  const mocks = { "./auth": authMock, "@react-native-async-storage/async-storage": storage };
  await load("src/services/profile.ts", mocks).fetchAllCuisines();
  await load("src/services/fridge.ts", mocks).getAvailableIngredients();
  await load("src/services/recipes.ts", mocks).getRecipe(1);
  assert.equal(calls.length, 3);
  for (const { options } of calls) {
    const headers = new Headers(options.headers);
    assert.equal(headers.get("Authorization"), "Bearer session-token");
    assert.equal(headers.has("Bearer"), false);
    assert.equal(headers.has("X-User-Id"), false);
  }
});
