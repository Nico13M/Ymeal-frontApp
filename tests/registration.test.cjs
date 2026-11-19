const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/load-typescript.cjs");
const { getPasswordRules, getPasswordMatch, validateRegistration } = load("src/lib/registration.ts");
const valid = { firstName: "Alice", lastName: "Martin", nickname: "", email: "alice@example.com", password: "Abcdefghi1!x", confirmation: "Abcdefghi1!x" };

test("registration accepts a valid form and an optional empty nickname", () => {
  assert.equal(validateRegistration(valid).isValid, true);
});

test("all four existing password requirements remain mandatory", () => {
  for (const password of ["A1!", "abcdefghij1!", "Abcdefghijk!", "Abcdefghijk1", ""]) {
    assert.equal(validateRegistration({ ...valid, password, confirmation: password }).isValid, false, password);
  }
  assert.deepEqual(getPasswordRules(valid.password), { minLength: true, hasUpperCase: true, hasNumber: true, hasSpecialChar: true });
});

test("registration enforces the backend's 12-character minimum", () => {
  const short = "Aa1!" + "x".repeat(7);
  const accepted = short + "x";
  assert.equal(short.length, 11);
  assert.equal(getPasswordRules(short).minLength, false);
  assert.equal(validateRegistration({ ...valid, password: short, confirmation: short }).isValid, false);
  assert.equal(accepted.length, 12);
  assert.equal(validateRegistration({ ...valid, password: accepted, confirmation: accepted }).isValid, true);
});

test("first and last names are limited to 45 characters without changing the two-character minimum", () => {
  for (const key of ["firstName", "lastName"]) {
    assert.equal(validateRegistration({ ...valid, [key]: "A".repeat(45) }).isValid, true);
    assert.equal(validateRegistration({ ...valid, [key]: "A".repeat(46) }).isValid, false);
    assert.equal(validateRegistration({ ...valid, [key]: "A" }).isValid, false);
  }
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
