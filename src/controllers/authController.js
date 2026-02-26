const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { respond } = require("../helpers/response");
const User = require("../models/userModel");

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		const user = await User.getByEmail(email);
		if (!user) return respond(res, 404, "User not found", []);

		const valid = await bcrypt.compare(password, user.password);
		if (!valid) return respond(res, 401, "Invalid password", []);

		const token = jwt.sign(
			{ id: user.id, role: user.role },
			process.env.JWT_SECRET,
			{ expiresIn: "1d" },
		);

		return respond(res, 200, "success", { token }, "Login success");
	} catch (err) {
		return respond(res, 500, err.message, []);
	}
};
