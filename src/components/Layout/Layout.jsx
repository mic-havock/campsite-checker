import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

/**
 * Layout component that wraps the application content with header and footer
 * Header is hidden on the main page (FacilitiesFinder)
 */
const Layout = ({ children }) => {
  const location = useLocation();
  const isMainPage = location.pathname === "/";
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const mainRef = useRef(null);

  // Scroll to top when location changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollIntoView({ behavior: "instant" });
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
        <header>
          <div>
            <Link to="/">
              <img
                src="kampscout.svg"
                alt="Kampscout Logo"
                className="h-[150px] mx-auto block"
                style={{
                  height: isMobile ? "100px" : "150px",
                  display: "block",
                  marginLeft: "auto",
                  marginRight: "auto",
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
          {/* text-gray-600 equivalent */}© {new Date().getFullYear()}{" "}
          Kampscout. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
