import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid token." });
    }
};

export const adminOnly = (req, res, next) => {
    const adminRoles = ["superadmin", "manager", "support", "admin"];

    // Check for professional role OR the legacy isAdmin flag inside the token
    const isAuthorized = req.user && (adminRoles.includes(req.user.role) || req.user.isAdmin === true);

    if (isAuthorized) {
        next();
    } else {
        res.status(403).json({ error: "Access denied. Admins only." });
    }
};
