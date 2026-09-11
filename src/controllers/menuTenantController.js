const MenuTenant = require("../models/menuTenantModel");
const { respond } = require("../helpers/response");
const { buildMediaUrl } = require("../helpers/common");

const mapTenant = ({ image_path, ...tenant }) => ({
	...tenant,
	service_charge: Number(tenant.service_charge) || 0,
	url_image: buildMediaUrl("image", image_path),
});

// GET /api/players/:serial/tenants
exports.getTenantsByPlayerSerial = async (req, res) => {
	try {
		const { serial } = req.params;
		if (!serial) return respond(res, 400, "serial is required", []);

		const result = await MenuTenant.listByPlayerSerial(serial);
		if (!result) return respond(res, 404, "Player not found or inactive", []);

		return respond(
			res,
			200,
			"success",
			result.tenants.map(mapTenant),
			"Menu tenants by player",
		);
	} catch (err) {
		console.error("getTenantsByPlayerSerial error:", err.message);
		return respond(res, 500, "Failed to fetch menu tenants", []);
	}
};
