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

const updateSystemPromptOpenAILarge: RequestHandler = async (req, res, next) => {
    try {
        const { systemPromptOpenAILarge } = req.body;
        
        let settings = await SettingsModel.findOne();
        if (!settings) {
            settings = new SettingsModel({
                systemPromptOpenAILarge: systemPromptOpenAILarge
            });
        } else {
            settings.systemPromptOpenAILarge = systemPromptOpenAILarge;
        }
        
        await settings.save();
        res.status(200).json(settings);
    } catch (error) {
        console.error('Update error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        next(new HttpError(`Failed to update settings: ${errorMessage}`, 500));
    }
};

const updateSystemPromptOpenAIMini: RequestHandler = async (req, res, next) => {
    try {
        const { systemPromptOpenAIMini } = req.body;

        let settings = await SettingsModel.findOne();
        if (!settings) {
            settings = new SettingsModel({
                systemPromptOpenAIMini: systemPromptOpenAIMini
            });
        } else {
            settings.systemPromptOpenAIMini = systemPromptOpenAIMini;
        }

        await settings.save();
        res.status(200).json(settings);
    } catch (error) {
        console.error('Update error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        next(new HttpError(`Failed to update settings: ${errorMessage}`, 500));
    }
}


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
router.put("/system-prompt-openai-large", updateSystemPromptOpenAILarge);
router.put("/system-prompt-openai-mini", updateSystemPromptOpenAIMini);
router.put("/system-prompt-sonnet", updateSystemPromptSonnet);
router.put("/system-prompt-haiku", updateSystemPromptHaiku);
router.put("/vector-search", updateVectorSearchSettings);

export default router;
