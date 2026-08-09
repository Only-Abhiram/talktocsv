import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import BackendGate from "./backendGate.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
   <BackendGate />
  </React.StrictMode>
);
