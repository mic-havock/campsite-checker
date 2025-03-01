import { BrowserRouter, Route, Routes } from "react-router-dom";
import CampsitesPage from "./components/Campsite/CampsitesPage";
import MapView from "./components/Campsite/MapView";
import FacilitiesFinder from "./components/Facility/FacilitiesFinder";
import ReservationDetailsPage from "./components/Reservations/ReservationDetailsPage";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<FacilitiesFinder />} />
      <Route path="/campsites" element={<CampsitesPage />} />
      <Route path="/map-view" element={<MapView />} />
      <Route path="/reservation-details" element={<ReservationDetailsPage />} />
    </Routes>
  </BrowserRouter>
);

export default App;
