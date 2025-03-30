import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";

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
          </div>
        </header>
      )}
      <main className="flex-grow">{children}</main>
      <footer className="h-20" />
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
