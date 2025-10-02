/*
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

// backend/middleware/roleMiddleware.js
function admin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
}

module.exports = { admin };
*/

// backend/middleware/roleMiddleware.js

/**
 * Generic role guard:
 *   app.use('/some-admin-route', protect, requireRole('admin'), handler)
 */
function requireRole(requiredRole) {
  return (req, res, next) => {
    try {
      if (!req.user || req.user.systemRole !== requiredRole) {
        return res.status(403).json({ message: `Access denied: ${requiredRole} only` });
      }
      next();
    } catch (err) {
      console.error('Role check failed:', err);
      res.status(500).json({ message: 'Internal server error in role middleware' });
    }
  };
}

/**
 * Convenience alias for admin-only routes:
 *   router.patch('/leaves/:id/approve', protect, admin, approveLeave)
 */
function admin(req, res, next) {
  if (!req.user || req.user.systemRole !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
}

module.exports = { requireRole, admin };
