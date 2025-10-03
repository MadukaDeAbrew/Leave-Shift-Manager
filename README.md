**Leave & Shift Management System**
**Overview:** The specific application is designed to help organizations streamline employee scheduling and leave processes. It provides a user-friendly interface for employees to apply for leave, view assigned shifts, and request shift swaps,generate reports while enabling administrators to manage approvals, assign shifts, update lave and shift rules and oversee operations efficiently.The application ensures secure user authentication (signup, login, logout) and role-based access, with built-in validations to prevent scheduling conflicts and improve workflow. This system enhances transparency, reduces manual errors, and boosts productivity for both employees and administrators.

**This apps **contain** the following features:**

-Authentication 
Signup
Login
Logout


-Leave Management
Apply for leave
View leave history
Approve/Reject leave (Admin)

-Shift Management
Create and assign shifts (Admin)
View assigned shifts (Employee)
Update or delete assigned shifts (Admin)
Filter shifts by date range

-Shift Swap
Request shift swap
View own swap requests
Cancel swap request
Admin approval for swap requests

---New for Assignment 2---
-Profile Management
Open my profile (Admin and employee both)
Edit my profile - personal details

-Employee List (Admin only)
View employee details including both employees and admins 
Add new employee 
Edit employee details
Delete an employee record

-Authentication - additional features
Change password
---

**Prerequisite:** Please install the following software and create account in following web tools** **

* **Nodejs [**[https://nodejs.org/en](https://nodejs.org/en)]** **
* **Git [**[https://git-scm.com/](https://git-scm.com/)]** **
* **VS code editor** [[https://code.visualstudio.com/](https://code.visualstudio.com/)]** **
* **MongoDB Account** [[https://account.mongodb.com/account/login](https://account.mongodb.com/account/login)]** 
* **GitHub Account** [[https://github.com/signup?source=login](https://github.com/signup?source=login)]** **

---
**Project Setup Instructions**
1. Clone the repository
git clone https://github.com/<your-username>/LeaveShiftManager.git
cd LeaveShiftManager

2. Install dependencies

Backend:

cd backend
npm install


Frontend:

cd ../frontend
npm install

3. Setup environment variables

Create a .env file in backend directory with:

PORT=5001
MONGO_URI=<your-mongodb-uri>
JWT_SECRET=<your-secret-key>

4. Run the project

In one terminal, start the backend:

cd backend
npm start


In another terminal, start the frontend:

cd frontend
npm start


The app will be available at:
http://localhost:3000 (local development)

Public URL

The deployed project is available at:
http://<your-ec2-url>:3000

5. Sample test data

Admin user 1:
username: admin1@gmail.com
password: Admin1@lsm

Admin user 2:
username: admin2@gmail.com
password: Admin2@lsm

General user 1:
username: user1@gmail.com
password: User1@lsm


General user 2:
username: user2@gmail.com
password: User2@lsm

Postman collection: https://maduka-deabrew-7451040.postman.co/workspace/IFN636-Assignment-2-%3A-Group-10~9e075a34-661e-4d6d-a799-abbb54885c99/collection/47516803-c21991e5-3a2b-4ff3-8d70-1c2ece1dd367?action=share&creator=47516803&active-environment=47516803-2d865c20-0b60-4bd7-8d35-fba48252ff77