import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { IconEntry, Category } from "../App";
import ThemeToggle from "./ThemeToggle";

type AdminPanelProps = {
  icons: IconEntry[];
  setIcons: React.Dispatch<React.SetStateAction<IconEntry[]>>;
  adminName: string;
  theme: "light" | "dark";
  onToggleTheme: (checked: boolean) => void;
  onLogout: () => void;
  onNavigate: (route: "home" | "library" | "admin" | "admin-panel") => void;
  isAdmin: boolean;
  apiBaseUrl: string;
  authToken: string;
  categories: Category[];
  onRefreshIcons: (search?: string) => Promise<void>;
  onRefreshCategories: () => Promise<void>;
};

const AdminPanel = ({
  icons,
  setIcons,
  adminName,
  theme,
  onToggleTheme,
  onLogout,
  onNavigate,
  isAdmin,
  apiBaseUrl,
  authToken,
  categories,
  onRefreshIcons,
  onRefreshCategories
}: AdminPanelProps) => {
  const [activeSection, setActiveSection] = useState<
    "upload" | "manage" | "categories" | "settings"
  >("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(
    null
  );
  const [iconName, setIconName] = useState("");
  const [iconCategory, setIconCategory] = useState("icon-food");
  const [iconTags, setIconTags] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryMain, setCategoryMain] = useState("icon");
  const [categorySub, setCategorySub] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editIconId, setEditIconId] = useState<string | number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("icon-food");
  const [editTags, setEditTags] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const totalIcons = icons.length;

  // Close sidebar on navigation in mobile
  const handleSectionChange = (section: typeof activeSection) => {
    setActiveSection(section);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isSidebarOpen]);

  const categoryGroups = useMemo(() => {
    const map = new Map<string, Set<string>>();
    categories.forEach((cat) => {
      if (!map.has(cat.mainCategory)) {
        map.set(cat.mainCategory, new Set());
      }
      map.get(cat.mainCategory)?.add(cat.subCategory);
    });
    return Array.from(map.entries()).map(([main, subs]) => ({
      main,
      subs: Array.from(subs)
    }));
  }, [categories]);

  useEffect(() => {
    if (!categoryGroups.length) return;
    const firstGroup = categoryGroups[0];
    const firstSub = firstGroup.subs[0];
    if (!firstSub) return;
    const firstValue = `${firstGroup.main}-${firstSub}`;
    const allValues = new Set(
      categoryGroups.flatMap((group) =>
        group.subs.map((sub) => `${group.main}-${sub}`)
      )
    );
    setIconCategory((prev) => (allValues.has(prev) ? prev : firstValue));
    setEditCategory((prev) => (allValues.has(prev) ? prev : firstValue));
  }, [categoryGroups]);

  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) return icons;
    const query = searchQuery.toLowerCase();
    return icons.filter((icon) => {
      const text = `${icon.name} ${icon.mainCategory} ${icon.subCategory}`.toLowerCase();
      return text.includes(query);
    });
  }, [icons, searchQuery]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 2000);
  };

  const handleFileSelect = (file: File | null) => {
    if (
      !file ||
      (!file.type.startsWith("image/") && !file.type.startsWith("video/"))
    ) {
      return;
    }
    setUploadedFile(file);
    setFileInfo({
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`
    });
  };

  const handleUploadIcon = async () => {
    if (!iconName.trim()) {
      showToast("Please enter an icon name.");
      return;
    }
    if (!iconCategory) {
      showToast("Please select a category.");
      return;
    }
    if (!uploadedFile) {
      showToast("Please select an image or video file to upload.");
      return;
    }

    setIsUploading(true);
    showToast("Uploading icon...");

    try {
      const [mainCategory, subCategory] = iconCategory.split("-");
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("name", iconName);
      formData.append("mainCategory", mainCategory);
      formData.append("subCategory", subCategory);
      if (iconTags.trim()) {
        formData.append("tags", iconTags);
      }

      const response = await fetch(`${apiBaseUrl}/api/icons`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const message = errorPayload?.error || "Upload failed. Please try again.";
        throw new Error(message);
      }

      const payload = await response.json();
      const newIcon: IconEntry = {
        id: payload._id,
        name: payload.name,
        mainCategory: payload.mainCategory,
        subCategory: payload.subCategory,
        tags: payload.tags || [],
        fileData: payload.file?.url,
        fileName: payload.file?.originalName,
        fileSize: payload.file?.bytes
          ? `${(payload.file.bytes / 1024).toFixed(1)} KB`
          : undefined,
        date: payload.createdAt
          ? new Date(payload.createdAt).toLocaleDateString()
          : undefined,
        type: payload.file?.resourceType || "image",
      };

      setIcons((prev) => [newIcon, ...prev]);
      setIconName("");
      setIconTags("");
      setUploadedFile(null);
      setFileInfo(null);
      await onRefreshCategories();
      showToast("Icon uploaded successfully!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred.";
      showToast(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!categorySub.trim()) {
      alert("Please enter sub category name");
      return;
    }
    try {
      setIsProcessing(true);
      const url = editingCategory
        ? `${apiBaseUrl}/api/categories/${editingCategory._id}`
        : `${apiBaseUrl}/api/categories`;
      
      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          mainCategory: categoryMain,
          subCategory: categorySub
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ${editingCategory ? "update" : "create"} category`);
      }

      await onRefreshCategories();
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryMain("icon");
      setCategorySub("");
      showToast(`Category ${editingCategory ? "updated" : "added"} successfully!`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Operation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryMain("icon");
    setCategorySub("");
    setShowCategoryModal(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryMain(category.mainCategory);
    setCategorySub(category.subCategory);
    setShowCategoryModal(true);
  };

  const openDeleteConfirm = (category: Category) => {
    setDeletingCategory(category);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;

    try {
      setIsProcessing(true);
      const response = await fetch(`${apiBaseUrl}/api/categories/${deletingCategory._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete category");
      }

      await onRefreshCategories();
      setShowDeleteModal(false);
      setDeletingCategory(null);
      showToast("Category deleted successfully!");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to delete category");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditIcon = (icon: IconEntry) => {
    setEditIconId(icon.id);
    setEditName(icon.name);
    setEditCategory(`${icon.mainCategory}-${icon.subCategory}`);
    setEditTags((icon.tags || []).join(", "));
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (editIconId === null) return;
    try {
      const [mainCategory, subCategory] = editCategory.split("-");
      const response = await fetch(`${apiBaseUrl}/api/icons/${editIconId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: editName,
          mainCategory,
          subCategory,
          tags: editTags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        })
      });
      if (!response.ok) {
        throw new Error("Update failed");
      }
      const payload = await response.json();
      setIcons((prev) =>
        prev.map((icon) =>
          icon.id === editIconId
            ? {
                ...icon,
                name: payload.name,
                mainCategory: payload.mainCategory,
                subCategory: payload.subCategory,
                tags: payload.tags || []
              }
            : icon
        )
      );
      await onRefreshCategories();
      setShowEditModal(false);
      setEditIconId(null);
      showToast("Icon updated successfully!");
    } catch {
      showToast("Failed to update icon");
    }
  };

  const handleDeleteIcon = async (id: string | number) => {
    if (window.confirm("Are you sure you want to delete this icon?")) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/icons/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (!response.ok) {
          throw new Error("Delete failed");
        }
        setIcons((prev) => prev.filter((icon) => icon.id !== id));
        await onRefreshCategories();
        showToast("Icon deleted successfully!");
      } catch {
        showToast("Failed to delete icon");
      }
    }
  };

  const getMainCategoryName = (main: string) => {
    const names: Record<string, string> = {
      icon: "Icon",
      image: "Image",
      video: "Video",
      logo: "Logo"
    };
    return names[main] || main;
  };

  const getSubCategoryName = (main: string, sub: string) => {
    const names: Record<string, Record<string, string>> = {
      icon: { food: "Food", info: "Info", art: "Art" },
      image: { human: "Human", animal: "Animal", country: "Country" },
      video: { news: "News", promotion: "Promotion", funny: "Funny" },
      logo: { company: "Company", brand: "Brand", product: "Product" }
    };
    return names[main]?.[sub] || sub;
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast("Please enter all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match");
      return;
    }
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (!response.ok) {
        throw new Error("Password update failed");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated successfully!");
    } catch {
      showToast("Failed to update password");
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      onNavigate("admin");
    }
  }, [isAdmin, onNavigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onRefreshIcons(searchQuery).catch(() => null);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery, onRefreshIcons]);

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <header className="header">
        <div className="header-content">
          <button
            className={`hamburger mobile-only ${isSidebarOpen ? "active" : ""}`}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-expanded={isSidebarOpen}
            aria-label="Toggle sidebar"
            aria-controls="admin-sidebar"
          >
            <span className="hamburger-box">
              <span className="hamburger-inner"></span>
            </span>
          </button>
          <div className="logo" onClick={() => onNavigate("home")} aria-label="IconLibrary Home">
            <i className="fas fa-icons" aria-hidden="true"></i>
            <span>IconLibrary Admin</span>
          </div>

          <div className="header-actions">
            <button
              className="nav-link nav-button desktop-only"
              type="button"
              style={{ marginRight: "1rem" }}
              onClick={() => onNavigate("library")}
            >
              <i className="fas fa-eye"></i> Library
            </button>
            <div className="admin-badge desktop-only">
              <i className="fas fa-shield-alt"></i>
              <span>{adminName}</span>
            </div>

            <ThemeToggle
              checked={theme === "dark"}
              onChange={onToggleTheme}
            />

            <button className="logout-btn" type="button" onClick={onLogout} aria-label="Logout">
              <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
              <span className="desktop-only">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <aside
          id="admin-sidebar"
          className={`sidebar ${isSidebarOpen ? "active" : ""}`}
          role="complementary"
        >
          <div className="admin-info">
            <div className="admin-avatar">
              <i className="fas fa-user-shield"></i>
            </div>
            <div className="admin-name">{adminName}</div>
            <div className="admin-role">Super Admin</div>
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-value">{totalIcons}</div>
              <div className="stat-label">Total Icons</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{categoryGroups.length}</div>
              <div className="stat-label">Categories</div>
            </div>
          </div>

          <nav className="admin-nav" role="navigation">
            <button
              className={`nav-btn ${activeSection === "upload" ? "active" : ""}`}
              onClick={() => handleSectionChange("upload")}
            >
              <i className="fas fa-cloud-upload-alt"></i>
              <span>Upload Icon</span>
            </button>
            <button
              className={`nav-btn ${activeSection === "manage" ? "active" : ""}`}
              onClick={() => handleSectionChange("manage")}
            >
              <i className="fas fa-edit"></i>
              <span>Manage Icons</span>
            </button>
            <button
              className={`nav-btn ${activeSection === "categories" ? "active" : ""}`}
              onClick={() => handleSectionChange("categories")}
            >
              <i className="fas fa-tags"></i>
              <span>Categories</span>
            </button>
            <button
              className={`nav-btn ${activeSection === "settings" ? "active" : ""}`}
              onClick={() => handleSectionChange("settings")}
            >
              <i className="fas fa-cog"></i>
              <span>Settings</span>
            </button>
          </nav>
        </aside>

        {isSidebarOpen && (
          <div
            className="sidebar-overlay mobile-only"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <section className="content">
          {activeSection === "upload" && (
            <div>
              <div className="content-header">
                <h2 className="content-title">Upload New Icon</h2>
              </div>

              <div
                className={`upload-area ${
                  uploadedFile ? "upload-area-success" : ""
                }`}
                onClick={() =>
                  document.getElementById("fileInput")?.click()
                }
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleFileSelect(event.dataTransfer.files[0] || null);
                }}
              >
                <i className="fas fa-cloud-upload-alt"></i>
                <h3>Click to upload or drag and drop</h3>
                <p>PNG, JPG, SVG, GIF, MP4 (Max 50MB)</p>
                <input
                  type="file"
                  id="fileInput"
                  accept="image/*,video/*"
                  style={{ display: "none" }}
                  onChange={(event) =>
                    handleFileSelect(event.target.files?.[0] || null)
                  }
                />
              </div>

              {fileInfo ? (
                <div className="file-preview">
                  <div className="file-info">
                    <span>
                      <i
                        className="fas fa-check-circle"
                        style={{ color: "var(--success)" }}
                      ></i>{" "}
                      {fileInfo.name}
                    </span>
                    <span>{fileInfo.size}</span>
                  </div>
                </div>
              ) : null}

              <div className="form-group">
                <label>Icon Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter icon name"
                  value={iconName}
                  onChange={(event) => setIconName(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  className="category-select"
                  value={iconCategory}
                  onChange={(event) => setIconCategory(event.target.value)}
                >
                  {categoryGroups.map((group) => (
                    <optgroup key={group.main} label={getMainCategoryName(group.main)}>
                      {group.subs.map((sub) => (
                        <option key={`${group.main}-${sub}`} value={`${group.main}-${sub}`}>
                          {sub}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., food, pizza, italian"
                  value={iconTags}
                  onChange={(event) => setIconTags(event.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn btn-success"
                style={{ width: "100%" }}
                onClick={handleUploadIcon}
                disabled={isUploading}
              >
                <i className="fas fa-save"></i>{" "}
                {isUploading ? "Uploading..." : "Save Icon"}
              </button>
            </div>
          )}

          {activeSection === "manage" && (
            <div>
              <div className="content-header">
                <h2 className="content-title">Manage Icons</h2>
              </div>

              <div className="search-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search icons..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Preview</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Size</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIcons.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center" }}>
                          No icons found
                        </td>
                      </tr>
                    ) : (
                      filteredIcons.map((icon) => (
                        <tr key={icon.id}>
                          <td>
                            <img
                              src={icon.fileData || "https://via.placeholder.com/40"}
                              className="icon-preview-small"
                              alt={icon.name}
                            />
                          </td>
                          <td>{icon.name}</td>
                          <td>
                            <span className="category-tag">
                              {getMainCategoryName(icon.mainCategory)} /{" "}
                              {getSubCategoryName(
                                icon.mainCategory,
                                icon.subCategory
                              )}
                            </span>
                          </td>
                          <td>{icon.date || "N/A"}</td>
                          <td>{icon.fileSize || "N/A"}</td>
                          <td>
                            <div className="action-btns">
                              <button
                                className="action-btn edit"
                                type="button"
                                onClick={() => handleEditIcon(icon)}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="action-btn delete"
                                type="button"
                                onClick={() => handleDeleteIcon(icon.id)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === "categories" && (
            <div>
              <div className="content-header">
                <h2 className="content-title">Categories Management</h2>
                <button
                  className="btn btn-success"
                  onClick={openAddCategory}
                >
                  <i className="fas fa-plus"></i> Add Category
                </button>
              </div>

              <div className="manage-icons-list">
                <table className="manage-icons-table">
                  <thead>
                    <tr>
                      <th>Main Category</th>
                      <th>Sub Category</th>
                      <th>Icon Count</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <tr key={category._id}>
                          <td>{getMainCategoryName(category.mainCategory)}</td>
                          <td>{category.subCategory}</td>
                          <td>{category.iconCount}</td>
                          <td>{new Date(category.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => openEditCategory(category)}
                                title="Edit"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => openDeleteConfirm(category)}
                                title="Delete"
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                          No categories found. Click &quot;Add Category&quot; to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === "settings" && (
            <div>
              <div className="content-header">
                <h2 className="content-title">Admin Settings</h2>
              </div>

              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>

              <button className="btn btn-primary" type="button" onClick={handleChangePassword}>
                <i className="fas fa-save"></i> Update Password
              </button>

              <hr style={{ margin: "2rem 0", borderColor: "var(--border)" }} />

              <h3 style={{ marginBottom: "1rem" }}>Storage Settings</h3>
              <div className="form-group">
                <label>Max File Size (MB)</label>
                <input type="number" className="form-control" defaultValue={5} />
              </div>

              <div className="form-group">
                <label>Allowed File Types</label>
                <select
                  className="category-select"
                  multiple
                  defaultValue={["PNG", "JPG", "SVG", "GIF"]}
                >
                  <option value="PNG">PNG</option>
                  <option value="JPG">JPG</option>
                  <option value="SVG">SVG</option>
                  <option value="GIF">GIF</option>
                </select>
              </div>
            </div>
          )}
        </section>
      </main>

      <div className={`modal ${showEditModal ? "active" : ""}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>Edit Icon</h3>
            <button
              className="modal-close"
              type="button"
              onClick={() => setShowEditModal(false)}
            >
              &times;
            </button>
          </div>

          <div className="form-group">
            <label>Icon Name</label>
            <input
              type="text"
              className="form-control"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              className="category-select"
              value={editCategory}
              onChange={(event) => setEditCategory(event.target.value)}
            >
              {categoryGroups.map((group) => (
                <optgroup key={group.main} label={getMainCategoryName(group.main)}>
                  {group.subs.map((sub) => (
                    <option key={`${group.main}-${sub}`} value={`${group.main}-${sub}`}>
                      {sub}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tags</label>
            <input
              type="text"
              className="form-control"
              value={editTags}
              onChange={(event) => setEditTags(event.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn btn-success"
            style={{ width: "100%" }}
            onClick={handleSaveEdit}
          >
            <i className="fas fa-save"></i> Save Changes
          </button>
        </div>
      </div>

      <div className={`modal ${showCategoryModal ? "active" : ""}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>{editingCategory ? "Edit Category" : "Add Category"}</h3>
            <button
              className="modal-close"
              type="button"
              onClick={() => setShowCategoryModal(false)}
            >
              &times;
            </button>
          </div>

          <div className="form-group">
            <label>Main Category</label>
            <select
              className="category-select"
              value={categoryMain}
              onChange={(event) => setCategoryMain(event.target.value)}
            >
              <option value="icon">Icon</option>
              <option value="logo">Logo</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>

          <div className="form-group">
            <label>Sub Category</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Food, Sports, Finance"
              value={categorySub}
              onChange={(event) => setCategorySub(event.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn btn-success"
            style={{ width: "100%" }}
            disabled={isProcessing}
            onClick={handleSaveCategory}
          >
            {isProcessing ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className={`fas fa-${editingCategory ? "save" : "plus"}`}></i>
            )}
            {" "}
            {editingCategory ? "Save Changes" : "Add Category"}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className={`modal ${showDeleteModal ? "active" : ""}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>Confirm Deletion</h3>
            <button
              className="modal-close"
              type="button"
              onClick={() => setShowDeleteModal(false)}
            >
              &times;
            </button>
          </div>

          <div style={{ padding: "20px 0", textAlign: "center" }}>
            <p>
              Are you sure you want to delete the category{" "}
              <strong>
                {deletingCategory
                  ? `${getMainCategoryName(deletingCategory.mainCategory)} / ${deletingCategory.subCategory}`
                  : ""}
              </strong>
              ?
            </p>
            <p style={{ color: "var(--danger)", fontSize: "14px", marginTop: "10px" }}>
              <i className="fas fa-exclamation-triangle"></i> This action cannot be undone.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="btn"
              style={{ flex: 1, backgroundColor: "var(--border)" }}
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              style={{ flex: 1 }}
              disabled={isProcessing}
              onClick={handleConfirmDelete}
            >
              {isProcessing ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-trash-alt"></i>
              )}
              {" "}
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className={`toast ${toastMessage ? "show" : ""}`}>
        {toastMessage}
      </div>
    </>
  );
};

export default AdminPanel;
