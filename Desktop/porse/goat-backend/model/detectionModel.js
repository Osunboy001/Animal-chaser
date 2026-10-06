const mongoose = require("mongoose");

const detectionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    photos: {
      type: [String],
      validate: {
        validator: (arr) => arr.length >= 1 && arr.length <= 3,
        message: "photos must have 1 to 3 items",
      },
    },
    detectedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["new", "reviewed"],
      default: "new",
    },
    cameraId: {
        type: String,
        
    }

  },
  { timestamps: true }
);

detectionSchema.index({ detectedAt: -1 });

module.exports = mongoose.model("Detection", detectionSchema);