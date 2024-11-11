import { GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';

let gridFSBucket: GridFSBucket;

export const initGridFS = () => {
    if (!mongoose.connection.db) {
        throw new Error('MongoDB connection not established');
    }
    
    gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'audioFiles'
    });
};

export const getGridFSBucket = () => {
    if (!gridFSBucket) {
        throw new Error('GridFS not initialized');
    }
    return gridFSBucket;
};