import { BrowserRouter, Route, Routes } from "react-router-dom";
import CampsitesPage from "./components/Campsite/CampsitesPage";
import MapView from "./components/Campsite/Map/MapView";
import FacilitiesFinder from "./components/Facility/FacilitiesFinder";
import ReservationManagement from "./components/ReservationManagement/ReservationMangement";
import ReservationDetailsPage from "./components/Reservations/ReservationDetailsPage";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<FacilitiesFinder />} />
      <Route path="/campsites" element={<CampsitesPage />} />
      <Route path="/map-view" element={<MapView />} />
      <Route path="/reservation-details" element={<ReservationDetailsPage />} />
      <Route
        path="/reservation-management"
        element={<ReservationManagement />}
      />
    </Routes>
  </BrowserRouter>
);

export default App;
