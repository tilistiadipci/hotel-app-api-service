const axios = require("axios");

// ================= CONFIG =================
const DEFAULT = {
	lat: parseFloat(process.env.DEFAULT_LAT) || -6.144829154721147,
	lon: parseFloat(process.env.DEFAULT_LON) || 106.81914314212021,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 menit

// ================= AXIOS INSTANCE =================
const http = axios.create({
	timeout: 5000,
	headers: {
		"User-Agent":
			process.env.OSM_USER_AGENT || "weather-app/1.0 (your@email.com)",
	},
});

// ================= CACHE =================
const weatherCache = new Map();
const locationCache = new Map();

function getCache(cache, key) {
	const item = cache.get(key);
	if (!item) return null;

	const isExpired = Date.now() - item.timestamp > CACHE_TTL;
	if (isExpired) {
		cache.delete(key);
		return null;
	}

	return item.data;
}

function setCache(cache, key, data) {
	cache.set(key, {
		data,
		timestamp: Date.now(),
	});
}

// ================= WEATHER MAP =================
const WEATHER_MAP = {
	0: "Cerah",
	1: "Sebagian cerah",
	2: "Berawan",
	3: "Cerah berawan",

	45: "Kabut",
	48: "Kabut tebal",

	51: "Gerimis ringan",
	53: "Gerimis sedang",
	55: "Gerimis lebat",

	56: "Gerimis ringan",
	57: "Gerimis lebat",

	61: "Hujan ringan",
	63: "Hujan sedang",
	65: "Hujan lebat",

	66: "Hujan ringan",
	67: "Hujan lebat",

	71: "Salju ringan",
	73: "Salju sedang",
	75: "Salju lebat",
	77: "Butiran salju",

	80: "Hujan ringan",
	81: "Hujan sedang",
	82: "Hujan lebat",

	85: "Salju ringan",
	86: "Salju lebat",

	95: "Badai petir",
	96: "Badai petir + hujan es",
	99: "Badai petir ekstrem",
};

const normalizeCoord = (value, fallback) => {
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const getKey = (lat, lon) => `${lat.toFixed(6)},${lon.toFixed(6)}`;

function validateCoord(lat, lon) {
	if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
		throw new Error("Invalid coordinates");
	}
}

function mapProvinceJakarta(text, country) {
	// jika ada kata mengandung Jakarta maka return dki jakarta
	return text
		.toLowerCase()
		.includes("jakarta")
		? "DKI Jakarta"
		: country;
}

async function getLocation(lat, lon) {
	validateCoord(lat, lon);

	const key = getKey(lat, lon);

	const cached = getCache(locationCache, key);
	if (cached) return cached;

	try {
		const res = await http.get(
			"https://nominatim.openstreetmap.org/reverse",
			{
				params: {
					lat,
					lon,
					format: "json",
					addressdetails: 1,
				},
			},
		);

		const addr = res.data.address || {};

		console.log("RAW ADDRESS:", JSON.stringify(addr, null, 2));

		const location = {
			city: addr.city || addr.town || addr.village || addr.county || null,
			district: addr.suburb || addr.village || addr.county || null,
			province: addr.state || mapProvinceJakarta(addr.city, addr.country) || addr.region  || addr.country || null,
			country: addr.country || null,
		};

		setCache(locationCache, key, location);

		return location;
	} catch (err) {
		console.error("getLocation error:", err.message);

		return {
			city: null,
			district: null,
			province: null,
			country: null,
		};
	}
}

async function getWeatherData(lat, lon) {
	validateCoord(lat, lon);

	const key = getKey(lat, lon);

	const cached = getCache(weatherCache, key);
	if (cached) return cached;

	try {
		const res = await http.get("https://api.open-meteo.com/v1/forecast", {
			params: {
				latitude: lat,
				longitude: lon,
				current: "temperature_2m,weathercode",
			},
		});

		const data = res.data?.current || {};

		setCache(weatherCache, key, data);

		return data;
	} catch (err) {
		console.error("getWeather error:", err.message);
		return {};
	}
}

// ================= MAIN =================
const getWeather = async ({ lat, lon }) => {
	const latitude = normalizeCoord(lat, DEFAULT.lat);
	const longitude = normalizeCoord(lon, DEFAULT.lon);

	try {
		const [weatherData, location] = await Promise.all([
			getWeatherData(latitude, longitude),
			getLocation(latitude, longitude),
		]);

		return {
			latitude,
			longitude,
			temperature: weatherData.temperature_2m ?? null,
			weather: WEATHER_MAP[weatherData.weathercode] || "Tidak diketahui",
			address: location,
		};
	} catch (err) {
		console.error("getWeather main error:", err.message);

		return {
			latitude,
			longitude,
			temperature: null,
			weather: "Tidak diketahui",
			address: {
				city: null,
				district: null,
				province: null,
				country: null,
			},
		};
	}
};

module.exports = { getWeather };
