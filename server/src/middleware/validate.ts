import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../models/http-error/http-error';

interface ValidationRule {
    validate: (value: any) => boolean;
    message: string;
}

export const validate = (rules: Record<string, ValidationRule>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            for (const [field, rule] of Object.entries(rules)) {
                const value = req.body[field];
                if (!rule.validate(value)) {
                    throw new HttpError(rule.message, 400);
                }
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};

// Common validation rules
export const commonValidations = {
    text: {
        validate: (value: any) => 
            typeof value === 'string' && value.trim().length > 0,
        message: 'Search text is required and must be a non-empty string'
    },
    limit: {
        validate: (value: any) => 
            value === undefined || 
            (Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 100),
        message: 'Limit must be a number between 1 and 100'
    }
};