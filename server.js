require("dotenv").config();

if (!process.env.TOKEN) {
  console.log("❌ Missing TOKEN in .env file! Copy the .env.sample file to .env and configure it!");
  process.exit();
}

if (!process.env.INTERVAL) process.env.INTERVAL = 600;
if (!process.env.PORT) process.env.PORT = 8080;

const fs = require("fs");
const fetch = require("node-fetch");
const express = require("express");

const productsToCheck = {
  Oreo: 166,
  Ragusa: 2891,
  "M&M'S": 611,
};

const restaurants = JSON.parse(fs.readFileSync(__dirname + "/restaurants.json"));
const clientId = new Buffer.from(process.env.TOKEN, "base64").toString("utf-8").split(":")[0];

let updatedAt = null;

const getAuthToken = async () => {
  let response = await fetch("https://el-prod.api.mcd.com/v1/security/auth/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      authorization: `Basic ${process.env.TOKEN}`,
    },
    body: "grantType=client_credentials",
  });
  let json = await response.json();
  if (json.status.type === "Success") {
    return json.response.token;
  } else {
    console.error(json);
    return null;
  }
};

const checkRestaurants = async () => {
  let token = await getAuthToken();
  if (token) {
    for (let restaurant of restaurants) {
      restaurant.status = {};

      try {
        let response = await fetch(
          "https://el-prod.api.mcd.com/exp/v1/restaurant/details/" + restaurant.rid,
          {
            method: "GET",
            headers: {
              "mcd-clientid": clientId,
              "mcd-sourceapp": "GMAL",
              "mcd-uuid": "",
              "mcd-marketid": "CH",
              authorization: "Bearer " + token,
            },
          }
        );

        let json = await response.json();

        if (json.status.type === "Success") {
          let availableProducts = json.response.restaurant.AvailableMenuProducts["2"];
          for (let key in productsToCheck) {
            let productCode = productsToCheck[key];
            restaurant.status[key] = availableProducts.includes(productCode);
          }
        } else {
          restaurant.status = false;
        }

        console.log(`Updated ${restaurant.name}`, restaurant.status);
      } catch (error) {
        console.log(`Error updating ${restaurant.name}`);
        restaurant.status = false;
      }
    }
    updatedAt = Date.now();
  }
};

checkRestaurants();
setInterval(checkRestaurants, process.env.INTERVAL * 1000);

const app = express();

app.use(express.static("build"));

app.get("/restaurants", (_, res) => {
  res.send({ updatedAt, data: restaurants });
});

app.get("*", (_, res) => {
  res.redirect("/");
});

app.listen(process.env.PORT, () => {
  console.log(`Listening on port: ${process.env.PORT}`);
});
