import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";

/**
 * Layout component that wraps the application content with header and footer
 * Header is hidden on the main page (FacilitiesFinder)
 */
const Layout = ({ children }) => {
  const location = useLocation();
  const isMainPage = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col">
      {!isMainPage && (
        <header>
          <div>
            <Link to="/">
              <img
                src="kampscout.svg"
                alt="Kampscout Logo"
                className="h-[150px] mx-auto block"
                style={{
                  height: "150px",
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
      <main className="flex-grow">{children}</main>
      {/* Footer centered using inline styles */}
      <footer
        style={{
          height: "5rem",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#4B5563", fontStyle: "italic" }}>
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
