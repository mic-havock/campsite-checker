import "./loading-spinner.scss";

const LoadingSpinner = ({ fullPage = false, size = "medium" }) => {
  if (fullPage) {
    return (
      <div className="page-loader">
        <div className={`loading-spinner ${size}`} />
      </div>
    );
  }

  return <div className={`loading-spinner ${size}`} />;
};

export default LoadingSpinner;
