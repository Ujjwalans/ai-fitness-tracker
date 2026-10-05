import WeightLog from "../models/WeightLog.js";

export async function addWeight(req, res, next) {
  try {
    const log = await WeightLog.create({
      userId: req.userId,
      weightKg: req.body.weightKg,
      note: req.body.note
    });
    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
}

export async function getWeights(req, res, next) {
  try {
    const logs = await WeightLog.find({ userId: req.userId }).sort({ loggedAt: 1 });
    res.json(logs);
  } catch (error) {
    next(error);
  }
}
