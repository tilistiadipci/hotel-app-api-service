const pool = require("../config/database");

exports.getChannels = async (req, res) => {
	try {
		const [rows] = await pool.query(
			"SELECT id, name, category FROM channels WHERE is_active = 1",
		);

		res.json(rows);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.getStream = async (req, res) => {
	try {
		const [rows] = await pool.query(
			"SELECT stream_url FROM channels WHERE id = ? AND is_active = 1",
			[req.params.id],
		);

		if (!rows.length)
			return res.status(404).json({ message: "Channel not found" });

		res.json(rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};
