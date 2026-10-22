
import { Router } from "express";
import prisma from "../prisma.js";

const router = Router();

// GET all transcripts
router.get("/", async (req, res) => {
  try {
    const transcripts = await prisma.transcript.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: transcripts });
  } catch (error) {
    console.error("Fetch transcripts error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch transcripts" });
  }
});

// GET one transcript
router.get("/:id", async (req, res) => {
  try {
    const transcript = await prisma.transcript.findUnique({
      where: { id: req.params.id },
    });

    if (!transcript) {
      return res.status(404).json({ success: false, message: "Transcript not found" });
    }

    res.json({ success: true, data: transcript });
  } catch (error) {
    console.error("Fetch transcript error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch transcript" });
  }
});

// CREATE transcript
router.post("/", async (req, res) => {
  try {
    const { title, content, language = "auto" } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ success: false, message: "Transcript content is required" });
    }

    const transcript = await prisma.transcript.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        language,
      },
    });

    res.status(201).json({ success: true, data: transcript });
  } catch (error) {
    console.error("Create transcript error:", error);
    res.status(500).json({ success: false, message: "Failed to save transcript" });
  }
});

// UPDATE transcript
router.patch("/:id", async (req, res) => {
  try {
    const { title, content, language } = req.body;
    const data = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ success: false, message: "Title cannot be empty" });
      }
      data.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ success: false, message: "Content cannot be empty" });
      }
      data.content = content.trim();
    }

    if (language !== undefined) {
      if (typeof language !== "string") {
        return res.status(400).json({ success: false, message: "Invalid language" });
      }
      data.language = language;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: "Provide a field to update" });
    }

    const transcript = await prisma.transcript.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ success: true, data: transcript });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Transcript not found" });
    }

    console.error("Update transcript error:", error);
    res.status(500).json({ success: false, message: "Failed to update transcript" });
  }
});

// DELETE transcript
router.delete("/:id", async (req, res) => {
  try {
    await prisma.transcript.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: "Transcript deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Transcript not found" });
    }

    console.error("Delete transcript error:", error);
    res.status(500).json({ success: false, message: "Failed to delete transcript" });
  }
});

export default router;
