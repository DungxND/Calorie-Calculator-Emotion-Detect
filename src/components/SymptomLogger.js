import { useEffect, useState } from 'react';
import { PlusCircle, Trash2, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'symptomLogs';

export const SymptomLogger = () => {
  const [logs, setLogs] = useState([]);
  const [note, setNote] = useState('');
  const [emotion, setEmotion] = useState('neutral');
  const [severity, setSeverity] = useState('mild');

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setLogs(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  const addLog = () => {
    const entry = { id: Date.now(), note, emotion, severity, time: new Date().toISOString() };
    setLogs([entry, ...logs]);
    setNote('');

    // Call server API to get supportive advice from Gemini
    (async () => {
      try {
        const res = await fetch('/api/gemini_advice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
        const data = await res.json();
        if (data?.success && data?.advice) {
          // Attach advice to the most recent entry in logs
          setLogs((prev) => {
            const updated = prev.map((l) => (l.id === entry.id ? { ...l, advice: data.advice } : l));
            return updated;
          });
        }
      } catch (err) {
        console.error('Failed to get advice:', err);
      }
    })();
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="card bg-base-100 shadow-xl mt-6 w-full">
      <div className="card-body">
        <h2 className="card-title text-lg font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          Ghi nhận triệu chứng / Tâm trạng
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <textarea
            className="textarea textarea-bordered col-span-2 w-full"
            placeholder="Ghi chú (ví dụ: đau bụng, đầy hơi...)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-label="Ghi chú triệu chứng"
          />
          <div className="flex flex-col gap-4">
            <select
              className="select select-bordered w-full"
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              aria-label="Cảm xúc"
            >
              <option value="neutral">😐 Bình thường</option>
              <option value="happy">😊 Vui</option>
              <option value="sad">😢 Buồn</option>
              <option value="angry">😠 Khó chịu</option>
              <option value="surprised">😮 Ngạc nhiên</option>
              <option value="fearful">😨 Lo lắng</option>
            </select>
            <select
              className="select select-bordered w-full"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              aria-label="Mức độ"
            >
              <option value="mild">🟢 Nhẹ</option>
              <option value="moderate">🟡 Vừa</option>
              <option value="severe">🔴 Nặng</option>
            </select>
          </div>
        </div>

        <div className="card-actions justify-end">
          <button className="btn btn-outline btn-error gap-2" onClick={clearLogs}>
            <Trash2 className="w-4 h-4" /> Xóa tất cả
          </button>
          <button className="btn btn-primary gap-2" onClick={addLog} disabled={!note}>
            <PlusCircle className="w-4 h-4" /> Thêm ghi chép
          </button>
        </div>

        <div className="divider"></div>

        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-4">Ghi chép gần đây</h3>
          {logs.length === 0 && <p className="text-base-content/60 italic">Chưa có ghi chép nào.</p>}
          <ul className="space-y-4">
            {logs.map(l => (
              <li key={l.id} className="card bg-base-200 compact shadow-sm">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-base-content/60 mb-1">
                        {new Date(l.time).toLocaleString('vi-VN')}
                      </p>
                      <h4 className="font-bold text-lg">{l.note}</h4>
                      <div className="flex gap-2 mt-2">
                        <span className="badge badge-outline">Cảm xúc: {l.emotion}</span>
                        <span className={`badge ${l.severity === 'severe' ? 'badge-error' : l.severity === 'moderate' ? 'badge-warning' : 'badge-success'}`}>
                          Mức độ: {l.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                  {l.advice && (
                    <div className="alert alert-info mt-3 text-sm">
                      <div>
                        <strong className="block mb-1">💡 Lời khuyên AI:</strong>
                        <span className="whitespace-pre-line">{l.advice}</span>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SymptomLogger;
