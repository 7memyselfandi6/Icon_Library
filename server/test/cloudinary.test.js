import { test } from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import cloudinary, { uploadToCloudinary } from "../src/services/cloudinary.js";

process.env.CLOUDINARY_CLOUD_NAME = "test_cloud";
process.env.CLOUDINARY_API_KEY = "test_key";
process.env.CLOUDINARY_API_SECRET = "test_secret";

test("uploadToCloudinary resolves with Cloudinary response", async () => {
  const original = cloudinary.uploader.upload_stream;
  cloudinary.uploader.upload_stream = (_options, callback) => {
    const stream = new PassThrough();
    process.nextTick(() => {
      callback(null, {
        secure_url: "https://example.com/icon.png",
        public_id: "cloudinary-test",
        bytes: 128,
        resource_type: "image",
        format: "png"
      });
    });
    return stream;
  };

  const result = await uploadToCloudinary(Buffer.from("test"));
  assert.equal(result.public_id, "cloudinary-test");
  assert.equal(result.secure_url, "https://example.com/icon.png");

  cloudinary.uploader.upload_stream = original;
});

test("uploadToCloudinary rejects on upload error", async () => {
  const original = cloudinary.uploader.upload_stream;
  cloudinary.uploader.upload_stream = (_options, callback) => {
    const stream = new PassThrough();
    process.nextTick(() => {
      callback(new Error("Upload failed"));
    });
    return stream;
  };

  await assert.rejects(() => uploadToCloudinary(Buffer.from("test")), {
    message: "Upload failed"
  });

  cloudinary.uploader.upload_stream = original;
});
