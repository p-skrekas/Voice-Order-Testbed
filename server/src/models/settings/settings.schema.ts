import mongoose, { Model, Schema } from "mongoose";
import { Settings } from "./settings.interface";

const SettingsSchema = new Schema({
    systemPrompt: {
        type: String,
        required: false,
    },
    numResultsForVectorSearch: {
        type: Number,
        required: false,
        default: 50,
    },
});


const SettingsModel = mongoose.model<Settings>("Settings", SettingsSchema);

export default SettingsModel;

