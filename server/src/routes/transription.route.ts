import { Router, RequestHandler } from "express";

const router = Router();

const transcribeAudio: RequestHandler = async (req, res, next) => {
    try {
        const { audioUrl } = req.body;
        const transcription = await transcribeAudio(audioUrl);
    }
}

router.post("/transcribe", transcribeAudio);

export default router;