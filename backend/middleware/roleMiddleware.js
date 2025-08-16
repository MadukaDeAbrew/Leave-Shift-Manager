// backend/middleware/roleMiddleware.js
module.exports = function roleMiddleware(requiredRole) {
  return (req, res, next) => {
    try {
      if (!req.user || req.user.role !== requiredRole) {
        return res.status(403).json({ message: 'Access denied: Admins only' });
      }
      next();
    } catch (err) {
      console.error('Role check failed:', err);
      res.status(500).json({ message: 'Internal server error in role middleware' });
    }
  };
};
