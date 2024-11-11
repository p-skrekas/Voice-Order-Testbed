import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { HttpError } from "./models/http-error/http-error";
import dotenv from "dotenv";

import productRoutes from "./routes/product.routes";
import audioRoutes from "./routes/audio.routes";
import { initGridFS } from './utils/gridfs-storage';

dotenv.config();

const app = express();

console.log(process.env.MONGO_URI);

// Middleware
app.use(bodyParser.json());

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