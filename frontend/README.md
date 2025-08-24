
**Leave & Shift Management System**
**Overview:** The specific application is designed to help organizations streamline employee scheduling and leave processes. It provides a user-friendly interface for employees to apply for leave, view assigned shifts, and request shift swaps,generate reports while enabling administrators to manage approvals, assign shifts, update lave and shift rules and oversee operations efficiently.The application ensures secure user authentication (signup, login, logout) and role-based access, with built-in validations to prevent scheduling conflicts and improve workflow. This system enhances transparency, reduces manual errors, and boosts productivity for both employees and administrators.

**This apps **contain** the following features:**

-Authentication & Profile
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






This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
