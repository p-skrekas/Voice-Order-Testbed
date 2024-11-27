import mongoose, { Model, Schema } from "mongoose";
import { Settings } from "./settings.interface";

const SettingsSchema = new Schema({
    systemPromptSonnet: {
        type: String,
        required: false,
    },
    userPromptTemplateSonnet: {
        type: String,
        required: false,
    },
    assistantPrefillSonnet: {
        type: String,
        required: false,
    },
    systemPromptHaiku: {
        type: String,
        required: false,
    },
    userPromptTemplateHaiku: {
        type: String,
        required: false,
    },
    assistantPrefillHaiku: {
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

