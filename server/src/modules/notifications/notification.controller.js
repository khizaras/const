const { asyncHandler } = require("../../utils/asyncHandler");
const {
  listNotifications,
  markAsRead,
  markAllAsRead,
} = require("./notification.service");

const list = asyncHandler(async (req, res) => {
  const { isRead, limit } = req.query;
  const data = await listNotifications(req.user.id, { isRead, limit });
  res.json({ data });
});

const readOne = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await markAsRead(req.user.id, id);
  res.json({ success: true });
});

const readAll = asyncHandler(async (req, res) => {
  await markAllAsRead(req.user.id);
  res.json({ success: true });
});

module.exports = {
  list,
  readOne,
  readAll,
};
