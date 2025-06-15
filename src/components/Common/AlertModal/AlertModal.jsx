import PropTypes from "prop-types";
import { useRef } from "react";
import { createPortal } from "react-dom";
import {
  createBulkReservations,
  createReservation,
} from "../../../api/reservations";
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
  selectedCampsites,
  campsiteName,
  isBulkAlert,
  facilityId,
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

    try {
      if (isBulkAlert && selectedCampsites?.length > 0) {
        // Create alerts for all selected campsites
        const reservations = selectedCampsites.map((campsite) => ({
          name,
          email_address: email,
          campsite_id:
            campsite.campsiteObj.CampsiteID || campsite.campsiteObj.campsite_id,
          campsite_number: campsite.campsite,
          campsite_name: campsiteName,
          facility_id: facilityId,
          reservation_start_date: startDate,
          reservation_end_date: endDate,
          monitoring_active: true,
          attempts_made: 0,
          success_sent: false,
        }));

        await createBulkReservations(reservations);
        setIsCreatingAlert(false);
        isSubmitting.current = false;
        handleClose();
        window.setTimeout(() => {
          alert(
            `Successfully created alerts for ${selectedCampsites.length} campsites!\n\nYou will receive a confirmation email shortly.\n\nIf any of your selections become available, you will receive email notifications.`
          );
        }, 20);
      } else {
        // Single campsite alert
        const reservationData = {
          name,
          email_address: email,
          campsite_id:
            selectedCampsite.CampsiteID || selectedCampsite.campsite_id,
          campsite_number:
            selectedCampsite.site || selectedCampsite.CampsiteName,
          campsite_name: campsiteName,
          facility_id: facilityId,
          reservation_start_date: startDate,
          reservation_end_date: endDate,
          monitoring_active: true,
          attempts_made: 0,
          success_sent: false,
        };

        await createReservation(reservationData);
        setIsCreatingAlert(false);
        isSubmitting.current = false;
        handleClose();
        window.setTimeout(() => {
          alert(
            `Alert created successfully!\n\nYou will receive a confirmation email shortly.\n\nIf your selection becomes available, you will receive another email notification.`
          );
        }, 20);
      }
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
      key={`alert-modal-${isCreatingAlert}`}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {subtitle && <h3>{subtitle}</h3>}
        {isBulkAlert && selectedCampsites?.length > 0 && (
          <div className="selected-campsites">
            <p>Selected Campsites:</p>
            <ul>
              {selectedCampsites.map((campsite) => (
                <li key={campsite.campsite}>
                  {campsite.campsite} - {campsite.loop}
                </li>
              ))}
            </ul>
          </div>
        )}
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
        <label>First Night:</label>
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
        <label>Last Night:</label>
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
              "Create"
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
  selectedCampsite: PropTypes.object,
  selectedCampsites: PropTypes.arrayOf(PropTypes.object),
  campsiteName: PropTypes.string.isRequired,
  isBulkAlert: PropTypes.bool,
  facilityId: PropTypes.string,
};

AlertModal.defaultProps = {
  isBulkAlert: false,
};

export default AlertModal;
