import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    closeMenu();
    navigate("/");
  };

  return (
    <header className="nav-wrap">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/" onClick={closeMenu}>Nexus3D</Link>
        </div>

        <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
          <Link to="/" onClick={closeMenu}>Home</Link>
          <Link to="/services" onClick={closeMenu}>Services</Link>
          <Link to="/materials" onClick={closeMenu}>Materials</Link>
          <Link to="/pricing" onClick={closeMenu}>Pricing</Link>
          <Link to="/how-it-works" onClick={closeMenu}>How It Works</Link>
          {isLoggedIn && <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>}

          {isLoggedIn ? (
            <button className="signin nav-mobile-action" onClick={handleLogout}>Sign Out</button>
          ) : (
            <Link to="/auth" onClick={closeMenu}>
              <button className="signin nav-mobile-action">Sign In</button>
            </Link>
          )}
        </nav>

        <div className="nav-actions">
          {isLoggedIn ? (
            <button className="signin nav-desktop-action" onClick={handleLogout}>Sign Out</button>
          ) : (
            <Link to="/auth">
              <button className="signin nav-desktop-action">Sign In</button>
            </Link>
          )}

          <button
            className={`nav-toggle ${menuOpen ? "active" : ""}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
