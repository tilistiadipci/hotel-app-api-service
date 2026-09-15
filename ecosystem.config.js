// PM2 cluster config, needed to use more than one CPU core — a single
// `node src/app.js` process only ever runs on one core no matter how many
// player devices poll it.
//
// `instances` and DB_POOL_SIZE (src/config/database.js) multiply together
// into total MySQL connections opened by this service alone: keep
// instances * DB_POOL_SIZE comfortably under MySQL's max_connections,
// leaving headroom for the Laravel app and other services on the same DB.
module.exports = {
  apps: [
    {
      name: "hotel-app-api-service",
      script: "src/app.js",
      exec_mode: "cluster",
      instances: process.env.PM2_INSTANCES || 2,
      max_memory_restart: "300M",
    },
  ],
};
