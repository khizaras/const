const {
  getSetupStatus,
  runInstaller,
  setupEnabled,
} = require("./setup.service");

async function status(req, res, next) {
  try {
    const data = await getSetupStatus();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function install(req, res, next) {
  try {
    const enabled = setupEnabled();
    if (!enabled.enabled) {
      return res
        .status(403)
        .json({ error: "Setup UI disabled", meta: enabled });
    }

    const token = req.header("x-setup-token");
    if (!token || token !== process.env.SETUP_TOKEN) {
      return res.status(401).json({ error: "Invalid setup token" });
    }

    const seed = req.body?.seed || null;
    const result = await runInstaller({ seed });
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = { status, install };
