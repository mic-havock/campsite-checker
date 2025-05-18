import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CampgroundAvailability from "./components/CampgroundAvailability/CampgroundAvailability";
import CampsitesPage from "./components/Campsite/CampsitesPage";
import MapView from "./components/Campsite/Map/MapView";
import FacilitiesFinder from "./components/Facility/FacilitiesFinder";
import Layout from "./components/Layout/Layout";
import NotFound from "./components/NotFound/NotFound";
import ReservationManagement from "./components/ReservationManagement/ReservationMangement";

const App = () => (
  <HelmetProvider>
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </HelmetProvider>
);

export default App;
