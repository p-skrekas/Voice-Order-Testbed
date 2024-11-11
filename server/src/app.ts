import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { HttpError } from "./models/http-error/http-error";
import dotenv from "dotenv";
import cors, { CorsOptions } from 'cors';
import helmet from "helmet";
import compression from "compression";

import productRoutes from "./routes/product.routes";
import audioRoutes from "./routes/audio.routes";
import { initGridFS } from './utils/gridfs-storage';

dotenv.config();

const app = express();

// CORS configuration
const corsOptions: CorsOptions = {
  optionsSuccessStatus: 200,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};


// CORS handling
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  next();
});

// Use cors middleware
app.use(cors(corsOptions));

// Security Middleware
app.use(helmet());
app.use(compression());

// Parse incoming requests data (Middleware)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));


// Additional headers (if needed)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// Routes
app.use("/api/products", productRoutes);
app.use("/api/audio", audioRoutes);

// Handle non-existing routes
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new HttpError('Could not find this route.', 404));
});

// Generic Error Handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(error);
  }
  res.status(error.code || 500).json({ message: error.message || 'An unknown error occurred!' });
});


if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not defined in the environment variables");
}


// Connect to MongoDB and start the server
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    initGridFS(); // Initialize GridFS after connection
    app.listen({ port: 5000 }, () => {
      console.log(`Server is listening at port: 5000`);
    });
  })
  .catch(err => {
    console.log(err);
  });