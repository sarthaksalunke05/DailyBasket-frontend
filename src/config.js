const isProd = window.location.hostname !== 'localhost';
export const API = isProd 
  ? "https://shopg-backend.onrender.com/api" 
  : "http://localhost:5000/api";
