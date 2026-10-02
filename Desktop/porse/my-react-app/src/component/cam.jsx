import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import "./cam.css";

const TARGET_LABELS = ["goat", "hen"];
const MIN_SCORE = 0.48;
const SOUND_MS = 14000;
const COOLDOWN_MS = 17000;
const SOUND_URL = "/goats.mp3";

function BirdDetector() {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const modelRef = useRef(null);
  const labelsRef = useRef([]);
  const runningRef = useRef(false);
  const lastPlayedRef = useRef(-COOLDOWN_MS);
  const soundTimerRef = useRef(null);

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
      modelRef.current = await tf.loadLayersModel("/model/model.json");
      const meta = await (await fetch("/model/metadata.json")).json();
      labelsRef.current = meta.labels;

      runningRef.current = true;
      setStatus("Watching...");
      requestAnimationFrame(loop);
    } catch (err) {
      setStatus("Error: " + err.name + " - " + err.message);
      setRunning(false);
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

  const loop = async (timestamp) => {
    if (!runningRef.current) return;

    try {
      const video = videoRef.current;
      if (video && video.readyState === 4) {
        const input = tf.tidy(() => {
          const img = tf.browser.fromPixels(video);
          const size = Math.min(img.shape[0], img.shape[1]);
          const top = Math.floor((img.shape[0] - size) / 2);
          const left = Math.floor((img.shape[1] - size) / 2);
          return img
            .slice([top, left, 0], [size, size, 3])
            .resizeBilinear([224, 224])
            .toFloat()
            .div(127.5)
            .sub(1)
            .expandDims(0);
        });

        const output = modelRef.current.predict(input);
        const probs = await output.data();
        input.dispose();
        output.dispose();

        let bestScore = 0;
        let bestLabel = "";
        TARGET_LABELS.forEach((name) => {
          const i = labelsRef.current.indexOf(name);
          if (i !== -1 && probs[i] > bestScore) {
            bestScore = probs[i];
            bestLabel = name;
          }
        });

        if (bestScore > MIN_SCORE) {
          setDetected(true);
          setScore(Math.round(bestScore * 100));
          setStatus(`${bestLabel} detected`);

          if (timestamp - lastPlayedRef.current > COOLDOWN_MS) {
            lastPlayedRef.current = timestamp;
            playAlarm();
          }
        } else {
          setDetected(false);
          setScore(Math.round(bestScore * 100));
          setStatus("Watching... nothing detected");
        }
      }
    } catch (err) {
      console.log("Loop error:", err);
      setStatus("Loop error: " + err.message);
    }

    setTimeout(() => loop(performance.now()), 300);
  };

  const stop = () => {
    runningRef.current = false;
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
      </div>
    </div>
  );
}

export default BirdDetector;