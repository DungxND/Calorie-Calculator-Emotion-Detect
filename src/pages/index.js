import { useState } from 'react';
import { CalorieCalculatorPage } from "@/components/calorie-calculator";
import { EmotionCamera } from "@/components/EmotionDetector/EmotionCamera";
import { Camera, Utensils } from 'lucide-react';

export default function Home() {
  const [showEmotionDetector, setShowEmotionDetector] = useState(false);

  return (
    <div className="w-full">
      <div className="flex justify-center mb-8">
        <div className="join shadow-md bg-base-100 rounded-full p-1 border border-base-200">
          <button
            onClick={() => setShowEmotionDetector(false)}
            className={`join-item btn btn-sm rounded-full px-6 gap-2 ${!showEmotionDetector ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Utensils className="w-4 h-4" />
            Tính Calo
          </button>
          <button
            onClick={() => setShowEmotionDetector(true)}
            className={`join-item btn btn-sm rounded-full px-6 gap-2 ${showEmotionDetector ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Camera className="w-4 h-4" />
            Nhận diện cảm xúc
          </button>
        </div>
      </div>

      <div className="animate-fade-in-up">
        {showEmotionDetector ? (
          <div className="flex flex-col items-center max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">Nhận diện cảm xúc</h2>
              <p className="text-base-content/60">Sử dụng AI để phân tích biểu cảm khuôn mặt theo thời gian thực</p>
            </div>
            <div className="card bg-base-100 shadow-xl w-full p-4">
              <EmotionCamera />
            </div>
          </div>
        ) : (
          <CalorieCalculatorPage />
        )}
      </div>
    </div>
  );
}
