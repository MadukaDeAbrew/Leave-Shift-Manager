const express = require("express");
const {
  getUsers,
  getUserById,
  updateUser,
  getUniqueJobRoles,
  getEmploymentTypes,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/roleMiddleware");

const router = express.Router();

// All routes here require admin rights
router.use(protect, admin);

// === Admin-only employee management ===
router.get("/", getUsers); // List (paginated)
router.get("/:id", getUserById); // Dictionary
router.put("/:id", updateUser); // Memento
router.get("/roles/unique", getUniqueJobRoles); // Set
router.get("/employment-types", getEmploymentTypes); // Enum list

module.exports = router;
