import { useNavigate } from "react-router-dom";
import "../App.css";
import heroImage from "../assets/hero.png";
import { Link } from "react-router-dom";
function Home() {
    const navigate = useNavigate();


    return (
        <div className="page">

            <div
                className="container"
                style={{ backgroundImage: `url(${heroImage})` }}
            >



                <section className="hero">
                    <h1>
                        PRINT YOUR IDEAS <br />
                        INTO REALITY
                    </h1>

                    <div className="buttons">
                        <Link to="/upload" className="hero-btn black">

                            Upload STL

                        </Link>
                        <button
                            className="cta-secondary"

                            onClick={() => navigate("/contact")}

                        >

                            Contact Us

                        </button>

                    </div>
                </section>

            </div>
            <section id="how" className="how-section">

                <h2 className="how-title">How It Works</h2>

                <div className="how-grid">

                    <div className="how-card">
                        <div className="step-number">01</div>
                        <h3>Upload Your STL</h3>
                        <p>Upload your 3D model file in STL or OBJ format.</p>
                    </div>

                    <div className="how-card">
                        <div className="step-number">02</div>
                        <h3>Select Material</h3>
                        <p>Choose from PLA, ABS, Resin, Nylon and more.</p>
                    </div>

                    <div className="how-card">
                        <div className="step-number">03</div>
                        <h3>Instant Pricing</h3>
                        <p>Get automatic cost calculation based on material and size.</p>
                    </div>

                    <div className="how-card">
                        <div className="step-number">04</div>
                        <h3>Fast Delivery</h3>
                        <p>We print, finish and ship your product quickly.</p>
                    </div>

                </div>

            </section>
            {/* ================= SERVICES SECTION ================= */}

            <section id="services" className="services-section">

                <h2 className="services-title">Our Services</h2>

                <p className="services-sub">
                    Reliable FDM 3D printing solutions for prototypes,
                    functional parts and creative projects.
                </p>

                <div className="services-grid">

                    <div className="service-card">
                        <h3>Custom 3D Printing</h3>
                        <p>
                            High-quality FDM printing using materials like PLA and ABS.
                            Perfect for prototypes and functional components.
                        </p>
                        <button
                            className="learn-btn"
                            onClick={() => navigate("/services")}
                        >
                            Learn More -&gt;
                        </button>
                    </div>

                    <div className="service-card">
                        <h3>Rapid Prototyping</h3>
                        <p>
                            Fast turnaround for students, startups and engineers
                            who need physical models for testing and validation.
                        </p>
                        <button
                            className="learn-btn"
                            onClick={() => navigate("/services")}
                        >
                            Learn More -&gt;
                        </button>
                    </div>

                    <div className="service-card">
                        <h3>Design Assistance</h3>
                        <p>
                            Need help preparing your model? We assist in optimizing
                            designs for successful and accurate 3D printing.
                        </p>
                        <button
                            className="learn-btn"
                            onClick={() => navigate("/contact")}
                        >
                            Learn More -&gt;
                        </button>
                    </div>

                </div>

            </section>
            {/* ================= GOD LEVEL WHY SECTION ================= */}

            <section className="why-god">

                <div className="why-container">

                    <div className="why-left">

                        <h2 className="why-heading">
                            Precision.<br />
                            Speed.<br />
                            Reliability.
                        </h2>

                        <p className="why-description">
                            We don't just print models.
                            We build physical experiences with carefully tuned machines,
                            fast production cycles and hands-on support.
                        </p>

                        <button className="why-cta" onClick={() => navigate("/upload")}> 
                            Start Your Print -&gt;
                        </button>

                    </div>


                    <div className="why-right">

                        <div className="why-glow"></div>

                        <div className="why-card card-1">
                            <h3>Precision Tuned</h3>
                            <p>Calibrated FDM machines for consistent dimensional accuracy.</p>
                        </div>

                        <div className="why-card card-2">
                            <h3>Fast Turnaround</h3>
                            <p>Quick production cycles so you can iterate faster.</p>
                        </div>

                        <div className="why-card card-3">
                            <h3>Direct Support</h3>
                            <p>Real assistance in optimizing your designs before printing.</p>
                        </div>

                        <div className="why-card card-4">
                            <h3>Transparent Pricing</h3>
                            <p>No hidden charges. Simple and fair pricing.</p>
                        </div>

                    </div>

                </div>

            </section>
            {/* ================= MATERIALS SECTION ================= */}

            <section className="materials-section">

                <h2 className="materials-title">
                    Materials We Print With
                </h2>

                <p className="materials-sub">
                    Reliable FDM materials suitable for prototypes,
                    functional parts and creative projects.
                </p>

                <div className="materials-grid">

                    {/* PLA */}

                    <div className="material-card">

                        <h3>PLA</h3>

                        <p>
                            Smooth finish and affordable option.
                            Perfect for prototypes, models and student projects.
                        </p>

                        <span className="material-tag">
                            Beginner Friendly
                        </span>

                    </div>


                    {/* ABS */}

                    <div className="material-card">

                        <h3>ABS</h3>

                        <p>
                            Strong and heat resistant material ideal
                            for functional parts and mechanical use.
                        </p>

                        <span className="material-tag">
                            High Strength
                        </span>

                    </div>


                    {/* PETG */}

                    <div className="material-card">

                        <h3>PETG</h3>

                        <p>
                            Durable and impact resistant.
                            Great for outdoor and long lasting prints.
                        </p>

                        <span className="material-tag">
                            Outdoor Durable
                        </span>

                    </div>


                    {/* TPU OPTIONAL */}

                    <div className="material-card">

                        <h3>TPU</h3>

                        <p>
                            Flexible rubber-like material used for
                            grips, covers and wearable components.
                        </p>

                        <span className="material-tag">
                            Flexible
                        </span>

                    </div>

                </div>

            </section>
            {/* ================= PORTFOLIO ================= */}

            <section className="portfolio-section">

                <h2 className="portfolio-title">

                    Recent Prints

                </h2>

                <p className="portfolio-sub">

                    A glimpse of prototypes, student projects and
                    functional parts printed at Nexus3D.

                </p>


                <div className="portfolio-grid">


                    {/* CARD 1 */}

                    <div className="portfolio-card">

                        <img
                            src="/prints/print1.jpg"
                            alt="Functional Part"
                        />

                        <div className="portfolio-overlay">

                            <h3>Functional Part</h3>

                        </div>

                    </div>


                    {/* CARD 2 */}

                    <div className="portfolio-card">

                        <img
                            src="/prints/print2.jpg"
                            alt="Engineering Model"
                        />

                        <div className="portfolio-overlay">

                            <h3>Engineering Model</h3>

                        </div>

                    </div>



                    {/* CARD 3 */}

                    <div className="portfolio-card">

                        <img
                            src="/prints/print3.jpg"
                            alt="Custom Design"
                        />

                        <div className="portfolio-overlay">

                            <h3>Custom Design</h3>

                        </div>

                    </div>



                    {/* CARD 4 */}

                    <div className="portfolio-card">

                        <img
                            src="/prints/print4.jpg"
                            alt="Student Project"
                        />

                        <div className="portfolio-overlay">

                            <h3>Student Project</h3>

                        </div>

                    </div>


                </div>

            </section>
            {/* ================= FINAL CTA ================= */}

            <section className="cta-section">

                <div className="cta-container">

                    <h2>

                        Have a Model Ready?

                    </h2>

                    <p>

                        Upload your STL file and get fast,
                        high-quality FDM printing with transparent pricing.

                    </p>


                    <div className="cta-buttons">

                        <button
                            className="cta-primary"
                            onClick={() => navigate("/upload")}
                        >
                            Upload STL
                        </button>

                        <button
                            className="cta-secondary"
                            onClick={() => navigate("/contact")}
                        >
                            Contact Us
                        </button>

                    </div>

                </div>

            </section>
            {/* ================= FOOTER ================= */}

            <footer id="contact-footer" className="footer">

                <div className="footer-container">

                    {/* LEFT SIDE */}
                    <div className="footer-brand">
                        <h3>Nexus3D</h3>
                        <p>
                            High-quality FDM 3D printing solutions for prototypes,
                            functional parts and creative projects.
                        </p>
                    </div>

                    {/* CENTER LINKS */}
                    <div className="footer-links">
                        <h4>Quick Links</h4>
                        <ul>
                            <li onClick={() => navigate("/services")}>Services</li>
                            <li onClick={() => navigate("/materials")}>Materials</li>
                            <li onClick={() => navigate("/how-it-works")}>How It Works</li>
                            <li onClick={() => navigate("/contact")}>Contact</li>
                        </ul>
                    </div>

                    {/* RIGHT CONTACT */}
                    <div className="footer-contact">
                        <h4>Contact</h4>
                        <p>Email: kunal613702@email.com</p>
                        <p>Phone: +91 6378727676</p>
                        <p>Phone: +91 9928613702</p>

                        <p>Location: India</p>
                    </div>

                </div>

                <div className="footer-bottom">
                    © {new Date().getFullYear()} Nexus3D. All rights reserved.
                </div>

            </footer>
        </div>


    );
}

export default Home;


