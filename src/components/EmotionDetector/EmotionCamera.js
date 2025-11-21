import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

const EMOTION_CONFIG = {
    Happy: {
        threshold: 0.28,
        features: {
            mouthSmileLeft: 0.40,
            mouthSmileRight: 0.40,
            cheekSquintLeft: 0.12,
            cheekSquintRight: 0.08,
        },
    },
    Sad: {
        threshold: 0.22,
        features: {
            mouthFrownLeft: 0.30,
            mouthFrownRight: 0.30,
            browInnerUp: 0.25,
            eyeWideLeft: 0.08,
            eyeWideRight: 0.07,
        },
    },
    Angry: {
        threshold: 0.32,
        features: {
            browDownLeft: 0.30,
            browDownRight: 0.30,
            eyeSquintLeft: 0.15,
            eyeSquintRight: 0.15,
            jawForward: 0.10,
        },
    },
    Surprised: {
        threshold: 0.35,
        features: {
            jawOpen: 0.35,
            eyeWideLeft: 0.25,
            eyeWideRight: 0.25,
            browInnerUp: 0.10,
            browOuterUpLeft: 0.03,
            browOuterUpRight: 0.02,
        },
    },
    Disgust: {
        threshold: 0.30,
        features: {
            noseSneerLeft: 0.35,
            noseSneerRight: 0.35,
            mouthUpperUpLeft: 0.15,
            mouthUpperUpRight: 0.15,
        },
    },
    Fear: {
        threshold: 0.28,
        features: {
            eyeWideLeft: 0.25,
            eyeWideRight: 0.25,
            browInnerUp: 0.25,
            jawOpen: 0.12,
            mouthStretchLeft: 0.07,
            mouthStretchRight: 0.06,
        },
    },
};

const ALPHA = 0.25; // Exponential Moving Average factor (0-1)
const MARGIN = 0.08; // Minimum difference between top 2 emotions

export const EmotionCamera = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [faceLandmarker, setFaceLandmarker] = useState(null);
    const [emotion, setEmotion] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [webcamRunning, setWebcamRunning] = useState(false);

    const runningRef = useRef(false);
    const requestRef = useRef();
    const smoothedRef = useRef(null);

    useEffect(() => {
        const initMediaPipe = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );

                const landmarker = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU"
                    },
                    outputFaceBlendshapes: true,
                    runningMode: "VIDEO",
                    numFaces: 1
                });

                setFaceLandmarker(landmarker);
                setIsLoading(false);
            } catch (error) {
                console.error("Error initializing MediaPipe:", error);
                setIsLoading(false);
            }
        };

        initMediaPipe();

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, []);

    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.addEventListener("loadeddata", predictWebcam);
                setWebcamRunning(true);
                runningRef.current = true;
            }
        } catch (err) {
            console.error("Error accessing webcam:", err);
        }
    };

    const predictWebcam = async () => {
        if (!faceLandmarker || !videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const drawingUtils = new DrawingUtils(ctx);

        if (video.videoWidth && video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        let startTimeMs = performance.now();

        if (video.currentTime > 0) {
            const results = faceLandmarker.detectForVideo(video, startTimeMs);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (results.faceLandmarks) {
                for (const landmarks of results.faceLandmarks) {
                    drawingUtils.drawConnectors(
                        landmarks,
                        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
                        { color: "#C0C0C070", lineWidth: 1 }
                    );
                    drawingUtils.drawConnectors(
                        landmarks,
                        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
                        { color: "#FF3030" }
                    );
                    drawingUtils.drawConnectors(
                        landmarks,
                        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
                        { color: "#FF3030" }
                    );
                    drawingUtils.drawConnectors(
                        landmarks,
                        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
                        { color: "#30FF30" }
                    );
                    drawingUtils.drawConnectors(
                        landmarks,
                        FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
                        { color: "#30FF30" }
                    );
                    drawingUtils.drawConnectors(
                        landmarks,
                        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
                        { color: "#E0E0E0" }
                    );
                    drawingUtils.drawConnectors(
                        landmarks,
                        FaceLandmarker.FACE_LANDMARKS_LIPS,
                        { color: "#E0E0E0" }
                    );
                }
            }

            if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                const blendshapes = results.faceBlendshapes[0].categories;
                detectEmotion(blendshapes);
            }
        }

        if (runningRef.current) {
            requestRef.current = requestAnimationFrame(predictWebcam);
        }
    };

    const detectEmotion = (blendshapes) => {
        // 1. Build score map for O(1) access
        const scoreMap = {};
        for (const { categoryName, score } of blendshapes) {
            scoreMap[categoryName] = score;
        }
        const get = (name) => scoreMap[name] || 0;

        // 2. Compute current raw scores based on configuration
        const currentScores = {};
        for (const [emotionName, cfg] of Object.entries(EMOTION_CONFIG)) {
            let raw = 0;
            let weightSum = 0;
            for (const [feature, w] of Object.entries(cfg.features)) {
                raw += get(feature) * w;
                weightSum += w;
            }
            currentScores[emotionName] = weightSum > 0 ? raw / weightSum : 0;
        }

        // 3. Apply Exponential Moving Average (EMA) smoothing
        if (!smoothedRef.current) {
            smoothedRef.current = { ...currentScores };
        } else {
            const prev = smoothedRef.current;
            const next = {};
            for (const key of Object.keys(currentScores)) {
                next[key] = ALPHA * currentScores[key] + (1 - ALPHA) * prev[key];
            }
            smoothedRef.current = next;
        }

        // 4. Decide Emotion with Margin and Threshold logic
        const smoothedScores = smoothedRef.current;
        const entries = Object.entries(smoothedScores);

        entries.sort((a, b) => b[1] - a[1]);

        const [bestEmotion, bestScore] = entries[0] || ['Neutral', 0];
        const secondScore = entries[1]?.[1] ?? 0;

        const cfg = EMOTION_CONFIG[bestEmotion];

        const passesThreshold = cfg && bestScore >= cfg.threshold;
        const passesMargin = bestScore - secondScore >= MARGIN;

        let finalLabel = 'Neutral';
        let finalConfidence = 1 - bestScore;

        if (passesThreshold && passesMargin) {
            finalLabel = bestEmotion;
            finalConfidence = bestScore;
        } else if (passesThreshold && !passesMargin) {
            if (bestScore > 0.6) {
                finalLabel = bestEmotion;
                finalConfidence = bestScore;
            }
        }

        setEmotion(`${finalLabel} (${Math.round(finalConfidence * 100)}%)`);
    };

    useEffect(() => {
        if (!isLoading && faceLandmarker && !webcamRunning) {
            startWebcam();
        }
    }, [isLoading, faceLandmarker]);

    return (
        <div className="relative w-full max-w-[720px] mx-auto rounded-xl overflow-hidden shadow-xl bg-black">
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-100 z-20">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <p className="mt-4 text-base-content/70">Loading AI Models...</p>
                </div>
            )}

            <video
                ref={videoRef}
                className="w-full h-auto block"
                autoPlay
                playsInline
                muted
            />
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full z-10"
            />

            {emotion && (
                <div className="absolute bottom-4 left-4 z-20">
                    <div className={`badge badge-lg p-4 text-lg font-bold shadow-lg ${emotion.startsWith('Neutral') ? 'badge-ghost bg-base-100/80' : 'badge-primary'
                        }`}>
                        {emotion}
                    </div>
                </div>
            )}
        </div>
    );
};