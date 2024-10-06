require("dotenv").config();
const express = require("express");
const app = express();
const helmet = require("helmet");
const connectDB = require("./src/config/db")
const authRoutes = require('./src/routes/auth.route');
const port = process.env.PORT || 3000;
const cors = require("cors");
const { urlNotFound } = require("./src/utils/urlNotFound");
const { errorHandler } = require("./src/utils/error");

connectDB();


app.use(helmet());
app.use(express.json());
app.use(cors());

// Define authentication routes
app.use('/api/auth', authRoutes);


app.use("*", urlNotFound);
app.use(errorHandler);

app.listen(port,()=>{
    console.log(`Server is running onPosrt: ${port}`);
})
