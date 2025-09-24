const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Only admin can access these routes
router.get("/", protect, adminOnly, employeeController.getEmployees);
router.get("/:id", protect, adminOnly, employeeController.getEmployeeById);
router.put("/:id", protect, adminOnly, employeeController.updateEmployee);

module.exports = router;
