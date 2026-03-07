import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { setup, teardown } from "./test-setup.js";
import Category from "../src/models/Category.js";
import { createApp } from "../src/index.js";

let server;
let baseUrl;

before(async () => {
  await setup();
  const app = createApp();
  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await teardown();
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(async () => {
  await Category.deleteMany({});
});

test("should create a category successfully", async () => {
  const response = await fetch(`${baseUrl}/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ main: "icon", sub: "food" }),
  });
  assert.equal(response.status, 201);
  const category = await response.json();
  assert.equal(category.main, "icon");
  assert.equal(category.sub, "food");
});

test("should return 400 for missing main field", async () => {
  const response = await fetch(`${baseUrl}/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sub: "food" }),
  });
  assert.equal(response.status, 400);
});

test("should return 400 for null main field", async () => {
  const response = await fetch(`${baseUrl}/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ main: null, sub: "food" }),
  });
  assert.equal(response.status, 400);
});

test("should return 409 for duplicate category", async () => {
  await new Category({ main: "icon", sub: "food" }).save();
  const response = await fetch(`${baseUrl}/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ main: "icon", sub: "food" }),
  });
  assert.equal(response.status, 409);
});
