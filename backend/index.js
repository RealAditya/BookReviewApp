require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const wrapAsync = require("./utils/wrapAsync");
const Visitor = require("./models/visits");

const bookRouter = require("./router/book");
const userRouter = require("./router/users");

const app = express();
const port = process.env.PORT || 8000;
const mongoUrl = process.env.MONGO_URL || "mongodb://mongo:27017/bookworld";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/public", express.static(path.join(__dirname, "./public")));

// Routes
app.use("/books", bookRouter);
app.use("/users", userRouter);

app.post(
  "/log-visit",
  wrapAsync(async (req, res) => {
    const { userAgent } = req.body;
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    let visitor = await Visitor.findOne({ ip });

    if (visitor) {
      visitor.visitCount += 1;
      await visitor.save();
      return res.status(200).json({
        message: "Visit logged",
        newVisitor: false,
        totalVisitors: await Visitor.countDocuments(),
        totalVisits: visitor.visitCount,
      });
    } else {
      visitor = new Visitor({ userAgent, ip });
      await visitor.save();
      return res.status(200).json({
        message: "New visitor created",
        newVisitor: true,
        totalVisitors: await Visitor.countDocuments(),
        totalVisits: visitor.visitCount,
      });
    }
  })
);

app.get("/", (req, res) => {
  res.json({ message: "This is home route" });
});

// Error handling
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).json({ message });
});

// Connect to MongoDB with retry
const connectWithRetry = () => {
  mongoose
    .connect(mongoUrl)
    .then(() => console.log("✅ Connected to Database"))
    .catch((err) => {
      console.log("❌ Error connecting to Database, retrying in 5s...", err.message);
      setTimeout(connectWithRetry, 5000);
    });
};
connectWithRetry();

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
