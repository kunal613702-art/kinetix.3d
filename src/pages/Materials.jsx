import { Link } from "react-router-dom";

import "./Materials.css";

function Materials() {
  const materials = [
    {
      name: "PLA",
      desc: "Affordable and smooth finish material perfect for models and student projects.",
    },
    {
      name: "ABS",
      desc: "Strong and heat-resistant material ideal for functional and mechanical parts.",
    },
    {
      name: "PETG",
      desc: "Durable and impact-resistant material suitable for outdoor usage.",
    },
    {
      name: "TPU",
      desc: "Flexible rubber-like material used for grips and wearable components.",
    },
  ];

  return (
    <section className="materials">
      {/* HERO */}
      <div className="materials-hero">
        <div className="hero-text">
          <h1>Materials We Print With</h1>
          <p>
            High-quality 3D printing materials designed for durability,
            precision, and real-world performance.
          </p>
        </div>

        <div className="hero-card">
          <h3>Premium Quality</h3>
          <p>Carefully selected materials for professional results.</p>
        </div>
      </div>

      {/* GRID */}
      <div className="materials-grid">
        {materials.map((mat, i) => (
          <div className="material-card" key={i}>
            <h2>{mat.name}</h2>
            <p>{mat.desc}</p>
          </div>
        ))}
      </div>

      {/* INFO SECTION */}
      <div className="materials-info">
        <div>
          <h2>Why material choice matters</h2>
          <p>
            Each project requires a different balance of strength, flexibility,
            and finish. We help you choose the right material to ensure the
            best performance and longevity.
          </p>
        </div>

        <div className="info-box">
          <h3>Need help choosing?</h3>
          <p>Our team can recommend the perfect material for your project.</p>
        </div>
      </div>
    </section>
  );
}

export default Materials;