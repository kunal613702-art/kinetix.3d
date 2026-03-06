import ScrollToTop from "./components/ScrollToTop";
import ModelingBlog from "./pages/ModelingBlog";
import PostProcessingBlog from "./pages/PostProcessingBlog";
import ScanningBlog from "./pages/ScanningBlog";
import Contact from "./pages/Contact";
import PrintingBlog from "./pages/PrintingBlog";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Services from "./pages/Services";
import Materials from "./pages/Materials";
import Pricing from "./pages/Pricing";
import Upload from "./pages/Upload";
import HowItWorks from "./pages/HowItWorks";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";


function AppContent() {

    const location = useLocation();

    // Hide navbar on these pages
    const hideNavbar =
        location.pathname === "/auth" ||
        location.pathname === "/payment" ||
        location.pathname === "/payment/success";

    return (

        <>

            {!hideNavbar && <Navbar />}

            <Routes>
                <Route
                    path="/payment"
                    element={
                        <ProtectedRoute>
                            <Payment />
                        </ProtectedRoute>
                    }
                />
                <Route path="/payment/success" element={<PaymentSuccess />} />

                <Route path="/blog/3d-modeling" element={<ModelingBlog />} />

                <Route path="/blog/post-processing" element={<PostProcessingBlog />} />

                <Route path="/blog/3d-scanning" element={<ScanningBlog />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/blog/3d-printing" element={<PrintingBlog />} />

                <Route path="/" element={<Home />} />

                <Route path="/services" element={<Services />} />

                <Route path="/materials" element={<Materials />} />

                <Route path="/pricing" element={<Pricing />} />

                <Route path="/upload" element={<Upload />} />

                <Route path="/how-it-works" element={<HowItWorks />} />

                <Route path="/auth" element={<Auth />} />

                <Route path="/dashboard" element={<Dashboard />} />

            </Routes>

        </>

    );

}

function ProtectedRoute({ children }) {
    const location = useLocation();
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
    }

    return children;
}


export default function App() {

    return (

        <BrowserRouter>
            <ScrollToTop />

            <AppContent />

        </BrowserRouter>

    );

}
