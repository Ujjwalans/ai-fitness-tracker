import fs from "fs/promises";

import HealthProfile from "../models/HealthProfile.js";

import { analyzeStyleImage } from "../services/styleVisionService.js";

import {
  generateStyleRecommendations,
} from "../services/styleRecommendationService.js";


export async function analyzeStylePhoto(req, res) {
  let uploadedFilePath = null;

  try {
    // ==========================================
    // CHECK PHOTO
    // ==========================================

    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a photo.",
      });
    }

    uploadedFilePath = req.file.path;

    console.log("====================================");
    console.log("AI STYLE ADVISOR");
    console.log("====================================");

    console.log("Photo received:", {
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });


    // ==========================================
    // LOAD HEALTH PROFILE
    // ==========================================

    const profile = await HealthProfile.findOne({
      userId: req.userId,
    }).lean();


    if (!profile) {
      return res.status(400).json({
        message:
          "Please complete your Health Profile before using Style Advisor.",
      });
    }


    // ==========================================
    // PROFILE INFORMATION USED FOR STYLE
    // ==========================================

    const styleProfile = {
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      goal: profile.goal,
      activityLevel: profile.activityLevel,
      dietPreference: profile.dietPreference,
    };


    console.log(
      "User style profile loaded:",
      styleProfile
    );


    // ==========================================
    // STEP 1 — VISION ANALYSIS
    // ==========================================

    console.log(
      "Starting visual style analysis..."
    );

    const visualAnalysis =
      await analyzeStyleImage(
        uploadedFilePath
      );


    console.log(
      "Visual analysis completed."
    );


    // ==========================================
    // STEP 2 — PERSONALIZED RECOMMENDATIONS
    // ==========================================

    console.log(
      "Generating personalized style recommendations..."
    );

    const recommendations =
      await generateStyleRecommendations({
        profile: styleProfile,
        visualAnalysis,
      });


    console.log(
      "Personalized recommendations completed."
    );


    // ==========================================
    // FINAL RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      message:
        "Personalized style analysis completed successfully.",

      profile: styleProfile,

      visualAnalysis,

      recommendations,
    });


  } catch (error) {

    console.error(
      "===================================="
    );

    console.error(
      "STYLE ADVISOR ERROR"
    );

    console.error(
      "===================================="
    );

    console.error(error);


    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Unable to generate personalized style recommendations.",
    });


  } finally {

    // ==========================================
    // DELETE TEMPORARY PHOTO
    // ==========================================

    if (uploadedFilePath) {

      try {

        await fs.unlink(
          uploadedFilePath
        );

        console.log(
          "Temporary style photo deleted."
        );

      } catch (cleanupError) {

        console.error(
          "Could not delete temporary style photo:",
          cleanupError.message
        );

      }
    }
  }
}