const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const { protect, adminOnly } = require("../middleware/authMiddleware"); 
// === Proxy ===
// protect + adminOnly act as Proxy: only admins can access these routes

// Only admin can access these routes
router.get("/", protect, adminOnly, employeeController.getEmployees);
router.get("/:id", protect, adminOnly, employeeController.getEmployeeById);
router.put("/:id", protect, adminOnly, employeeController.updateEmployee);
router.get("/roles/unique", protect, adminOnly, employeeController.getUniqueRoles);
router.get("/employment-types", protect, adminOnly, employeeController.getEmploymentTypes);
module.exports = router;
