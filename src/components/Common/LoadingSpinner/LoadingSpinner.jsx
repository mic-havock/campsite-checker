import PropTypes from "prop-types";
import React from "react";
import "./loading-spinner.scss";

//  Loading spinner component that can be used inline or as a full-page loader
const LoadingSpinner = ({ fullPage = false, size = "medium" }) => {
  const spinner = <div className={`loading-spinner ${size}`} />;

  return fullPage ? (
    <div className="page-loader" role="status" aria-label="Loading">
      {spinner}
    </div>
  ) : (
    spinner
  );
};

LoadingSpinner.propTypes = {
  fullPage: PropTypes.bool,
  size: PropTypes.oneOf(["small", "medium", "large"]),
};

export default React.memo(LoadingSpinner);
