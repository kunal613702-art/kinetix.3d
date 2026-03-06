import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import printing from "../assets/printing.jpg";
import modeling from "../assets/modeling.jpg";
import post from "../assets/postprocess.jpg";
import scan from "../assets/scanning.jpg";

import "./Services.css";

export default function Services() {
  const navigate = useNavigate();
  const services = [

    {
      title: "3D Printing",
      desc: "Industrial precision FDM printing using PLA, ABS, PETG and TPU.",
      img: printing,
      primaryAction: "quote",
      blog: "/blog/3d-printing"
    },

    {
      title: "3D Modeling",
      desc: "Professional CAD design and STL optimization.",
      img: modeling,
      primaryAction: "contact",
      blog: "/blog/3d-modeling"
    },

    {
      title: "Post Processing",
      desc: "Painting polishing finishing.",
      img: post,
      blog: "/blog/post-processing"
    },

    {
      title: "3D Scanning",
      desc: "Digitize real world objects with accurate scanning.",
      img: scan,
      primaryAction: "contact",
      blog: "/blog/3d-scanning"
    }

  ];

  return (

    <div className="services-page">

      <h1 className="services-title">

        Our Services

      </h1>

      {services.map((s, index) => (

        <motion.div

          key={index}

          initial={{ opacity: 0, y: 80 }}

          whileInView={{ opacity: 1, y: 0 }}

          viewport={{ once: true }}

          transition={{ duration: .8 }}

          className={`service-row ${index % 2 !== 0 ? "reverse" : ""
            }`}

        >

          <img src={s.img} />


          <div className="glass-overlay">

            <h2>{s.title}</h2>

            <p>{s.desc}</p>

            <div className="btn-group">

              {s.primaryAction === "quote" && (

                <button
                  className="quote-btn"
                  onClick={() => navigate("/upload")}
                >
                  Get Quote →
                </button>

              )}

              {s.primaryAction === "contact" && (

                <button
                  className="quote-btn"
                  onClick={() => navigate("/contact")}
                >
                  Contact Us →
                </button>

              )}

              <button
                className="learn-btn"
                onClick={() => navigate(s.blog)}
              >
                Learn More →
              </button>

            </div>

          </div>

        </motion.div>

      ))}

    </div>

  );

}