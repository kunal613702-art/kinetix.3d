import { useNavigate } from "react-router-dom";
import "./Pricing.css";

export default function Pricing(){

const navigate = useNavigate();

return(

<div className="pricing-page">

{/* HERO */}

<div className="pricing-hero">

<h1>Simple. Transparent. Fair.</h1>

<p>No hidden charges. Instant pricing based on material and weight.</p>

</div>


{/* MATERIAL PRICING */}

<div className="pricing-section">

<h2>3D Printing (FDM)</h2>

<div className="pricing-grid">

<div className="price-card">

<h3>PLA</h3>

<p className="price">₹1.5 <span>/ gram</span></p>

<p>Best for prototypes and student projects.</p>

</div>

<div className="price-card">

<h3>ABS</h3>

<p className="price">₹2.0 <span>/ gram</span></p>

<p>Strong and heat resistant functional parts.</p>

</div>

<div className="price-card">

<h3>PETG</h3>

<p className="price">₹2.2 <span>/ gram</span></p>

<p>Durable and impact resistant prints.</p>

</div>

<div className="price-card premium">

<h3>TPU</h3>

<p className="price">₹3.0 <span>/ gram</span></p>

<p>Flexible rubber-like material.</p>

</div>

</div>

<p className="minimum">Minimum Order: ₹199</p>

</div>


{/* SERVICE PRICING */}

<div className="pricing-section">

<h2>Additional Services</h2>

<div className="pricing-grid">

<div className="price-card">

<h3>3D Modeling</h3>

<p className="price">₹999+</p>

<p>CAD modeling & STL optimization.</p>

</div>

<div className="price-card">

<h3>3D Scanning</h3>

<p className="price">₹799+</p>

<p>Digitize real world objects.</p>

</div>

<div className="price-card">

<h3>Post Processing</h3>

<p className="price">₹299+</p>

<p>Painting sanding and finishing.</p>

</div>

</div>

</div>


{/* BULK DISCOUNT */}

<div className="bulk-section">

<h2>Bulk Discounts</h2>

<p>Order more. Save more.</p>

<ul>
<li>5+ Units → 5% Discount</li>
<li>10+ Units → 10% Discount</li>
<li>20+ Units → 15% Discount</li>
</ul>

</div>


{/* CTA */}

<div className="pricing-cta">

<h2>Ready to Print?</h2>

<button onClick={()=>navigate("/upload")}>

Get Instant Quote →

</button>

</div>

</div>

);

}