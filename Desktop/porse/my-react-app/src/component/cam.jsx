import {Link} from "react-router-dom"
import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "./cam.css";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const TARGETS = ["sheep", "cow", "bird"];
const MIN_SCORE = 0.4;
const SOUND_MS = 14000;
const COOLDOWN_MS = 17000;
const CHECK_MS = 500;
const SOUND_URL = "/goats.mp3";

function BirdDetector() {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const modelRef = useRef(null);
  const runningRef = useRef(false);
  const cooldownRef = useRef(false);
  const soundTimerRef = useRef(null);
  const checkTimerRef = useRef(null);

  const [status, setStatus] = useState("Click Start");
  const [detected, setDetected] = useState(false);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [facing, setFacing] = useState("environment");

  const openCamera = async (mode) => {
    const old = videoRef.current.srcObject;
    old?.getTracks().forEach((t) => t.stop());

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: mode } },
        audio: false,
      });
    } catch (e) {
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
  };

  const switchCamera = async () => {
    const next = facing === "environment" ? "user" : "environment";
    if (!runningRef.current) {
      setFacing(next);
      return;
    }
    try {
      await openCamera(next);
      setFacing(next);
    } catch (err) {
      setStatus("Error: " + err.name + " - " + err.message);
    }
  };

  const playAlarm = () => {
    const audio = audioRef.current;
    clearTimeout(soundTimerRef.current);
    audio.loop = true;
    audio.currentTime = 0;
    audio.play().catch((err) => console.log("Sound error:", err.message));
    soundTimerRef.current = setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, SOUND_MS);
  };

const sendDetection = async (label, score) => {
  const video = videoRef.current;
  const photos = [];

  for (let i = 0; i < 3; i++) {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = Math.round((640 * video.videoHeight) / video.videoWidth);
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    photos.push(canvas.toDataURL("image/jpeg", 0.7));
    await new Promise((r) => setTimeout(r, 1000));
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/detection/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        score,
        photos,
        detectedAt: new Date().toISOString(),
      }),
    });
    const data = await res.json();
    console.log("Saved:", data);
  } catch (err) {
    console.log("Upload error:", err.message);
  }
};


  
  const loop = async () => {
    if (!runningRef.current) return;

    try {
      const video = videoRef.current;
      if (video && video.readyState === 4) {
        const results = await modelRef.current.detect(video);
        console.log(results.map((r) => r.class + " " + Math.round(r.score * 100)));

        const found = results
          .filter((r) => TARGETS.includes(r.class) && r.score > MIN_SCORE)
          .sort((a, b) => b.score - a.score)[0];

        if (found) {
          setDetected(true);
          setScore(Math.round(found.score * 100));
          setStatus(`${found.class} detected`);

          if (!cooldownRef.current) {
            cooldownRef.current = true;
            playAlarm();
            sendDetection(found.class, Math.round(found.score * 100))
            setTimeout(() => {
              cooldownRef.current = false;
            }, COOLDOWN_MS);
          }
        } else {
          setDetected(false);
          setScore(0);
          setStatus("Watching... nothing detected");
        }
      }
    } catch (err) {
      console.log("Loop error:", err);
      setStatus("Loop error: " + err.message);
    }

    checkTimerRef.current = setTimeout(loop, CHECK_MS);


    
  };

  const start = async () => {
    if (runningRef.current) return;
    setRunning(true);

    try {
      await audioRef.current.play().catch(() => {});
      audioRef.current.pause();

      setStatus("Opening webcam...");
      await openCamera(facing);

      setStatus("Loading model...");
      await tf.ready();
    modelRef.current = await cocoSsd.load();

      runningRef.current = true;
      setStatus("Watching...");
      loop();
    } catch (err) {
      setStatus("Error: " + err.name + " - " + err.message);
      setRunning(false);
    }
  };

  const stop = () => {
    runningRef.current = false;
    cooldownRef.current = false;
    clearTimeout(checkTimerRef.current);
    clearTimeout(soundTimerRef.current);
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
          <button className="btn" onClick={switchCamera}>
            Switch to {facing === "environment" ? "front" : "back"} camera
          </button>
        </div>

        <div>
          <Link to ="/dashboard">
            <button className="dashboardbtn">Move to dashbaord</button>
            
          </Link>
        </div>
      </div>
    </div>
  
  );
}

export default BirdDetector;