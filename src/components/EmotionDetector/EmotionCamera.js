import { useEffect, useRef, useState } from 'react';

export const EmotionCamera = () => {
    const videoRef = useRef();
    const canvasRef = useRef();
    const [emotion, setEmotion] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const detectionRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        const loadModels = async () => {
            if (!isMounted) return;
            
            try {
                setIsLoading(true);
                setError(null);

                if (!window.faceapi) {
                    console.error('Face API is not loaded');
                    setError('Face detection library not loaded');
                    setIsLoading(false);
                    return;
                }

                console.log("Loading models...");
                const MODEL_URL = '/models';

                await Promise.all([
                    window.faceapi.nets.tinyFaceDetector.load(MODEL_URL),
                    window.faceapi.nets.faceExpressionNet.load(MODEL_URL)
                ]);

                console.log("Models loaded successfully");
                if (isMounted) {
                    setIsLoading(false);
                    startVideo();
                }
            } catch (err) {
                console.error("Error loading models:", err);
                if (isMounted) {
                    setError("Failed to load face detection models");
                    setIsLoading(false);
                }
            }
        };

        const startVideo = async () => {
            if (!isMounted) return;

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: 720,
                        height: 560,
                        facingMode: "user"
                    }
                });
                if (videoRef.current && isMounted) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing webcam:", err);
                if (isMounted) {
                    setError("Failed to access webcam");
                }
            }
        };

        // Wait for faceapi and window to be available
        if (typeof window !== 'undefined') {
            const checkFaceApi = setInterval(() => {
                if (window.faceapi) {
                    clearInterval(checkFaceApi);
                    loadModels();
                }
            }, 100);
        }

        return () => {
            isMounted = false;
            if (detectionRef.current) {
                clearInterval(detectionRef.current);
            }
            const stream = videoRef.current?.srcObject;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handlePlay = () => {
        if (!videoRef.current || !canvasRef.current || !window.faceapi) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        const displaySize = { width: video.width, height: video.height };
        window.faceapi.matchDimensions(canvas, displaySize);

        // Clear any existing detection interval
        if (detectionRef.current) {
            clearInterval(detectionRef.current);
        }

        const detectEmotions = async () => {
            if (video.paused || video.ended) return;

            try {
                const detections = await window.faceapi
                    .detectAllFaces(
                        video,
                        new window.faceapi.TinyFaceDetectorOptions({
                            inputSize: 224,
                            scoreThreshold: 0.5
                        })
                    )
                    .withFaceExpressions();

                if (detections && detections.length > 0) {
                    const resizedDetections = window.faceapi.resizeResults(detections, displaySize);
                    
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    window.faceapi.draw.drawDetections(canvas, resizedDetections);
                    
                    const expressions = detections[0].expressions;
                    const dominantEmotion = Object.entries(expressions)
                        .reduce((a, b) => a[1] > b[1] ? a : b)[0];
                    
                    setEmotion(dominantEmotion);

                    new window.faceapi.draw.DrawTextField(
                        [`${dominantEmotion}: ${Math.round(expressions[dominantEmotion] * 100)}%`],
                        resizedDetections[0].detection.box.bottomLeft,
                        {
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            fontSize: 16,
                            padding: 10
                        }
                    ).draw(canvas);
                }
            } catch (error) {
                console.error("Error in detection:", error);
            }
        };

        detectionRef.current = setInterval(detectEmotions, 100);
    };

    return (
        <div className="relative inline-block">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                        <div className="loading loading-spinner loading-lg"></div>
                        <p className="mt-4 text-gray-600">Loading face detection models...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg">
                    <div className="text-center text-red-600">
                        <p className="text-xl mb-2">Error</p>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onPlay={handlePlay}
                className="rounded-lg shadow-lg"
                width="720"
                height="560"
            />
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 pointer-events-none"
                width="720"
                height="560"
            />
            {emotion && (
                <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow">
                    <p className="text-lg font-semibold">
                        Emotion: <span className="text-primary capitalize">{emotion}</span>
                    </p>
                </div>
            )}
        </div>
    );
};