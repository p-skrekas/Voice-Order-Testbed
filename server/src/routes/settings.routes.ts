import { Router, Request, Response, NextFunction, RequestHandler } from "express";

import SettingsModel from "../models/settings/settings.schema";
import { HttpError } from "../models/http-error/http-error";

const router = Router();



const getSettings: RequestHandler = async (req, res, next) => {
    try {
        const settings = await SettingsModel.findOne();
        if (!settings) {
            const defaultSettings = new SettingsModel({
                systemPrompt: "Default system prompt",
                numResultsForVectorSearch: 20
            });
            await defaultSettings.save();
            res.status(200).json(defaultSettings);
            return;
        }
        res.status(200).json(settings);
    } catch (error) {
        next(new HttpError("Failed to get settings", 500));
    }
};



const updateSystemPromptSonnet: RequestHandler = async (req, res, next) => {
    try {
        const { systemPromptSonnet } = req.body;

        let settings = await SettingsModel.findOne();
        if (!settings) {
            settings = new SettingsModel({
                systemPromptSonnet: systemPromptSonnet
            });
        } else {
            settings.systemPromptSonnet = systemPromptSonnet;
        }

        await settings.save();
        res.status(200).json(settings);
    } catch (error) {
        console.error('Update error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        next(new HttpError(`Failed to update settings: ${errorMessage}`, 500));
    }
}

const updateUserPromptTemplateSonnet: RequestHandler = async (req, res, next) => {
    try {
        const { userPromptTemplateSonnet } = req.body;

        let settings = await SettingsModel.findOne();
        if (!settings) {
            settings = new SettingsModel({
                userPromptTemplateSonnet: userPromptTemplateSonnet
            });
        } else {
            settings.userPromptTemplateSonnet = userPromptTemplateSonnet;
        }

        await settings.save();
        res.status(200).json(settings);
    } catch (error) {
        console.error('Update error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        next(new HttpError(`Failed to update settings: ${errorMessage}`, 500));
    }
}

const updateAssistantPrefillSonnet: RequestHandler = async (req, res, next) => {
    try {
        const { assistantPrefillSonnet } = req.body;

        let settings = await SettingsModel.findOne();
        if (!settings) {
            settings = new SettingsModel({
                assistantPrefillSonnet: assistantPrefillSonnet
            });
        } else {
            settings.assistantPrefillSonnet = assistantPrefillSonnet;
        }

        await settings.save();
        res.status(200).json(settings);
    } catch (error) {
        console.error('Update error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        next(new HttpError(`Failed to update settings: ${errorMessage}`, 500));
    }
}



const updateSystemPromptHaiku: RequestHandler = async (req, res, next) => {
    try {
        const { systemPromptHaiku } = req.body;

        let settings = await SettingsModel.findOne();
        if (!settings) {
            settings = new SettingsModel({
                systemPromptHaiku: systemPromptHaiku
            });
        } else {
            settings.systemPromptHaiku = systemPromptHaiku;
        }

        await settings.save();
        res.status(200).json(settings);
    } catch (error) {
        console.error('Update error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        next(new HttpError(`Failed to update settings: ${errorMessage}`, 500));
    }
}


const updateUserPromptTemplateHaiku: RequestHandler = async (req, res, next) => {
    try {
        const { userPromptTemplateHaiku } = req.body;

        let settings = await SettingsModel.findOne();
        if (!settings) {
            settings = new SettingsModel({
                userPromptTemplateHaiku: userPromptTemplateHaiku
            });
        } else {
            settings.userPromptTemplateHaiku = userPromptTemplateHaiku;
        }

        await settings.save();
        res.status(200).json(settings);
    } catch (error) {
        console.error('Update error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        next(new HttpError(`Failed to update settings: ${errorMessage}`, 500));
    }
}

const updateAssistantPrefillHaiku: RequestHandler = async (req, res, next) => {
    try {
        const { assistantPrefillHaiku } = req.body;

        let settings = await SettingsModel.findOne();
        if (!settings) {
            settings = new SettingsModel({
                assistantPrefillHaiku: assistantPrefillHaiku
            });
        } else {
            settings.assistantPrefillHaiku = assistantPrefillHaiku;
        }

        await settings.save();
        res.status(200).json(settings);
    } catch (error) {
        console.error('Update error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        next(new HttpError(`Failed to update settings: ${errorMessage}`, 500));
    }
}

const updateVectorSearchSettings: RequestHandler = async (req, res, next) => {
    try {
        const { numProducts } = req.body;
        
        let settings = await SettingsModel.findOne();
        if (!settings) {
            settings = new SettingsModel({
                numResultsForVectorSearch: parseInt(numProducts)
            });
        } else {
            settings.numResultsForVectorSearch = parseInt(numProducts);
        }
        
        await settings.save();
        res.status(200).json(settings);
    } catch (error) {
        console.error('Update error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        next(new HttpError(`Failed to update vector search settings: ${errorMessage}`, 500));
    }
};

router.get("/", getSettings);

router.put("/system-prompt-sonnet", updateSystemPromptSonnet);
router.put("/user-prompt-template-sonnet", updateUserPromptTemplateSonnet);
router.put("/assistant-prefill-sonnet", updateAssistantPrefillSonnet);

router.put("/system-prompt-haiku", updateSystemPromptHaiku);
router.put("/user-prompt-template-haiku", updateUserPromptTemplateHaiku);
router.put("/assistant-prefill-haiku", updateAssistantPrefillHaiku);

router.put("/vector-search", updateVectorSearchSettings);

export default router;
