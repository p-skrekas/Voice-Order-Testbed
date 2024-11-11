import mongoose from 'mongoose';

const audioSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    title: { type: String, required: true },
    mimeType: { type: String, required: true },
    duration: { type: Number },
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true }, 
    createdAt: { type: Date, default: Date.now },
    userEmail: { type: String, required: true },
    orderText: { type: String, required: true }
});

export default mongoose.model('Audio', audioSchema);