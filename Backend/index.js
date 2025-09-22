const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.get("/", (req,res)=>res.json({msg:"Backend working"}));
app.listen(5000, ()=>console.log("Server on 5000"));
