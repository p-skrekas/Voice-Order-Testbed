import mongoose, { Model, Schema } from "mongoose";
import { Settings } from "./settings.interface";

const SettingsSchema = new Schema({
    systemPrompt: {
        type: String,
        required: true,
    },
});


const SettingsModel = mongoose.model<Settings>("Settings", SettingsSchema);

export default SettingsModel;

