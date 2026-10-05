import jwt from "jsonwebtoken";

export default function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Invalid authorization format",
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        message: "Authentication token missing",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured in .env");

      return res.status(500).json({
        message: "Server authentication configuration error",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded.userId) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    req.userId = decoded.userId;

    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}