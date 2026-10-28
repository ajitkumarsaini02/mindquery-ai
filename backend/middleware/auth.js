import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No authentication token provided." });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    // Custom JWT Token verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "documind_master_secret_jwt_key_1234");
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name
    };
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ error: "Unauthorized: Token verification failed.", details: error.message });
  }
};

export default authMiddleware;
