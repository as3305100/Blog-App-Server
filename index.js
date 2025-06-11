import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import hpp from "hpp";
import { errorHandler } from "./middlewares/error.middleware.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import connectDB, { getDBStatus } from "./database/db.js";
import rateLimit from "express-rate-limit";
import cors from "cors"
import healthRouter from "./routes/health.route.js"
import userRouter from "./routes/user.route.js"
import blogRouter from "./routes/blog.route.js"

dotenv.config();
const app = express();

const PORT = parseInt(process.env.PORT) || 8000;
const MAX = parseInt(process.env.RATE_LIMIT_MAX) || 100;
const MINUTE = parseInt(process.env.WS_MINUTE) || 15;

const limiter = rateLimit({
  windowMs: MINUTE,
  max: MAX,
  message: "Too many requests from this IP, please try again later.",
});

// security middleware
app.use(helmet());
app.use(hpp());
app.use("/api", limiter);

// logging middleware

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// cors configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD", "OPTIONS"],
    allowedHeaders: [
      "Content-Type", // Specifies the type of data sent, like application/json, multipart/form-data, etc.
      "Authorization", // Typically holds the Bearer token (Authorization: Bearer <token>), used for JWT or OAuth.
      "X-Requested-With", // Often set to XMLHttpRequest. Used to detect AJAX requests.
      "device-remember-token", // A custom header — maybe you're using it for device tracking or persistent login?
      //   "Access-Control-Allow-Origin", // this is response header not needed here
      "Origin", // Sent automatically by the browser to indicate where the request came from (e.g., http://localhost:5371). Required for CORS validation.
      "Accept", // Specifies what response types the client can handle, e.g., application/json.
    ],
  })
);

// api endpoint

app.use("/health", healthRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/blogs", blogRouter)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    statusCode: 404,
    message: "Route not found",
  });
});

// global error handler
app.use(errorHandler);

connectDB().then(() => {
  if (getDBStatus().isConnected) {
    app.listen(PORT, () => {
      console.log(`Server is running on the port ${PORT}`);
    });
  }
});
