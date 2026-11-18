const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/load-typescript.cjs");
const { getPasswordRules, getPasswordMatch, validateRegistration } = load("src/lib/registration.ts");
const valid = { firstName: "Alice", lastName: "Martin", nickname: "", email: "alice@example.com", password: "Abc1!x", confirmation: "Abc1!x" };

test("registration accepts a valid form and an optional empty nickname", () => {
  assert.equal(validateRegistration(valid).isValid, true);
});

test("all four existing password requirements remain mandatory", () => {
  for (const password of ["A1!", "abc1!x", "Abcd!x", "Abcd1x", ""]) {
    assert.equal(validateRegistration({ ...valid, password, confirmation: password }).isValid, false, password);
  }
  assert.deepEqual(getPasswordRules("Abc1!x"), { minLength: true, hasUpperCase: true, hasNumber: true, hasSpecialChar: true });
});

test("password confirmation stays neutral until both fields are filled", () => {
  assert.equal(getPasswordMatch("", ""), "neutral");
  assert.equal(getPasswordMatch("Abc1!x", ""), "neutral");
  assert.equal(getPasswordMatch("", "Abc1!x"), "neutral");
  assert.equal(validateRegistration({ ...valid, confirmation: "" }).isValid, false);
});

test("changing either password immediately changes the match result", () => {
  assert.equal(getPasswordMatch("Abc1!x", "Abc1!x"), "valid");
  assert.equal(getPasswordMatch("Abc1!y", "Abc1!x"), "invalid");
  assert.equal(getPasswordMatch("Abc1!y", "Abc1!y"), "valid");
  assert.equal(validateRegistration({ ...valid, confirmation: "Other1!" }).isValid, false);
});

test("required names, email format, and optional nickname validation still gate submission", () => {
  for (const patch of [{ firstName: "A" }, { lastName: " " }, { email: "not-an-email" }, { nickname: "x" }]) {
    assert.equal(validateRegistration({ ...valid, ...patch }).isValid, false);
  }
  assert.equal(validateRegistration({ ...valid, email: " alice@example.com " }).isValid, true);
});
