import express from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import User from "../models/User.js";

const router = express.Router();

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser)
    return res.status(400).json({ message: "User already exists" });

  const user = new User({ name: name || email.split("@")[0], email, password });
  await user.save();

  res.json({ message: "User registered successfully" });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "Invalid credentials" });

  const isMatch = await user.matchPassword(password);
  if (!isMatch)
    return res.status(400).json({ message: "Invalid credentials" });

  const token = createToken(user._id);

  res.json({ token });
});

router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "Google auth is not configured on server" });
    }

    const googleResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );

    if (!googleResponse.ok) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const profile = await googleResponse.json();
    const isAudienceValid = profile.aud === process.env.GOOGLE_CLIENT_ID;

    if (!isAudienceValid || profile.email_verified !== "true") {
      return res.status(401).json({ message: "Google token verification failed" });
    }

    let user = await User.findOne({ email: profile.email });

    if (!user) {
      const generatedPassword = `${randomUUID()}_google`;
      user = await User.create({
        name: profile.name || profile.email.split("@")[0],
        email: profile.email,
        password: generatedPassword
      });
    }

    const token = createToken(user._id);
    res.json({ token });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ message: "Google sign-in failed" });
  }
});

export default router;
