const axios = require("axios");

// https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=31.71.01.1001

// list kode wilayah
// https://erlange.github.io/Kodepos-Wilayah-Indonesia/

const DEFAULT = {
	adm4: process.env.DEFAULT_ADM4,
};

const http = axios.create({
	timeout: 5000,
	headers: {
		"User-Agent":
			process.env.OSM_USER_AGENT || "weather-app/1.0 (your@email.com)",
	},
});

async function getWeatherData(adm4) {
	try {
		const res = await http.get(`https://api.bmkg.go.id/publik/prakiraan-cuaca`, {
			params: {
				adm4: adm4,
			},
		});

		const data = res.data?.data || {};

		return data;
	} catch (err) {
		console.error("getWeather error:", err.message);
		return {};
	}
}

// ================= MAIN =================
const getWeather = async ({ adm4 }) => {
	let administrasiWilayah4 = adm4 || DEFAULT.adm4;

	try {
		const [weatherData] = await Promise.all([
			getWeatherData(administrasiWilayah4),
		]);

		if (!weatherData || weatherData.length === 0) return {};

		const lokasi = weatherData[0]?.lokasi;
		const cuaca = weatherData[0]?.cuaca[0][0];

		// console.log("weatherData:", weatherData);
		// console.log("lokasi:", lokasi);
		// console.log("cuaca:", cuaca);

		return {
			latitude: lokasi.lat,
			longitude: lokasi.lon,
			temperature: cuaca.t ?? null,
			weather: cuaca.weather_desc || "Tidak diketahui",
			weather_en: cuaca.weather_desc_en || "Unknown",
			weather_icon: cuaca.image,
			address: lokasi,
		};
	} catch (err) {
		console.error("getWeather main error:", err.message);

		return {};
	}
};

module.exports = { getWeather };
