import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";

const API_URL = "http://localhost:4000/api";
const LOGIN_CREDENTIALS = {
  username: "admin",
  password: "admin123"
};

async function testUpload() {
  console.log("--- Starting Cloudinary Upload Test ---");

  // 1. Login to get token
  console.log("Logging in...");
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(LOGIN_CREDENTIALS)
  });

  if (!loginRes.ok) {
    const error = await loginRes.json();
    console.error("Login failed:", error);
    process.exit(1);
  }

  const { token } = await loginRes.json();
  console.log("Login successful, token received.");

  // 2. Prepare dummy file
  const dummyFilePath = path.join(process.cwd(), "test-icon.png");
  // Create a 1x1 pixel transparent PNG or just some dummy data if server doesn't strictly validate PNG headers
  // For safety, let's just write some random bytes and call it a png.
  // Actually, better to use a real small image if possible, but let's try with buffer.
  const dummyContent = Buffer.from("dummy-image-content");
  fs.writeFileSync(dummyFilePath, dummyContent);

  // 3. Upload file
  console.log("Uploading file...");
  const form = new FormData();
  form.append("file", fs.createReadStream(dummyFilePath), {
    filename: "test-icon.png",
    contentType: "image/png"
  });
  form.append("name", "Test Icon");
  form.append("mainCategory", "test");
  form.append("subCategory", "test");

  const uploadRes = await fetch(`${API_URL}/icons`, {
    method: "POST",
    headers: {
      ...form.getHeaders(),
      "Authorization": `Bearer ${token}`
    },
    body: form
  });

  const result = await uploadRes.json();

  if (uploadRes.ok) {
    console.log("Upload successful!");
    console.log("Result:", JSON.stringify(result, null, 2));
  } else {
    console.error("Upload failed!");
    console.error("Status:", uploadRes.status);
    console.error("Error:", JSON.stringify(result, null, 2));
  }

  // Cleanup
  if (fs.existsSync(dummyFilePath)) {
    fs.unlinkSync(dummyFilePath);
  }

  console.log("--- Test Finished ---");
}

testUpload().catch(err => {
  console.error("Test execution error:", err);
});
