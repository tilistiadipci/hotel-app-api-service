# README #

### Requirements
* Node Version 20.16.0
* NPM Version 10.8.1
* MySQL database

### Run Project:
1. Clone the repository:
   ```
   git clone https://github.com/tilistiadipci/hotel-app-api-service.git
   ```
2. Navigate to the project folder, checkout branch main, install dependencies using npm:
   ```
   cd hotel-app
   git checkout main
   npm install
   ```
3. Create a .env file by copying the contents of .env.example:
   ```
   cp .env.example .env
   ```
4. Update the .env file with your database connection details hotel app
   ```
   DB_USERNAME= 
   DB_PASS=
   DB_PORT=
   DB_DATABASE=
   ``` 
5. Running project 
   ```
   npm run start
   ```
   or 
   ```
   npm run watch
   ```
   if u have nodemon
6. Enjoy~~


## NOTES

### API authentication headers

Protected player requests use three headers:

```http
X-Api-Key: <token from players.token>
X-Player-License: <player serial>
X-Hotel-License: <secret hotel license key>
```

The player bootstrap endpoints below do not need `X-Api-Key` yet, but they do
require a valid `X-Hotel-License` belonging to the player's hotel:

```text
GET /api/players/{serial}
GET /api/players/{serial}/tenants
```

A hotel license key is generated from the Laravel CMS directory. The plaintext
key is displayed once and only its bcrypt hash is stored in the database:

```shell
php artisan hotel:license-key BIO-HOTEL
```

Run the command again to rotate/revoke the previous key.

