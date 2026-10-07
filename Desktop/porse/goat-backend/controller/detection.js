
const Detection = require('../model/detectionModel')
const ALLOWED_LABELS = ["goat", "hen", "sheep", "cow", "bird", "dog"];

 const createDetection = async (req, res, next) => {

    try {
     const { label, score, photos, detectedAt, cameraId } = req.body;

    if (!ALLOWED_LABELS.includes(label)) {
      return res.status(400).json({ error: "label is missing or not allowed" });
    }

    if (typeof score !== "number" || score < 0 || score > 100) {
      return res.status(400).json({ error: "score must be a number from 0 to 100" });
    }

    if (!Array.isArray(photos) || photos.length < 1 || photos.length > 3) {
      return res.status(400).json({ error: "send between 1 and 3 photos" });
    }

    const allImages = photos.every(
      (p) => typeof p === "string" && p.startsWith("data:image/")
    );
    if (!allImages) {
      return res.status(400).json({ error: "photos must be image data" });
    }

    const date = detectedAt ? new Date(detectedAt) : undefined;
    if (date && isNaN(date.getTime())) {
      return res.status(400).json({ error: "detectedAt is not a valid date" });
    }

    const detection = await Detection.create({
      label,
      score,
      photos,
      detectedAt: date,
      cameraId,
    
    });

  
    res.status(201).json({ ok: true, id: detection._id });
  } catch (err) {
    next(err);
  }
};


const getDetection = async (req,res,next) => {
 

  try {
 const detections =   await Detection.find({

  }).sort({
    
   detectedAt: -1
  
  })
res.status(200).json({
detections
}) 
}

catch(err) {
next(err)
}



}

module.exports =  {createDetection ,getDetection};



 