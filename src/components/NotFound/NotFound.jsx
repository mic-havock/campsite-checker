import { Link } from "react-router-dom";
import "./not-found.scss";

const NotFound = () => {
  return (
    <div className="not-found">
      <div className="not-found__content">
        <h1 className="not-found__title">404</h1>
        <h2 className="not-found__subtitle">Page Not Found</h2>
        <p className="not-found__message">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to="/" className="not-found__button">
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
