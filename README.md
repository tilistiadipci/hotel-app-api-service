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

Protected player requests use two headers:

```http
X-Api-Key: <token from players.token>
X-Player-License: <player serial>
```

`players.serial` is unique across all hotels, so a player serial always
resolves to exactly one hotel. The hotel license is never sent by the player
device — it is looked up server-side from the `hotel_licenses` table using
the player's `hotel_id`. If the hotel has no active/trial license row, the
API responds `401 Unauthorized` with `"Hotel does not have a license"`.

The player bootstrap endpoints below do not need `X-Api-Key`, but they still
go through the same database license check:

```text
GET /api/players/{serial}
GET /api/players/{serial}/tenants
```

Hotel licenses are managed from the Laravel CMS (issuing/rotating license
keys for admin-facing use), but that key is no longer required by the player
API — only the existence of an active license row matters.

