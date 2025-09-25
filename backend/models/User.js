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
    employeeId: { type: String, required: true, unique: true }, 
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    employmentType: { 
      type: String, 
      enum: ["Full Time", "Part Time", "Casual"], 
      required: true 
    },
    jobRole: { type: String, required: true, trim: true }, // designation
    joinedDate: { type: Date, required: true },
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
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
