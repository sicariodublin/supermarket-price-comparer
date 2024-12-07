// App.js
import React from "react";
import { Route, Routes } from "react-router-dom";
import AddProduct from "./components/AddProduct";
import EditProduct from "./components/EditProduct";
import FeedbackForm from "./components/FeedbackForm";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Logout from "./components/Logout";
import SearchPage from "./components/SearchPage";
import VerifyEmail from "./components/VerifyEmail";
import AboutUs from "./pages/About-us";
import ContactUs from "./pages/Contact-us";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import Login from "./pages/Login";
import PrivacyPolicy from "./pages/Privacy-policy";
import Register from "./pages/Register";
import TermsOfService from "./pages/Terms-of-service";
import DashboardReact from "./routes/dashboardReact"; // DashboardRoutes file

function App() {
  return (
    <>
      <Header />
      <div className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/edit-product" element={<EditProduct />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/dashboard/*" element={<DashboardReact />} />

          {/* Dashboard Routes */}
        </Routes>
      </div>
      <FeedbackForm />
      <Footer />
    </>
  );
}

export default App;
