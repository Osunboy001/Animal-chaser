import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "./cam.css";
const TARGETS = ["goat"];
const MIN_SCORE = 0.5;
const COOLDOWN_MS = 6000;
const SOUND_URL = "/goats.mp3";

function BirdDetector() {
  const videoRef = useRef(null);``
  const audioRef = useRef(null);
  const modelRef = useRef(null);
  const runningRef = useRef(false);
  const lastPlayedRef = useRef(-COOLDOWN_MS);

  const [status, setStatus] = useState("Click Start");
  const [detected, setDetected] = useState(false);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);

  const start = async () => {
    if (runningRef.current) return;
    setRunning(true);
    let stream ;
    try {
             setStatus("Opening webcam...")
         stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } },
      audio: false,
  
         })

        }
        catch (e) {
   
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    e.name
         }
 
   videoRef.current.srcObject = stream;
videoRef.current.muted = true;
videoRef.current.setAttribute("playsinline", "");
 await videoRef.current.play();

    try {  setStatus("Loading model...");
      await tf.ready();
      modelRef.current = await cocoSsd.load();

      runningRef.current = true;
      setStatus("Watching...");
      requestAnimationFrame(loop);
    }
    
    
    catch (err) {
      setStatus("Error: " + err.message);
      setRunning(false);
    }
  };

  const loop = async (timestamp) => {
    if (!runningRef.current) return;

    const video = videoRef.current;
    if (video && video.readyState === 4) {
      const results = await modelRef.current.detect(video);
      const found = results.find(
        (r) => TARGETS.includes(r.class) && r.score > MIN_SCORE
      );

      if (found) {
        setDetected(true);
        setScore(Math.round(found.score * 100));
        setStatus(`${found.class} detected`);

        if (timestamp - lastPlayedRef.current > COOLDOWN_MS) {
          lastPlayedRef.current = timestamp;
          audioRef.current.currentTime = 0;
          audioRef.current
            .play()
            .catch((err) => console.log("Sound error:", err.message));
        }
      } else {
        setDetected(false);
        setScore(0);
        setStatus("Watching... nothing detected");
      }
    }

    requestAnimationFrame(loop);
  };

  const stop = () => {
    runningRef.current = false;
    audioRef.current?.pause();
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach((t) => t.stop());
    setDetected(false);
    setScore(0);
    setRunning(false);
    setStatus("Stopped");
  };

  useEffect(() => stop, []);

  const mode = detected ? "detected" : running ? "watching" : "idle";

  return (
    <div className={`detector ${mode}`}>
      <div className="card">
        <div className="header">
          <h1 className="title">Goat Guard</h1>
          <span className="status">
            <span className="dot" />
            {status}
          </span>
        </div>

        <video ref={videoRef} className="video" muted playsInline />
        <audio ref={audioRef} src={SOUND_URL} preload="auto" />

        <div className="meter">
          <div className="meter-row">
            <span>Confidence</span>
            <strong className="meter-value">{score}%</strong>
          </div>
          <div className="track">
            <div className="fill" style={{ width: `${score}%` }} />
          </div>
        </div>

        <div className="buttons">
          <button className="btn btn-start" onClick={start} disabled={running}>
            Start
          </button>
          <button className="btn btn-stop" onClick={stop} disabled={!running}>
            Stop
          </button>
        </div>
      </div>
    </div>
  );
}

export default BirdDetector;