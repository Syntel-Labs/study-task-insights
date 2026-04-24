import jwt from "jsonwebtoken";
import crypto from "crypto";

const COOKIE_NAME = "stia_session";

function cookieOpts(req, extra = {}) {
  const isHttps = req.secure || req.get("x-forwarded-proto") === "https";
  const crossSite = process.env.COOKIE_CROSS_SITE === "true";
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: crossSite ? "none" : "lax",
    path: "/",
    ...extra,
  };
}

/** POST /gate/login — authenticates with a shared secret and sets a session cookie */
export const login = (req, res) => {
  const expected = process.env.ACCESS_TOKEN;
  const provided = req.body?.secret ?? "";

  const expectedBuf = Buffer.from(expected ?? "");
  const providedBuf = Buffer.from(provided);

  const match =
    expectedBuf.length === providedBuf.length &&
    crypto.timingSafeEqual(expectedBuf, providedBuf);

  if (!match) {
    return res
      .status(401)
      .json({ code: "unauthorized", message: "Invalid credentials" });
  }

  const hours = Number(process.env.ACCESS_SESSION_HOURS) || 8;
  const token = jwt.sign({ access: "ok" }, expected, {
    expiresIn: `${hours}h`,
  });

  res.cookie(COOKIE_NAME, token, cookieOpts(req, { maxAge: hours * 60 * 60 * 1000 }));

  return res
    .status(200)
    .json({ code: "login_success", message: "Access granted" });
};

/** POST /gate/logout — clears the session cookie */
export const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOpts(req));
  return res
    .status(200)
    .json({ code: "logout_success", message: "Session closed" });
};
