// backend/test/integration/example_integration_test.js
const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../server"); // load your Express app
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const { expect } = chai;
chai.use(chaiHttp);

describe("Integration Tests", () => {
  before(async () => {
    await connectDB(); // connect to DB (test DB recommended)
  });

  after(async () => {
    await mongoose.connection.close();
  });

  it("should register a new user", async () => {
    const res = await chai
      .request(app)
      .post("/api/auth/register")
      .send({
        email: `test${Date.now()}@mail.com`,
        password: "Test123!",
        firstName: "Test",
        lastName: "User",
      });

    expect(res).to.have.status(201);
    expect(res.body).to.have.property("token");
    expect(res.body.user).to.have.property("email");
  });

  it("should reject login with wrong password", async () => {
    const res = await chai
      .request(app)
      .post("/api/auth/login")
      .send({ email: "nonexist@mail.com", password: "wrongpass" });

    expect(res).to.have.status(400);
    expect(res.body.message).to.equal("Invalid credentials");
  });
});
