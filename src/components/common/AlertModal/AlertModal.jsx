import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import "./alert-modal.scss";

const AlertModal = ({
  isOpen,
  onClose,
  onCreateAlert,
  title,
  subtitle,
  alertDetails,
  setAlertDetails,
  isCreatingAlert,
  forceUpdateCounter,
}) => {
  if (!isOpen) return null;

  // Closes the modal when clicking outside the modal content
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      key={`alert-modal-${isCreatingAlert}-${forceUpdateCounter}`}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {subtitle && <h3>{subtitle}</h3>}
        <input
          type="text"
          placeholder="Name"
          value={alertDetails.name}
          onChange={(e) =>
            setAlertDetails((prev) => ({ ...prev, name: e.target.value }))
          }
          disabled={isCreatingAlert}
        />
        <input
          type="email"
          placeholder="Email"
          value={alertDetails.email}
          onChange={(e) =>
            setAlertDetails((prev) => ({
              ...prev,
              email: e.target.value,
            }))
          }
          disabled={isCreatingAlert}
        />
        <label>Start Date:</label>
        <input
          type="date"
          value={alertDetails.startDate}
          onChange={(e) =>
            setAlertDetails((prev) => ({
              ...prev,
              startDate: e.target.value,
            }))
          }
          disabled={isCreatingAlert}
        />
        <label>End Date:</label>
        <input
          type="date"
          value={alertDetails.endDate}
          onChange={(e) =>
            setAlertDetails((prev) => ({
              ...prev,
              endDate: e.target.value,
            }))
          }
          disabled={isCreatingAlert}
        />
        <div className="modal-buttons">
          <button
            onClick={onCreateAlert}
            disabled={isCreatingAlert}
            className="create-alert-btn"
          >
            {isCreatingAlert ? (
              <>
                <LoadingSpinner size="small" />
                <span style={{ marginLeft: "8px" }}>Creating...</span>
              </>
            ) : (
              "Create Alert"
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isCreatingAlert}
            className="cancel-btn"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

AlertModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreateAlert: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  alertDetails: PropTypes.shape({
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
  }).isRequired,
  setAlertDetails: PropTypes.func.isRequired,
  isCreatingAlert: PropTypes.bool.isRequired,
  forceUpdateCounter: PropTypes.number.isRequired,
};

export default AlertModal;
