import { BrowserRouter, Route, Routes } from "react-router-dom";
import CampsitesPage from "./components/Campsite/CampsitesPage";
import FacilitiesFinder from "./components/FacilitiesFinder";
import ReservationDetailsPage from "./components/Reservations/ReservationDetailsPage";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<FacilitiesFinder />} />
      <Route path="/campsites" element={<CampsitesPage />} />
      <Route path="/reservation-details" element={<ReservationDetailsPage />} />
    </Routes>
  </BrowserRouter>
);

export default App;
