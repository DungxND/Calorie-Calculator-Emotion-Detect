import { useState, useEffect } from 'react';
import { Activity, Calculator, RotateCcw, Trash2 } from 'lucide-react';

export const GrowthTracker = () => {
  const [childData, setChildData] = useState({
    age: '',
    weight: '',
    height: '',
    gender: 'male'
  });

  const [history, setHistory] = useState([]);
  const [recommendedCalories, setRecommendedCalories] = useState(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('growthHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('growthHistory', JSON.stringify(history));
  }, [history]);

  const calculateCalories = (data) => {
    const { age, weight, height, gender } = data;
    if (!age || !weight || !height) return null;

    let bmr;
    if (gender === 'male') {
      bmr = 22.7 * parseFloat(weight) + 495;
    } else {
      bmr = 22.5 * parseFloat(weight) + 499;
    }

    const calories = Math.round(bmr * 1.5);
    return calories;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setChildData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const calories = calculateCalories(childData);
    setRecommendedCalories(calories);

    const entry = {
      ...childData,
      date: new Date().toISOString(),
      calories
    };
    setHistory([entry, ...history]);
  };

  return (
    <div className="card bg-base-100 shadow-xl mt-6 w-full">
      <div className="card-body">
        <h2 className="card-title text-lg font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Theo dõi tăng trưởng
        </h2>
        <p className="text-sm text-base-content/70 mb-4">
          Nhập thông tin cơ bản của trẻ để nhận khuyến nghị calo hàng ngày.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Tuổi (năm)</span>
              </label>
              <input
                type="number"
                name="age"
                min="0"
                max="18"
                step="0.1"
                value={childData.age}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                required
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Giới tính</span>
              </label>
              <select
                name="gender"
                value={childData.gender}
                onChange={handleInputChange}
                className="select select-bordered w-full"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Cân nặng (kg)</span>
              </label>
              <input
                type="number"
                name="weight"
                min="0"
                step="0.1"
                value={childData.weight}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                required
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Chiều cao (cm)</span>
              </label>
              <input
                type="number"
                name="height"
                min="0"
                step="0.1"
                value={childData.height}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                required
              />
            </div>
          </div>

          <div className="card-actions justify-end mt-6">
            <button
              type="button"
              className="btn btn-ghost gap-2"
              onClick={() => { setChildData({ age: '', weight: '', height: '', gender: 'male' }); setRecommendedCalories(null); }}
            >
              <RotateCcw className="w-4 h-4" /> Đặt lại
            </button>
            <button type="submit" className="btn btn-primary gap-2">
              <Calculator className="w-4 h-4" /> Tính toán
            </button>
          </div>
        </form>

        {recommendedCalories && (
          <div className="alert alert-success shadow-lg mt-6">
            <div>
              <h3 className="font-bold text-lg">Khuyến nghị hàng ngày:</h3>
              <div className="text-xl">
                Cần khoảng <span className="font-black text-3xl">{recommendedCalories}</span> calories/ngày
              </div>
              <div className="text-xs opacity-70 mt-1">
                * Dựa trên công thức Harris-Benedict. Tham khảo ý kiến bác sĩ để có chỉ định chính xác.
              </div>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Lịch sử theo dõi</h3>
              <button className="btn btn-xs btn-outline btn-error gap-1" onClick={() => setHistory([])}>
                <Trash2 className="w-3 h-3" /> Xóa lịch sử
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-base-200">
              <table className="table table-zebra w-full">
                <thead className="bg-base-200">
                  <tr>
                    <th>Ngày</th>
                    <th>Tuổi</th>
                    <th>Cân nặng</th>
                    <th>Chiều cao</th>
                    <th>Calo/ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, index) => (
                    <tr key={index}>
                      <td>{new Date(entry.date).toLocaleDateString('vi-VN')}</td>
                      <td>{entry.age}</td>
                      <td>{entry.weight} kg</td>
                      <td>{entry.height} cm</td>
                      <td className="font-bold text-primary">{entry.calories}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrowthTracker;