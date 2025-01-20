import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Ensure this matches the corrected App.jsx
import "./index.css"; // Adjust or remove if you don't have this file

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
