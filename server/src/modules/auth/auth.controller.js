const { asyncHandler } = require("../../utils/asyncHandler");
const { parseRegisterBody, parseLoginBody } = require("./auth.validators");
const { registerUser, loginUser, getCurrentUser } = require("./auth.service");

const register = asyncHandler(async (req, res) => {
  const body = parseRegisterBody(req.body);
  const result = await registerUser(body);
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const body = parseLoginBody(req.body);
  const result = await loginUser(body);
  res.json(result);
});

const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user.id);
  res.json({ user });
});

module.exports = {
  register,
  login,
  me,
};
