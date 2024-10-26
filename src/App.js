import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import FeedbackForm from './components/FeedbackForm.js';
import Footer from './components/Footer';
import Header from './components/Header';
import AboutUs from './pages/About-us.js';
import ContactUs from './pages/Contact-us.js';
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks.js';
import Login from './pages/Login';
import PrivacyPolicy from './pages/Privacy-policy.js';
import Register from './pages/Register';
import SearchPage from './pages/SearchPage';
import TermsOfService from './pages/Terms-of-service.js';


function App() {
  return (
    <Router>
    <Header />
    <FeedbackForm />
    <Routes>
      <Route path="/" element={<Home />} exact />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/about-us" element={<AboutUs />} />
      <Route path="/contact-us" element={<ContactUs />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    </Routes>
    <Footer />
  </Router>
);
}
export default App;
