import * as React from "react";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";

type HeaderProps = {
  onNavigate: (route: "home" | "library" | "admin" | "admin-panel") => void;
  showThemeToggle?: boolean;
  theme?: "light" | "dark";
  onToggleTheme?: (checked: boolean) => void;
};

const Header = ({
  onNavigate,
  showThemeToggle = true,
  theme,
  onToggleTheme
}: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when navigating or resizing to desktop
  const handleNavigate = (route: "home" | "library" | "admin" | "admin-panel") => {
    setIsMenuOpen(false);
    onNavigate(route);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isMenuOpen]);

  return (
    <header className="header" role="banner">
      <div className="header-content" key="header-content">
        <div className="logo" onClick={() => handleNavigate("home")} aria-label="IconLibrary Home">
          <i className="fas fa-icons" aria-hidden="true"></i>
          <span>IconLibrary</span>
        </div>

        <button
          className={`hamburger ${isMenuOpen ? "active" : ""}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
          aria-controls="nav-menu"
        >
          <span className="hamburger-box">
            <span className="hamburger-inner"></span>
          </span>
        </button>

        <nav
          id="nav-menu"
          className={`nav-links ${isMenuOpen ? "active" : ""}`}
          role="navigation"
        >
          <button
            type="button"
            className="nav-link nav-button"
            onClick={() => handleNavigate("home")}
          >
            <i className="fas fa-home" aria-hidden="true"></i> Home
          </button>
          <button
            type="button"
            className="nav-link nav-button"
            onClick={() => handleNavigate("library")}
          >
            <i className="fas fa-eye" aria-hidden="true"></i> Library
          </button>
          <button
            type="button"
            className="nav-link nav-button"
            onClick={() => handleNavigate("admin")}
          >
            <i className="fas fa-lock" aria-hidden="true"></i> Admin
          </button>
          {showThemeToggle && onToggleTheme ? (
            <div className="nav-theme-toggle">
              <ThemeToggle
                checked={theme === "dark"}
                onChange={onToggleTheme}
              />
              <span className="mobile-only">Toggle Theme</span>
            </div>
          ) : null}
        </nav>

        {isMenuOpen && (
          <div
            className="nav-overlay"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </div>
    </header>
  );
};

export default Header;
