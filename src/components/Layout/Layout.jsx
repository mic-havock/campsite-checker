import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./layout.scss";

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMainPage = location.pathname === "/";
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const mainRef = useRef(null);
  const prevPathname = useRef(location.pathname);

  // Scroll to top when actual page navigation occurs (not internal state changes)
  useEffect(() => {
    if (prevPathname.current !== location.pathname) {
      // Use a timeout to ensure scroll reset happens after browser's default restoration
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        if (mainRef.current) {
          mainRef.current.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
      }, 0);
      prevPathname.current = location.pathname;
    }
  }, [location.pathname]);

  // Update viewport height variable for mobile browsers (fixes 100vh issues)
  useEffect(() => {
    const setVhVariable = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Handle window resize for responsive layout
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setVhVariable();
    };

    // Set initial value
    setVhVariable();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {!isMainPage && (
        <header className="global-header">
          <div className="header-content">
            <div className="header-left">
              {!isMainPage && (
                <button
                  onClick={() => navigate("/")}
                  className="back-to-search-btn"
                  aria-label="Back"
                >
                  ← Back
                </button>
              )}
            </div>
            <div className="header-center">
              <Link to="/" className="logo-link">
                <img
                  src="/kampscout.svg"
                  alt="Kampscout Logo"
                  className="logo-img"
                />
              </Link>
            </div>
            <div className="header-right">
              {location.pathname !== "/reservation-management" && (
                <button
                  onClick={() => navigate("/reservation-management")}
                  className="alert-management-btn"
                  aria-label="Manage Reservation Alerts"
                >
                  {isMobile ? "Alerts" : "Manage Reservation Alerts"}
                </button>
              )}
            </div>
          </div>
        </header>
      )}
      <main ref={mainRef} className="flex-grow">
        {children}
      </main>
      {/* Footer centered using inline styles */}
      <footer
        style={{
          height: "5rem",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 1rem",
          flexShrink: 0,
        }}
      >
        <p
          style={{ color: "#4B5563", fontStyle: "italic", textAlign: "center" }}
        >
          {" "}
          {/* text-gray-600 equivalent */}© 2026 Kampscout. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
