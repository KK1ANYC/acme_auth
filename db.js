const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { STRING, TEXT } = Sequelize;
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/acme_db',
  config
);

const User = conn.define('user', {
  username: STRING,
  password: STRING,
});

const Note = conn.define('note', {
  text: TEXT,
});

User.hasMany(Note);
Note.belongsTo(User);

// Token exchange >>> takes the encoded text for POST and decoded to match the req.body in database
User.byToken = async (token) => {
  try {
    const payload = await jwt.verify(token, process.env.JWT);
    console.log('byToken payload', payload);

    const user = await User.findByPk(payload.id);
    if (user) {
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
      password,
    },
  });

  // Token Logic
  if (user.id) {
    // Token generator
    const token = await jwt.sign({ id: user.id }, process.env.JWT);
    console.log('token >>> ', token);
    return token;
  }

  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

// beforeCreate hash password...
User.beforeCreate(async (user) => {
  // if (user.accessLevel > 10 && user.username !== 'Boss') {
  //   throw new Error("You can't grant this user an access level above 10!");
  // }
  let saltRound = 5;
  const hash = await bcrypt.hash(user.password, saltRound);
  // console.log(user);
  console.log('hashed >>> ', hash);
  const correct = await bcrypt.compare(user.password, hash);
  console.log(correct);
});

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw' },
    { username: 'moe', password: 'moe_pw' },
    { username: 'larry', password: 'larry_pw' },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );

  const notes = [
    { text: 'hello world' },
    { text: 'reminder to buy groceries' },
    { text: 'reminder to do laundry' },
  ];
  const [note1, note2, note3] = await Promise.all(
    notes.map((note) => Note.create(note))
  );
  await lucy.setNotes(note1);
  await moe.setNotes([note2, note3]);

  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note,
  },
};
