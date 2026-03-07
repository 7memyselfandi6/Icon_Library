# Tasks

- [ ] Task 1: Backend - Create Category Model
    - [ ] Create `server/src/models/Category.js` with schema (name, description, iconUrl, publicId, createdAt).

- [ ] Task 2: Backend - Implement Categories Routes
    - [ ] Create `server/src/routes/categories.js`.
    - [ ] Implement `GET /` to fetch all categories.
    - [ ] Implement `POST /` to create category with Cloudinary upload (using multer).
    - [ ] Implement `PUT /:id` to update category.
    - [ ] Implement `DELETE /:id` to delete category.

- [ ] Task 3: Backend - Register Routes
    - [ ] Update `server/src/index.js` to mount `categories.js` at `/api/categories`.

- [ ] Task 4: Frontend - AdminPanel Categories UI Layout
    - [ ] Update `client/src/components/AdminPanel.tsx` to add "Categories" tab/section.
    - [ ] Fetch and display the list of categories (name, description, icon) in a grid or table.

- [ ] Task 5: Frontend - Implement Add Category Flow
    - [ ] Create/Update state for Add Category Modal.
    - [ ] Implement form with Name, Description, and File input.
    - [ ] specific logic to handle image preview and upload.

- [ ] Task 6: Frontend - Implement Edit Category Flow
    - [ ] Create/Update state for Edit Category Modal.
    - [ ] Populate form with existing data when Edit is clicked.
    - [ ] Handle updating text fields and optionally replacing the image.

- [ ] Task 7: Frontend - Implement Delete Category Flow
    - [ ] Create Confirmation Modal for deletion.
    - [ ] specific logic to call DELETE API.

- [ ] Task 8: Verification & Cleanup
    - [ ] Verify all CRUD operations.
    - [ ] Ensure error handling is user-friendly.
