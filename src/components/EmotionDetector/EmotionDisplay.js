export const EmotionDisplay = ({ emotion, confidence }) => {
    const getEmotionColor = (emotion) => {
        const colors = {
            happy: 'bg-green-500',
            sad: 'bg-blue-500',
            angry: 'bg-red-500',
            neutral: 'bg-gray-500',
            surprised: 'bg-yellow-500',
            fearful: 'bg-purple-500',
            disgusted: 'bg-orange-500'
        };
        return colors[emotion] || 'bg-gray-500';
    };

    return (
        <div className="mt-4 p-4 rounded-lg shadow-md bg-white">
            <h3 className="text-xl font-semibold mb-2">Current Emotion</h3>
            <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full ${getEmotionColor(emotion)}`}></div>
                <span className="text-lg capitalize">{emotion}</span>
                <span className="text-sm text-gray-500">
                    ({Math.round(confidence * 100)}%)
                </span>
            </div>
        </div>
    );
};