import jsPDF from "jspdf";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import STLViewer from "../components/STLViewer";
import "./Upload.css";

const TAX_RATE = 0.088;
const DISCOUNT_RATE = 0.05;

export default function Upload() {
  const navigate = useNavigate();

  const [fileUrl, setFileUrl] = useState(null);
  const [fileMeta, setFileMeta] = useState({ fileName: "", fileSize: 0 });
  const [volume, setVolume] = useState(0);

  const [material, setMaterial] = useState("PLA");
  const [quantity, setQuantity] = useState(1);

  const [weight, setWeight] = useState(0);
  const [unitWeight, setUnitWeight] = useState(0);
  const [price, setPrice] = useState(0);
  const [showQuote, setShowQuote] = useState(false);

  const densities = {
    PLA: 1.24,
    ABS: 1.04,
    PETG: 1.27,
    TPU: 1.2
  };

  const pricePerGram = {
    PLA: 2.0,
    ABS: 2.5,
    PETG: 2.8,
    TPU: 3.2
  };

  const calculateVolume = (geometry) => {
    let calculatedVolume = 0;
    const position = geometry.attributes.position;
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const v3 = new THREE.Vector3();

    for (let i = 0; i < position.count; i += 3) {
      v1.fromBufferAttribute(position, i);
      v2.fromBufferAttribute(position, i + 1);
      v3.fromBufferAttribute(position, i + 2);
      calculatedVolume += v1.dot(v2.cross(v3));
    }

    return Math.abs(calculatedVolume / 6.0);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileMeta({ fileName: file.name, fileSize: file.size });
    const url = URL.createObjectURL(file);
    setFileUrl(url);

    const reader = new FileReader();
    reader.onload = (event) => {
      const loader = new STLLoader();
      const geometry = loader.parse(event.target.result);
      geometry.computeVertexNormals();

      const rawVolume = calculateVolume(geometry);
      const volumeCm = rawVolume / 1000;
      setVolume(volumeCm);
    };
    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    if (!volume) return;

    const density = densities[material];
    const materialCost = pricePerGram[material];
    const calculatedUnitWeight = volume * density;
    const weightGram = calculatedUnitWeight * quantity;

    const subtotal = weightGram * materialCost;
    const discount = quantity >= 5 ? subtotal * DISCOUNT_RATE : 0;
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * TAX_RATE;
    const totalPrice = taxableAmount + tax;

    setUnitWeight(calculatedUnitWeight);
    setWeight(weightGram);
    setPrice(totalPrice);
  }, [volume, material, quantity]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const invoiceNo = Math.floor(Math.random() * 1000000);
    const today = new Date().toLocaleDateString();

    doc.setFontSize(28);
    doc.text("INVOICE", 20, 30);

    doc.setFontSize(12);
    doc.text(`Invoice No: ${invoiceNo}`, 140, 30);
    doc.text(`Date: ${today}`, 140, 38);

    doc.setFontSize(14);
    doc.text("NEXUS 3D", 20, 50);
    doc.text(`Material: ${material}`, 20, 80);
    doc.text(`Quantity: ${quantity}`, 20, 90);
    doc.text(`Weight: ${weight.toFixed(2)} g`, 20, 100);
    doc.text(`Estimated Total: INR ${price.toFixed(2)}`, 20, 110);
    doc.save("Nexus3D-Invoice.pdf");
  };

  return (
    <div className="upload-page">
      <div className="upload-wrapper">
        <div className="upload-left">
          <h1>Upload Your STL Model</h1>
          <p>Drag STL file to preview and get instant pricing.</p>

          <label className="drop-zone">
            <input type="file" accept=".stl" hidden onChange={handleFile} />
            <p>Click or Drop STL File</p>
          </label>

          <div className="preview-box">
            <STLViewer fileUrl={fileUrl} />
          </div>
        </div>

        <div className="upload-right">
          <h3>Print Settings</h3>

          <select value={material} onChange={(e) => setMaterial(e.target.value)}>
            <option>PLA</option>
            <option>ABS</option>
            <option>PETG</option>
            <option>TPU</option>
          </select>

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value || 1)))}
          />

          <button
            className="quote-btn"
            onClick={() => {
              if (!fileUrl) {
                alert("Upload STL First");
                return;
              }
              setShowQuote(true);
            }}
          >
            Get Instant Quote
          </button>

          <h3>Estimated Weight: {weight.toFixed(2)} g</h3>
          <h2>Estimated Price: INR {price.toFixed(2)}</h2>
        </div>
      </div>

      {showQuote && (
        <div className="invoice-overlay">
          <div className="invoice-box">
            <h2>Nexus3D Instant Quote</h2>
            <hr />

            <p>Material: {material}</p>
            <p>Quantity: {quantity}</p>
            <p>Weight: {weight.toFixed(2)} g</p>
            <h1>Total INR {price.toFixed(2)}</h1>

            <div className="invoice-actions">
              <button onClick={downloadPDF}>Download Invoice</button>

              <button
                className="pay-btn"
                onClick={() => {
                  const normalizedQuantity = Math.max(1, Math.floor(Number(quantity || 1)));
                  const orderData = {
                    material,
                    quantity: normalizedQuantity,
                    unitWeight,
                    weight: unitWeight * normalizedQuantity,
                    price,
                    fileName: fileMeta.fileName,
                    fileSize: fileMeta.fileSize
                  };

                  localStorage.setItem("pendingOrder", JSON.stringify(orderData));

                  const token = localStorage.getItem("token");
                  if (!token) {
                    navigate("/auth", { state: { from: "/payment" } });
                    return;
                  }

                  navigate("/payment");
                }}
              >
                Confirm & Proceed -&gt;
              </button>

              <button onClick={() => setShowQuote(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
