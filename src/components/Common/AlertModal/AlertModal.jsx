import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [step, setStep] = useState(1);
  const [mustHaves, setMustHaves] = useState({
    minElectric: "",
    minVehicleLength: "",
  });

  // Closes the modal when clicking outside the modal content
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  // Clear form data and close modal
  const handleClose = useCallback(() => {
    setAlertDetails({ name: "", email: "", startDate: "", endDate: "" });
    setStep(1);
    onClose();
  }, [onClose, setAlertDetails]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

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
          min_electric: mustHaves.minElectric,
          min_vehicle_length: mustHaves.minVehicleLength,
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

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <p className="step-label">STEP 1 OF 3</p>
            <h2>Confirm Dates</h2>
            <div className="form-group">
              <label htmlFor="start-date">First Night:</label>
              <input
                id="start-date"
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
            </div>
            <div className="form-group">
              <label htmlFor="end-date">Last Night:</label>
              <input
                id="end-date"
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
            </div>
            <div className="modal-buttons">
              <button className="next-btn" onClick={() => setStep(2)}>
                Next: Must-Haves →
              </button>
              <button onClick={handleClose} className="cancel-btn">
                Cancel
              </button>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <p className="step-label">STEP 2 OF 3</p>
            <h2>Select Must-Haves</h2>
            <div className="form-group">
              <label>Minimum Electric:</label>
              <select
                value={mustHaves.minElectric}
                onChange={(e) =>
                  setMustHaves((prev) => ({
                    ...prev,
                    minElectric: e.target.value,
                  }))
                }
              >
                <option value="">Any</option>
                <option value="30">30 Amp</option>
                <option value="50">50 Amp</option>
              </select>
            </div>
            <div className="form-group">
              <label>Minimum Vehicle Length (ft):</label>
              <input
                type="number"
                placeholder="e.g. 30"
                value={mustHaves.minVehicleLength}
                onChange={(e) =>
                  setMustHaves((prev) => ({
                    ...prev,
                    minVehicleLength: e.target.value,
                  }))
                }
              />
            </div>
            <div className="modal-buttons">
              <button className="next-btn" onClick={() => setStep(3)}>
                Next: Contact Info →
              </button>
              <button onClick={() => setStep(1)} className="back-btn">
                ← Back
              </button>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <p className="step-label">STEP 3 OF 3</p>
            <h2>Contact Info</h2>
            <div className="form-group">
              <input
                type="text"
                placeholder="Name"
                value={alertDetails.name}
                onChange={(e) =>
                  setAlertDetails((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
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
              />
            </div>
            <div className="modal-buttons">
              <button
                onClick={handleCreateAlert}
                disabled={isCreatingAlert}
                className="create-alert-btn"
              >
                {isCreatingAlert ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>Creating...</span>
                  </>
                ) : (
                  "Create Monitor"
                )}
              </button>
              <button onClick={() => setStep(2)} className="back-btn">
                ← Back
              </button>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const modalContent = (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      key={`alert-modal-${step}`}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {subtitle && <h3 className="modal-subtitle">{subtitle}</h3>}
        {renderStep()}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

AlertModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
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
