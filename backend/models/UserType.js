// UserType.js for inheritance
// Abstraction + Inheritance for user types

class BaseUser {
  constructor(userDoc) {
    this.id = userDoc._id?.toString();
    this.email = userDoc.email;
    this.systemRole = userDoc.systemRole;
    this.firstName = userDoc.firstName || '';
    this.lastName = userDoc.lastName || '';
    this.jobRole = userDoc.jobRole || '';
    this.employmentType = userDoc.employmentType || '';
    this.joinedDate = userDoc.joinedDate || null;
    this.phone = userDoc.phone || '';
    this.address = userDoc.address || '';
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}

class AdminUser extends BaseUser {
  constructor(userDoc) {super(userDoc);this.type = 'Admin';}

  canManageEmployees() {
    return true;
  }
}

class EmployeeUser extends BaseUser {
  constructor(userDoc) {super(userDoc);this.type = 'Employee';}

  canManageEmployees() {
    return false;
  }
}

// Factory functiona
function wrapUser(userDoc) {
  if (!userDoc) return null;
  if (userDoc.systemRole === 'admin') {
    return new AdminUser(userDoc);
  }
  return new EmployeeUser(userDoc);
}

module.exports = { BaseUser, AdminUser, EmployeeUser, wrapUser };
