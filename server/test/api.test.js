import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { setup, teardown } from "./test-setup.js";
import { ensureAdminUser } from "../src/services/admin.js";
import cloudinary from "../src/services/cloudinary.js";
import Category from "../src/models/Category.js";
import Icon from "../src/models/Icon.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_secret";
process.env.ADMIN_INITIAL_PASSWORD = "admin123";
process.env.TOKEN_EXPIRES_IN = "1d";
process.env.CLOUDINARY_CLOUD_NAME = "test_cloud";
process.env.CLOUDINARY_API_KEY = "test_key";
process.env.CLOUDINARY_API_SECRET = "test_secret";

let server;
let baseUrl;
let token;
let originalUploadStream;

const mockCloudinarySuccess = () => {
  originalUploadStream = cloudinary.uploader.upload_stream;
  cloudinary.uploader.upload_stream = (_options, callback) => {
    const stream = new PassThrough();
    process.nextTick(() => {
      callback(null, {
        secure_url: "https://example.com/icon.png",
        public_id: "cloudinary-test",
        bytes: 256,
        resource_type: "image",
        format: "png",
        width: 64,
        height: 64
      });
    });
    return stream;
  };
};

const mockCloudinaryFailure = () => {
  originalUploadStream = cloudinary.uploader.upload_stream;
  cloudinary.uploader.upload_stream = (_options, callback) => {
    const stream = new PassThrough();
    process.nextTick(() => {
      callback(new Error("Cloudinary error"));
    });
    return stream;
  };
};

const restoreCloudinary = () => {
  if (originalUploadStream) {
    cloudinary.uploader.upload_stream = originalUploadStream;
  }
};

const loginAdmin = async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" })
  });
  assert.equal(response.ok, true);
  const payload = await response.json();
  return payload.token;
};

before(async () => {
  await setup();
  await ensureAdminUser();
  const { createApp } = await import("../src/index.js");
  const { default: categoryRoutes } = await import("../src/routes/categories.js");
  const app = createApp();
  app.use("/api/categories", categoryRoutes);
  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
  token = await loginAdmin();
});

after(async () => {
  restoreCloudinary();
  await teardown();
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(async () => {
  await Category.deleteMany({});
  await Icon.deleteMany({});
});

test("creates categories and returns icon counts", async () => {
  const createCategory = await fetch(`${baseUrl}/api/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ main: "icon", sub: "food" }),
    });
  assert.equal(createCategory.status, 201);

  mockCloudinarySuccess();

  const formData = new FormData();
  formData.append("file", new Blob(["test"], { type: "image/png" }), "test.png");
  formData.append("name", "pizza");
  formData.append("mainCategory", "icon");
  formData.append("subCategory", "food");

  const uploadIcon = await fetch(`${baseUrl}/api/icons`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  assert.equal(uploadIcon.status, 201);

  const listCategories = await fetch(`${baseUrl}/api/categories`);
  assert.equal(listCategories.ok, true);
  const categories = await listCategories.json();
    const category = categories.find(
      (item) => item.main === "icon" && item.subs.includes("food")
    );
    console.log("Category:", category);
  assert.equal(category.iconCount, 1);

  restoreCloudinary();
});

test("rejects invalid main categories", async () => {
  const response = await fetch(`${baseUrl}/api/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ mainCategory: "other", subCategory: "test" })
  });
  assert.equal(response.status, 400);
});

test("rejects invalid icon file types", async () => {
  mockCloudinarySuccess();
  const formData = new FormData();
  formData.append("file", new Blob(["test"], { type: "text/plain" }), "test.txt");
  formData.append("name", "bad");
  formData.append("mainCategory", "icon");
  formData.append("subCategory", "food");

  const response = await fetch(`${baseUrl}/api/icons`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  assert.equal(response.status, 415);
  restoreCloudinary();
});

test("handles Cloudinary upload failures", async () => {
  mockCloudinaryFailure();
  const formData = new FormData();
  formData.append("file", new Blob(["test"], { type: "image/png" }), "test.png");
  formData.append("name", "broken");
  formData.append("mainCategory", "icon");
  formData.append("subCategory", "food");

  const response = await fetch(`${baseUrl}/api/icons`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  assert.equal(response.status, 500);
  restoreCloudinary();
});
