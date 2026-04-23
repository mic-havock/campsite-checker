import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

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
      if (mainRef.current) {
        mainRef.current.scrollIntoView({ behavior: "instant" });
      }
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
    <div className="min-h-screen flex flex-col full-height">
      {!isMainPage && (
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
            backgroundColor: "#ebede3",
            padding: "0.5rem 1rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <button
              onClick={() => navigate("/")}
              style={{
                position: "absolute",
                left: 0,
                backgroundColor: "transparent",
                color: "#2b4c1c",
                border: "1px solid rgba(43, 76, 28, 0.3)",
                padding: "0.4rem 0.8rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                borderRadius: "8px",
                cursor: "pointer",
              }}
              aria-label="Back to search"
            >
              ← Back to Search
            </button>
            <Link to="/" style={{ display: "block" }}>
              <img
                src="kampscout.svg"
                alt="Kampscout Logo"
                style={{
                  height: isMobile ? "60px" : "100px",
                  display: "block",
                  margin: "0 auto",
                  maxWidth: "100%",
                }}
              />
            </Link>
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
