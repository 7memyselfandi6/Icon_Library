# Implement Categories CRUD Spec

## Why
Currently, categories are derived dynamically from the `Icon` collection, which prevents managing them as distinct entities with their own metadata (description, icon, etc.). The user requires a dedicated management section for categories in the admin panel with full CRUD capabilities and Cloudinary integration for category icons.

## What Changes
- Create a new Mongoose model `Category` to store category details.
- Create new Express routes for Category CRUD operations (`/api/categories`).
- Update `AdminPanel` in the React client to include a "Categories" management section.
- Implement modals for Adding, Editing, and Deleting categories.
- Integrate Cloudinary for uploading category icons.

## Impact
- **New Files**:
    - `server/src/models/Category.js`
    - `server/src/routes/categories.js`
- **Modified Files**:
    - `server/src/index.js` (to register the new route)
    - `client/src/components/AdminPanel.tsx` (to add the management UI)
- **Breaking Changes**: None. The existing `meta.js` which provides categories for the main app will remain untouched for now to ensure "without touching what is working", although the Admin Panel will use the new API.

## ADDED Requirements
### Requirement: Category Data Model
The system SHALL store categories with:
- `name` (String, required)
- `description` (String, optional)
- `iconUrl` (String, required - from Cloudinary)
- `createdAt` (Date, default now)

### Requirement: Category Management API
- `GET /api/categories`: Retrieve all categories.
- `POST /api/categories`: Create a new category (with image upload).
- `PUT /api/categories/:id`: Update a category (with optional image upload).
- `DELETE /api/categories/:id`: Delete a category.

### Requirement: Admin Panel UI
- **List View**: Display categories with icons, names, and descriptions.
- **Add Button**: Open a modal to create a category.
- **Edit Button**: Open a modal to update name, description, and icon.
- **Delete Button**: Open a confirmation modal before deletion.
- **Image Upload**: Allow uploading a file to Cloudinary during Add/Edit.

## Behavior
- Form validation (required fields).
- Success/Error notifications.
- Auto-refresh list after operations.
