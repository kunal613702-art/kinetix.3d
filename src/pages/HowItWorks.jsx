import { Link } from "react-router-dom";

function HowItWorks() {
  return (
    <section className="hiw-wrapper">

      <div className="hiw-container">

        <h1 className="hiw-title">How It Works</h1>
        <p className="hiw-sub">
          From idea to printed part in four simple steps.
        </p>

        <div className="hiw-grid">

          <div className="hiw-card">
            <div className="hiw-step">1</div>
            <h3>Upload Model</h3>
            <p>
              Send us your STL or OBJ file directly
              through the platform.
            </p>
          </div>

          <div className="hiw-card">
            <div className="hiw-step">2</div>
            <h3>Choose Material</h3>
            <p>
              Select the best material based on
              strength, flexibility and finish.
            </p>
          </div>

          <div className="hiw-card">
            <div className="hiw-step">3</div>
            <h3>Get Instant Quote</h3>
            <p>
              We calculate price and production
              time automatically.
            </p>
          </div>

          <div className="hiw-card">
            <div className="hiw-step">4</div>
            <h3>We Print & Ship</h3>
            <p>
              Your part is printed with precision
              and delivered to your door.
            </p>
          </div>

        </div>

        <Link to="/">
          <button className="hiw-btn">
            Back Home
          </button>
        </Link>

      </div>
    </section>
  );
}

export default HowItWorks;