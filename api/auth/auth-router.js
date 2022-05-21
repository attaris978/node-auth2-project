const router = require("express").Router();
const { checkUsernameExists, validateRoleName } = require('./auth-middleware');
const { JWT_SECRET } = require("../secrets"); // use this secret!
const users = require('../users/users-model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

router.post("/register", validateRoleName, (req, res, next) => {
  req.body.password = bcrypt.hashSync(req.body.password,8);
  users.add(req.body)
  .then(user => res.status(201).json(user))
  .catch( err => next(err))
  /**
    [POST] /api/auth/register { "username": "anna", "password": "1234", "role_name": "angel" }

    response:
    status 201
    {
      "user"_id: 3,
      "username": "anna",
      "role_name": "angel"
    }
   */
});


router.post("/login", checkUsernameExists, (req, res, next) => {
  let {username, password} = req.body;
  users.findBy({username})
  .first()
  .then(user => {
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = generateToken(user);
      res.status(200)
      .json({
        message: `Welcome ${user.username}! Have a token!`,
        token
      })
    } else {
      res.status(401).json({message: 'Invalid Credentials'})
    }
  })
  .catch(err => next(err))  
  /**
    [POST] /api/auth/login { "username": "sue", "password": "1234" }

    response:
    status 200
    {
      "message": "sue is back!",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ETC.ETC"
    }

    The token must expire in one day, and must provide the following information
    in its payload:

    {
      "subject"  : 1       // the user_id of the authenticated user
      "username" : "bob"   // the username of the authenticated user
      "role_name": "admin" // the role of the authenticated user
    }
   */
});

function generateToken(user) {
  const claims = {
    subject: user.id,
    username: user.username
  };
  const options = {
    expiresIn: '1d'
  };
  return jwt.sign(claims, JWT_SECRET, options);
}

module.exports = router;
