import { useState } from 'react';
import { CalorieCalculatorPage } from "@/components/calorie-calculator";
import { EmotionCamera } from "@/components/EmotionDetector/EmotionCamera";
import { EmotionDisplay } from "@/components/EmotionDetector/EmotionDisplay";

export default function Home() {
  const [showEmotionDetector, setShowEmotionDetector] = useState(false);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setShowEmotionDetector(!showEmotionDetector)}
          className="btn btn-primary"
        >
          {showEmotionDetector ? 'Show Calorie Calculator' : 'Show Emotion Detector'}
        </button>
      </div>

      {showEmotionDetector ? (
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4">Emotion Detection</h2>
          <EmotionCamera />
        </div>
      ) : (
        <CalorieCalculatorPage />
      )}
    </main>
  );
}
