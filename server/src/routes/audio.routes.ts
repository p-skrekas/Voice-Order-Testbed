import express from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import Audio from '../models/audio/audio.model';
import { getGridFSBucket } from '../utils/gridfs-storage';
import { HttpError } from '../models/http-error/http-error';
import mongoose from 'mongoose';

const router = express.Router();
const upload = multer();

// POST route to save audio
router.post('/', upload.single('audio'), async (req, res, next) => {
    try {
        if (!req.file) {
            throw new HttpError('No audio file provided', 400);
        }

        // Parse duration and ensure it's a valid number
        const duration = parseFloat(req.body.duration);
        if (isNaN(duration)) {
            throw new HttpError('Invalid duration provided', 400);
        }

        // Validate user email
        const userEmail = req.body.userEmail;
        if (!userEmail) {
            throw new HttpError('User email is required', 400);
        }

        const bucket = getGridFSBucket();
        const filename = `${Date.now()}-${req.file.originalname}`;
        
        const readableStream = new Readable();
        readableStream.push(req.file.buffer);
        readableStream.push(null);

        const uploadStream = bucket.openUploadStream(filename);
        
        const gridFSPromise = new Promise<string>((resolve, reject) => {
            readableStream.pipe(uploadStream)
                .on('error', reject)
                .on('finish', () => resolve(uploadStream.id.toString()));
        });

        const fileId = await gridFSPromise;

        const newAudio = new Audio({
            filename,
            title: req.body.title || 'Untitled Recording',
            mimeType: req.file.mimetype,
            duration: duration,
            fileId: uploadStream.id,
            userEmail: userEmail,
            orderText: req.body.orderText || 'No order text provided'
        });

        await newAudio.save();
        console.log('Saved audio with duration:', newAudio.duration); // Debug log

        res.status(201).json({ 
            message: 'Audio saved successfully',
            audioId: newAudio._id,
            duration: newAudio.duration
        });
    } catch (err: unknown) {
        console.error('Error in POST route:', err);
        if (err instanceof Error) {
            next(new HttpError(err.message, 500));
        } else {
            next(new HttpError('Failed to save audio', 500));
        }
    }
});

// GET route to stream audio file
router.get('/:id', async (req, res, next) => {
    try {
        const audio = await Audio.findById(req.params.id);
        if (!audio) {
            throw new HttpError('Audio not found', 404);
        }

        const bucket = getGridFSBucket();

        // Set proper headers for audio streaming
        res.set({
            'Content-Type': audio.mimeType,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache',
        });

        if (req.headers.range) {
            // Get the file info to determine size
            const file = await bucket.find({ _id: new mongoose.Types.ObjectId(audio.fileId) }).next();
            if (!file) {
                throw new HttpError('File not found in GridFS', 404);
            }

            const parts = req.headers.range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const fileSize = file.length;
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = end - start + 1;

            res.set({
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Content-Length': chunkSize,
                'Content-Type': audio.mimeType,
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'no-cache',
            });
            res.status(206);

            const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(audio.fileId), {
                start,
                end: end + 1
            });
            downloadStream.pipe(res);
        } else {
            // No range requested, stream the entire file
            const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(audio.fileId));
            downloadStream.pipe(res);
        }

    } catch (err) {
        next(new HttpError('Failed to retrieve audio', 500));
    }
});

// DELETE route
router.delete('/:id', async (req, res, next) => {
    try {
        const audio = await Audio.findById(req.params.id);
        if (!audio) {
            throw new HttpError('Audio not found', 404);
        }

        const bucket = getGridFSBucket();
        await bucket.delete(new mongoose.Types.ObjectId(audio.fileId));
        await audio.deleteOne();

        res.status(200).json({ message: 'Audio deleted successfully' });
    } catch (err) {
        next(new HttpError('Failed to delete audio', 500));
    }
});

export default router;

// GET route to fetch all audio recordings
router.get('/', async (req, res, next) => {
    try {
        const audioRecordings = await Audio.find().sort({ createdAt: -1 });
        
        res.status(200).json({
            recordings: audioRecordings.map(recording => ({
                _id: recording._id,
                title: recording.title,
                filename: recording.filename,
                mimeType: recording.mimeType,
                createdAt: recording.createdAt,
                duration: recording.duration,
                userEmail: recording.userEmail,
                orderText: recording.orderText
            }))
        });
    } catch (err) {
        next(new HttpError('Failed to fetch audio recordings', 500));
    }
});
