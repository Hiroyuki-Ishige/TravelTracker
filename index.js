import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

// connect to DB
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Ishige1970$",
  port: 5433,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function getCountryCodes() {
  let countryCodes = [];
  const result = await db.query("SELECT country_code FROM visited_countries");
  result.rows.forEach((row) => countryCodes.push(row.country_code));

  return countryCodes;
}

async function findCountryCode(countryName) {
  let countryCodeFound = [];
  try {
    const result = await db.query(
      //exact match
      //"SELECT country_code FROM countries WHERE LOWER(country_name) = $1",

      //fazzy match
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE $1",
      [`%${countryName.toLowerCase()}%`]
    );
    result.rows.forEach((row) => countryCodeFound.push(row.country_code));
  } catch (err) {
    
    console.log(`There is no such country:`, err);
  }
  return countryCodeFound;
}

async function addCountryCode(countryCode) {
  try {
    await db.query(
      "INSERT INTO visited_countries (country_code) VALUES ($1) ",
      [countryCode]
    );
    return true; //indicate success

  } catch (err) {
    console.log(`Error adding country cooe:`, err);
    return false; //Failure
  }
}

app.get("/", async (req, res) => {
  //Write your code here.
  const countryCodes = await getCountryCodes();
  res.render("index.ejs", {
    countries: countryCodes,
    total: countryCodes.length,
  });

  console.log(`Country code before JSON.stringify: ${countryCodes}`);
  console.log(`Countries at index.js:${JSON.stringify(countryCodes)}`);
});

// Handle POST of new country visited
app.post("/add", async (req, res) => {
  let newCountry = req.body.country.trim();
  console.log(`Country name from ejs: ${newCountry}`);

  //find country code based on input at ejs
  let countryCodeFound = await findCountryCode(newCountry);

  // if country name is found
  if(countryCodeFound.length>0){
      console.log(`Country name and code found: ${countryCodeFound}`);

      // insert countryCodeFound to DB
      let success = await addCountryCode(countryCodeFound[0]);

      // if country code isn't duplicate
      if (success){
        console.log(`Country code [${countryCodeFound} ] is successfully add`);
        res.redirect("/");
      
      // if country code is duplicate
      }else{
        console.log(`Failed to add country code [${countryCodeFound} ] as it's already exist `);

        const countryCodes = await getCountryCodes();
        res.render("index.ejs", {
        countries: countryCodes,
        total: countryCodes.length,
        error: `Country name is already input. Please input another country`,
  });

      }

  // if country name isn't found
  }else{
    console.log(`No such country name: ${newCountry}`)

    const countryCodes = await getCountryCodes();
    res.render("index.ejs", {
    countries: countryCodes,
    total: countryCodes.length,
    error: `No such country name. Please input again`,
  });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
