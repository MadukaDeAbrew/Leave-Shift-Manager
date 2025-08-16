const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongo;

before(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = 'testsecret'; // used by auth
  await mongoose.connect(uri);
});

after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

// clear DB between tests
afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const name of Object.keys(collections)) {
    await collections[name].deleteMany({});
  }
});
