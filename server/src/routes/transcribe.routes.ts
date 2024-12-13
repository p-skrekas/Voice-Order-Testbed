import { Router } from "express";
import { createReadStream } from "fs";
import { Readable } from "stream";

const router = Router();

router.post("/transcribe", async (req, res) => {
  try {
    const audioPath = req.body.audioPath;
    const fileStream = createReadStream(audioPath);
    const buffer = await streamToBuffer(fileStream);

    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from('Content-Disposition: form-data; name="file"; filename="audio.mp3"\r\n'),
      Buffer.from('Content-Type: audio/mpeg\r\n\r\n'),
      buffer,
      Buffer.from('\r\n'),
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from('Content-Disposition: form-data; name="model"\r\n\r\n'),
      Buffer.from('whisper-1\r\n'),
      Buffer.from(`--${boundary}--\r\n`),
    ]);

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    });

    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error("Transcription error:", error);
    res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

// Helper function to convert stream to buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export default router;