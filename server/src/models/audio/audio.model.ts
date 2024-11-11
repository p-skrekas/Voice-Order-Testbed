import mongoose from 'mongoose';

const audioSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    title: { type: String, required: true },
    mimeType: { type: String, required: true },
    duration: { type: Number },
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true }, 
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Audio', audioSchema);