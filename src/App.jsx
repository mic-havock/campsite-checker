import { BrowserRouter, Route, Routes } from "react-router-dom";
import CampsitesPage from "./components/Campsite/CampsitesPage";
import FacilitiesFinder from "./components/FacilitiesFinder";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<FacilitiesFinder />} />
      <Route path="/campsites" element={<CampsitesPage />} />
    </Routes>
  </BrowserRouter>
);

export default App;
