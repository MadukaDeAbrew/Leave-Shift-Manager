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

Postman collection: https://maduka-deabrew-7451040.postman.co/workspace/IFN636-Assignment-2-%3A-Group-10~9e075a34-661e-4d6d-a799-abbb54885c99/collection/47516803-246342a6-dfee-457c-8bee-22e34a352186?action=share&source=copy-link&creator=47516803



Please find the Postman API collection attached below - you can copy this to a json (save as .json file) and import via postman.


{
	"info": {
		"_postman_id": "246342a6-dfee-457c-8bee-22e34a352186",
		"name": "LeaveShiftManager API Collection : Group 10",
		"description": "This Postman collection is created for Leave & Shift Management App (Auth, Employees, Leaves, Shifts) with jwt_token variable by Group 10 for IFN636 Assignment 2.",
		"schema": "https://schema.getpostman.com/json/collection/v2.0.0/collection.json",
		"_exporter_id": "47516803",
		"_collection_link": "https://maduka-deabrew-7451040.postman.co/workspace/IFN636-Assignment-2-%3A-Group-10~9e075a34-661e-4d6d-a799-abbb54885c99/collection/47516803-246342a6-dfee-457c-8bee-22e34a352186?action=share&source=collection_link&creator=47516803"
	},
	"item": [
		{
			"name": "Authentication",
			"item": [
				{
					"name": "Register",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  \"first name\": \"User \",\n  \"last name\": \"3\",\n  \"email\": \"user3@gmail.com\",\n  \"password\": \"User3@lsm\"\n}"
						},
						"url": "{{base_url}}/api/auth/register"
					},
					"response": []
				},
				{
					"name": "Login",
					"event": [
						{
							"listen": "test",
							"script": {
								"exec": [
									"let response = pm.response.json();",
									"if (response.token) {",
									"   pm.environment.set('jwt_token', response.token);",
									"   console.log('JWT Token saved to environment');",
									"} else {",
									"   console.warn('No token found in response!');",
									"}"
								],
								"type": "text/javascript",
								"packages": {},
								"requests": {}
							}
						}
					],
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  \"email\": \"admin1@gmail.com\",\n  \"password\": \"Admin1@lsm\"\n}"
						},
						"url": "{{base_url}}/api/auth/login"
					},
					"response": []
				},
				{
					"name": "Change Password",
					"request": {
						"method": "PUT",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							},
							{
								"key": "Authorization",
								"value": "Bearer {{jwt_token}}"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  \"oldPassword\": \"User2@Lsm\",\n  \"newPassword\": \"User2@lsm\"\n}"
						},
						"url": "{{base_url}}/api/auth/change-password"
					},
					"response": []
				},
				{
					"name": "My Profile",
					"request": {
						"method": "GET",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							},
							{
								"key": "Authorization",
								"value": "Bearer {{jwt_token}}"
							}
						],
						"url": "{{base_url}}/api/auth/profile"
					},
					"response": []
				}
			]
		},
		{
			"name": "Employees",
			"item": [
				{
					"name": "Get Employees",
					"request": {
						"method": "GET",
						"header": [
							{
								"key": "Authorization",
								"value": "Bearer {{jwt_token}}"
							}
						],
						"url": "{{base_url}}/api/employees"
					},
					"response": []
				},
				{
					"name": "Add Employee",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							},
							{
								"key": "Authorization",
								"value": "Bearer {{jwt_token}}"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  \"firstName\": \"User\",\n  \"lastName\": \"100\",\n  \"email\": \"user100@gmail.com\",\n  \"jobRole\": \"Cashier\",\n  \"employmentType\": \"Full Time\"\n}\n"
						},
						"url": "{{base_url}}/api/employees"
					},
					"response": []
				},
				{
					"name": "Update Employee",
					"request": {
						"method": "PUT",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json",
								"type": "text"
							},
							{
								"key": "Authorization",
								"value": "Bearer {{jwt_token}}",
								"type": "text"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  \"firstName\": \"Alex\"\n  //\"lastName\": \"Smith\",\n  //\"email\": \"alex.smith@gmail.com\",\n  //\"jobRole\": \"receptionist\",\n  //\"employmentType\": \"Part-Time\"\n}\n",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": "{{base_url}}/api/employees/{{_id}}"
					},
					"response": []
				},
				{
					"name": "Delete Employee",
					"request": {
						"method": "DELETE",
						"header": [
							{
								"key": "Authorization",
								"value": "Bearer {{jwt_token}}",
								"type": "text"
							}
						],
						"url": "{{base_url}}/api/employees/{{_id}}"
					},
					"response": []
				}
			]
		},
		{
			"name": "Leaves",
			"item": [
				{
					"name": "Get Leaves",
					"request": {
						"method": "GET",
						"header": [
							{
								"key": "Authorization",
								"value": "Bearer {{jwt_token}}"
							}
						],
						"url": "{{base_url}}/api/leaves"
					},
					"response": []
				},
				{
					"name": "Create Leave",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							},
							{
								"key": "Authorization",
								"value": "Bearer {{jwt_token}}"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  \"type\": \"Annual\",\n  \"startDate\": \"2025-10-10\",\n  \"endDate\": \"2025-10-15\"\n}"
						},
						"url": "{{base_url}}/api/leaves"
					},
					"response": []
				},
				{
					"name": "Update Leave",
					"request": {
						"method": "PUT",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							},
							{
								"key": "Authorization",
								"value": "Bearer {{jwt_token}}"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  \"startDate\": \"2025-10-12\",\n  \"endDate\": \"2025-10-14\",\n  \"reason\": \"Family Trip\"\n}"
						},
						"url": "{{base_url}}/api/leaves/{{leaveId}}"
					},
					"response": []
				},
				{
					"name": "Delete Leave",
					"request": {
						"method": "DELETE",
						"header": [
							{
								"key": "Authorization",
								"value": "Bearer {{jwt_token}}"
							}
						],
						"url": "{{base_url}}/api/leaves/{{leaveId}}"
					},
					"response": []
				},
				{
					"name": "Approve Leave (Admin)",
					"request": {
						"method": "PATCH",
						"header": [
							{
								"key": "Authorization",
								"value": "Bearer {{jwt_token}}"
							}
						],
						"url": "{{base_url}}/api/leaves/{{leaveId}}/approve"
					},
					"response": []
				},
				{
					"name": "Reject Leave (Admin)",
					"request": {
						"method": "PATCH",
						"header": [
							{
								"key": "Authorization",
								"value": "Bearer {{jwt_token}}"
							}
						],
						"url": "{{base_url}}/api/leaves/{{leaveId}}/reject"
					},
					"response": []
				}
			]
		},
		{
			"name": "Shifts",
			"item": [
				{
					"name": "Get Shifts",
					"request": {
						"method": "GET",
						"header": [
							{
								"key": "Authorization",
								"value": "Bearer {{jwt_token}}"
							}
						],
						"url": "{{base_url}}/api/shifts"
					},
					"response": []
				},
				{
					"name": "Create Shift",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							},
							{
								"key": "Authorization",
								"value": "Bearer {{jwt_token}}"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "//{\n // \"shiftDate\": \"2025-10-20\",\n // \"startTime\": \"09:00\",\n  //\"endTime\": \"17:00\",\n  //\"jobRole\": \"Receptionist\",\n  //\"title\": \"Morning Reception Shift\",\n  //\"slotKey\": \"Morning\",\n  //\"slot\":\"2025/11/11, 8:00-12:00\"\n//}\n\n{\n  \"shiftDate\": \"2025-10-21\",\n  \"slotKey\": \"s10_12\",\n  \"jobRole\": \"Receptionist\",\n  \"title\": \"Morning Reception Shift\"\n}\n\n"
						},
						"url": "{{base_url}}/api/shifts"
					},
					"response": []
				},
				{
					"name": "Delete Shift",
					"request": {
						"method": "DELETE",
						"header": [
							{
								"key": "Authorization",
								"value": "Bearer {{jwt_token}}"
							}
						],
						"url": "{{base_url}}/api/shifts/{{shiftId}}"
					},
					"response": []
				},
				{
					"name": "Assign Shift (Admin)",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							},
							{
								"key": "Authorization",
								"value": "Bearer {{jwt_token}}"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  //\"userIds\": [\"{{userId1}}\", \"{{userId2}}\"]\n  \n  \"userIds\": [\"671a59cde3214f0a2b8f1234\"]\n\n\n}"
						},
						"url": "{{base_url}}/api/shifts/{{shiftId}}/assign"
					},
					"response": []
				},
				{
					"name": "Get Unassigned Shifts (Admin)",
					"request": {
						"method": "GET",
						"header": [
							{
								"key": "Authorization",
								"value": "Bearer {{jwt_token}}"
							}
						],
						"url": "{{base_url}}/api/shifts/unassigned"
					},
					"response": []
				},
				{
					"name": "Update Shift",
					"request": {
						"method": "PUT",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							},
							{
								"key": "Authorization",
								"value": "Bearer {{jwt_token}}"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  \"jobRole\": \"Receptionist\",\n  \"status\": \"assigned\",\n  \"shiftDate\": \"2025-10-28\"\n}\n"
						},
						"url": "{{base_url}}/api/shifts/{{shiftId}}"
					},
					"response": []
				}
			]
		}
	]
}