const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    // === Auth / System fields ===
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: { type: String, required: true, minlength: 8, select: false },
    systemRole: { 
      type: String, 
      enum: ["admin", "employee"], 
      default: "employee",
      required: true 
    }, // system access role

    // === Employee / Job fields ===
    employeeId: { type: String, unique: true, sparse: true }, 
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    employmentType: { 
      type: String, 
      enum: ["Full Time", "Part Time", "Casual", null], 
      default: null 
    },
    jobRole: { type: String, trim: true }, // designation
    joinedDate: { type: Date },
    salaryPerHour: { type: Number },

    // === Profile / Personal fields ===
    phone: { type: String, trim: true },
    pronouns: {
      type: String,
      enum: ["she/her", "he/him", "they/them", "prefer not to say"],
      default: "prefer not to say"
    },
    secondaryEmail: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    dob: { type: Date }
  },
  { timestamps: true }
);

// === Virtual: fullName ===
userSchema.virtual("fullName").get(function () {
  return `${this.firstName || ""} ${this.lastName || ""}`.trim();
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
