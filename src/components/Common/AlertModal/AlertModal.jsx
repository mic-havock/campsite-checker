import PropTypes from "prop-types";
import { useRef } from "react";
import { createPortal } from "react-dom";
import reservationsAPI from "../../../api/reservations";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import "./alert-modal.scss";

const AlertModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  alertDetails,
  setAlertDetails,
  isCreatingAlert,
  setIsCreatingAlert,
  selectedCampsite,
  campsiteName,
  forceUpdateCounter,
}) => {
  const isSubmitting = useRef(false);

  if (!isOpen) return null;

  // Closes the modal when clicking outside the modal content
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  // Clear form data and close modal
  const handleClose = () => {
    setAlertDetails({ name: "", email: "", startDate: "", endDate: "" });
    onClose();
  };

  const handleCreateAlert = async () => {
    if (isSubmitting.current) return;

    const { name, email, startDate, endDate } = alertDetails;
    if (!name || !email || !startDate || !endDate) {
      alert("Please fill in all fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    isSubmitting.current = true;
    setIsCreatingAlert(true);

    const reservationData = {
      name,
      email_address: email,
      campsite_id: selectedCampsite.CampsiteID || selectedCampsite.campsite_id,
      campsite_number: selectedCampsite.site || selectedCampsite.CampsiteName,
      campsite_name: campsiteName,
      reservation_start_date: startDate,
      reservation_end_date: endDate,
      monitoring_active: true,
      attempts_made: 0,
      success_sent: false,
    };

    try {
      const result = await reservationsAPI.create(reservationData);
      setIsCreatingAlert(false);
      isSubmitting.current = false;
      handleClose();
      window.setTimeout(() => {
        alert(
          `Alert created successfully! Reservation ID: ${result.id}\n\nIf your selection becomes available, you will receive an email.`
        );
      }, 20);
    } catch (error) {
      setIsCreatingAlert(false);
      isSubmitting.current = false;
      window.setTimeout(() => {
        alert(error.message || "Failed to create alert. Please try again.");
      }, 20);
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
            onClick={handleCreateAlert}
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
            onClick={handleClose}
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
  setIsCreatingAlert: PropTypes.func.isRequired,
  selectedCampsite: PropTypes.object.isRequired,
  campsiteName: PropTypes.string.isRequired,
  forceUpdateCounter: PropTypes.number.isRequired,
};

export default AlertModal;
