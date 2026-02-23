const pool = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		const [rows] = await pool.query(
			"SELECT * FROM users WHERE email = ? LIMIT 1",
			[email],
		);

		if (!rows.length)
			return res.status(404).json({ message: "User not found" });

		const user = rows[0];

		const valid = await bcrypt.compare(password, user.password);
		if (!valid)
			return res.status(401).json({ message: "Invalid password" });

		const token = jwt.sign(
			{ id: user.id, role: user.role },
			process.env.JWT_SECRET,
			{ expiresIn: "1d" },
		);

		res.json({ token });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};
