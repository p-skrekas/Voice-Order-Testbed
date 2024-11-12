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



const frontendOrigin = process.env.NODE_ENV === 'production'
  ? process.env.FRONTEND_ORIGIN_PROD
  : process.env.FRONTEND_ORIGIN_DEV;


// CORS configuration
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      frontendOrigin,
      'https://mouhalis-voice-order.lm.r.appspot.com',
      'https://mouhalis-voice-order.lm.r.appspot.com/',
      'https://ai.reborrn.com',
      'https://ai.reborrn.com/'
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Range'],
  exposedHeaders: ['Accept-Ranges', 'Content-Range', 'Content-Length', 'Content-Type']
};


// Use cors middleware
app.use(cors(corsOptions));

// Security Middleware
app.use(helmet());
app.use(compression());

// Parse incoming requests data (Middleware)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));


// Additional headers for audio streaming
app.use((req: Request, res: Response, next: NextFunction) => {
  // Remove COEP and COOP headers that are blocking audio streaming
  res.removeHeader('Cross-Origin-Opener-Policy');
  res.removeHeader('Cross-Origin-Embedder-Policy');
  
  // Add necessary headers for audio streaming
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Debugging middleware
app.use((req, res, next) => {
  console.log('Request Origin:', req.headers.origin);
  console.log('Request Method:', req.method);
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
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server is listening at port: ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    console.log(err);
  });