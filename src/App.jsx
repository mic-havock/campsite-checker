import { BrowserRouter, Route, Routes } from "react-router-dom";
import CampsitesPage from "./components/Campsite/CampsitesPage";
import MapView from "./components/Campsite/Map/MapView";
import FacilitiesFinder from "./components/Facility/FacilitiesFinder";
import ReservationDetailsPage from "./components/Reservations/ReservationDetailsPage";
import UserManagement from "./components/UserManagement/UserManagement";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<FacilitiesFinder />} />
      <Route path="/campsites" element={<CampsitesPage />} />
      <Route path="/map-view" element={<MapView />} />
      <Route path="/reservation-details" element={<ReservationDetailsPage />} />
      <Route path="/user-management" element={<UserManagement />} />
    </Routes>
  </BrowserRouter>
);

export default App;
