import React from "react";
import "./Loader.css";

export const Loader = () => {
  return (
    <div className="loader-overlay">
      <div className="loader-spinner"></div>
      <p className="loader-text">Loading EduFlow...</p>
    </div>
  );
};

export default Loader;