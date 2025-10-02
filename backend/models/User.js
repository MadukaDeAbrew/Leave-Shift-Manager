const mongoose = require("mongoose");
//const Schema = mongoose.Schema;
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
    employeeId: { type: String, unique: true, sparse: true, trim: true }, 
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    employmentType: { 
      type: String, 
      enum: ["Full Time", "Part Time", "Casual", null], 
      default: null 
    },
    //jobRole: { type: String, trim: true }, // designation added by Maduka. But for making it simple and effiecied we will have enums created as jobRole
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


    syetemrole: { type: String, enum: ['user', 'admin'], default: 'user' },

    /*userId: {
      type: new mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
       index: true
    },*/
  
  jobRole: {
    type: String,
    enum: ['Cashier','Waiter','Receptionist', 'Barista', 'Kitechen Hand', 'Others'], 
    default: 'Others',
   },
  dob: { type: Date },
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

