// require("dotenv").config({path: "./env"});
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import connectDB from "./db/index.js";
import app from "./app.js";

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`\n Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("CONNECTION TO DB FAILED!! ERROR: ", error);
    process.exit(1);
    throw error;
  });
