import { BrowserRouter, Route, Routes } from "react-router-dom";
import CampgroundAvailability from "./components/CampgroundAvailability/CampgroundAvailability";
import CampsitesPage from "./components/Campsite/CampsitesPage";
import MapView from "./components/Campsite/Map/MapView";
import FacilitiesFinder from "./components/Facility/FacilitiesFinder";
import Layout from "./components/Layout/Layout";
import ReservationManagement from "./components/ReservationManagement/ReservationMangement";

const App = () => (
  <BrowserRouter>
    <Layout>
      <Routes>
        <Route path="/" element={<FacilitiesFinder />} />
        <Route path="/campsites" element={<CampsitesPage />} />
        <Route path="/map-view" element={<MapView />} />
        <Route
          path="/campground-availability"
          element={<CampgroundAvailability />}
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
