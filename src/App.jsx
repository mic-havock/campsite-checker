import { BrowserRouter, Route, Routes } from "react-router-dom";
import CampsitesPage from "./components/Campsite/CampsitesPage";
import MapView from "./components/Campsite/Map/MapView";
import FacilitiesFinder from "./components/Facility/FacilitiesFinder";
import Layout from "./components/Layout/Layout";
import ReservationManagement from "./components/ReservationManagement/ReservationMangement";
import ReservationDetailsPage from "./components/Reservations/ReservationDetailsPage";

const App = () => (
  <BrowserRouter>
    <Layout>
      <Routes>
        <Route path="/" element={<FacilitiesFinder />} />
        <Route path="/campsites" element={<CampsitesPage />} />
        <Route path="/map-view" element={<MapView />} />
        <Route
          path="/reservation-details"
          element={<ReservationDetailsPage />}
        />
        <Route
          path="/reservation-management"
          element={<ReservationManagement />}
        />
      </Routes>
    </Layout>
  </BrowserRouter>
);

export default App;
