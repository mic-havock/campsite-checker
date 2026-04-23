import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import CampgroundAvailability from "./components/CampgroundAvailability/CampgroundAvailability";
import CampsiteExplorer from "./components/Campsite/CampsiteExplorer";
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
          <Route path="/campsites" element={<CampsiteExplorer />} />
          <Route
            path="/campground-availability"
            element={<CampgroundAvailability />}
          />
          <Route
            path="/reservation-management"
            element={<ReservationManagement />}
          />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </HelmetProvider>
);

export default App;
