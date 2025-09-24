const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true }, 
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  employmentType: { type: String, enum: ["Full Time", "Part Time", "Casual"], required: true },
  role: { type: String, required: true },
  joinedDate: { type: Date, required: true },
  salaryPerHour: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model("Employee", EmployeeSchema);
