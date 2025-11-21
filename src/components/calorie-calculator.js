import { useState, useEffect } from "react";
import LoadingSpinner from "@/components/spinner";
import { AlertModal } from "@/components/model/alert";
import { aggregateInsights } from "@/utils/foodInsights";
import SymptomLogger from "@/components/SymptomLogger";
import GrowthTracker from "@/components/GrowthTracker";
import {
    UploadCloud,
    X,
    Camera,
    Save,
    Trash2,
    Activity,
    FileText,
    Info,
    ChevronDown,
    ChevronUp,
    Utensils
} from "lucide-react";

export const CalorieCalculatorPage = () => {
    const [uploadedImage, setUploadedImage] = useState(null);
    const [foodItems, setFoodItems] = useState([]);
    const [totalCalories, setTotalCalories] = useState(0);
    const [isLoading, setLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('error');
    const [showGrowthTracker, setShowGrowthTracker] = useState(false);
    const [mealHistory, setMealHistory] = useState([]);
    const [showLogger, setShowLogger] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('mealHistory');
            if (raw) setMealHistory(JSON.parse(raw));
        } catch (e) {
            console.warn('Failed to load meal history', e);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('mealHistory', JSON.stringify(mealHistory));
        } catch (e) {
            console.warn('Failed to save meal history', e);
        }
    }, [mealHistory]);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                const base64Image = await getBase64(file);
                setUploadedImage(base64Image);
                sendImageToServer(base64Image);
            } catch (error) {
                console.error('Error reading file:', error);
            }
        }
    };

    const getBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const ImageUpload = ({ onUpload, uploadedImage, onRemove }) => {
        return (
            <div className="relative w-full h-[300px] md:h-[400px] border-2 border-dashed border-base-300 rounded-xl hover:border-primary transition-colors bg-base-100 flex flex-col items-center justify-center overflow-hidden group cursor-pointer">
                {uploadedImage ? (
                    <>
                        <img src={uploadedImage} alt="Uploaded Food" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={(e) => { e.preventDefault(); onRemove(); }}
                                className="btn btn-circle btn-error text-white"
                                aria-label="Xóa ảnh"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </>
                ) : (
                    <label htmlFor="upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6 text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                            <UploadCloud className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Tải ảnh lên</h3>
                        <p className="text-sm text-base-content/60">Nhấp để chọn hoặc kéo thả ảnh món ăn vào đây</p>
                    </label>
                )}
                <input id="upload" type="file" accept="image/*" onChange={onUpload} className="hidden" />
            </div>
        );
    };

    const sendImageToServer = (base64Image) => {
        setLoading(true);
        fetch('/api/detect_food', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setFoodItems(data.items);
                    setTotalCalories(data.count);
                } else {
                    setAlertType('error');
                    setShowAlert(true);
                    setAlertMessage(data.message || 'Lỗi khi phân tích ảnh.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                setAlertType('error');
                setShowAlert(true);
                setAlertMessage('Không thể phân tích ảnh. Vui lòng thử lại.');
            })
            .finally(() => setLoading(false));
    };

    const closeAlertModal = () => setShowAlert(false);

    const handleRemoveImage = () => {
        setUploadedImage(null);
        setFoodItems([]);
        setTotalCalories(0);
    };

    const saveMeal = () => {
        if (!foodItems || foodItems.length === 0) return;
        const entry = {
            id: Date.now(),
            date: new Date().toISOString(),
            items: foodItems,
            calories: totalCalories
        };
        setMealHistory(prev => [entry, ...prev]);
        setAlertType('success');
        setShowAlert(true);
        setAlertMessage('Bữa ăn đã được lưu vào lịch sử.');
    };

    const deleteMeal = (id) => {
        setMealHistory(prev => prev.filter(m => m.id !== id));
    };

    const clearMeals = () => {
        setMealHistory([]);
    };

    const FoodDetection = () => {
        if (foodItems.length === 0) {
            return (
                <div className="card bg-base-100 shadow-lg h-full flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                    <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mb-4">
                        <Utensils className="w-8 h-8 text-base-content/40" />
                    </div>
                    <h3 className="text-xl font-semibold text-base-content/70">Kết quả phân tích</h3>
                    <p className="text-base-content/50 mt-2">Kết quả nhận diện món ăn và calo sẽ hiển thị tại đây</p>
                </div>
            );
        }

        return (
            <div className="card bg-base-100 shadow-lg h-full flex flex-col">
                <div className="card-body p-6">
                    <h2 className="card-title text-2xl justify-center mb-6 flex items-center gap-2">
                        <Utensils className="w-6 h-6 text-primary" />
                        Món đã nhận diện
                    </h2>

                    <div className="flex flex-wrap gap-2 justify-center mb-8">
                        {foodItems.map((item, index) => (
                            <span key={index} className="badge badge-lg badge-primary badge-outline p-4">
                                {item}
                            </span>
                        ))}
                    </div>

                    <div className="stats shadow w-full bg-base-200 mb-6">
                        <div className="stat place-items-center">
                            <div className="stat-title">Tổng năng lượng</div>
                            <div className="stat-value text-primary">{totalCalories}</div>
                            <div className="stat-desc">Calories (ước tính)</div>
                        </div>
                    </div>

                    <div className="bg-base-200/50 rounded-xl p-4 mb-6">
                        <h4 className="font-semibold flex items-center gap-2 mb-3 text-sm uppercase tracking-wide opacity-70">
                            <Info className="w-4 h-4" />
                            Gợi ý dinh dưỡng
                        </h4>
                        <div className="space-y-3">
                            {aggregateInsights(foodItems).map((f, i) => (
                                <div key={i} className="card bg-base-100 compact shadow-sm border border-base-200">
                                    <div className="card-body p-3">
                                        <div className="flex justify-between items-start gap-3">
                                            <div>
                                                <div className="font-bold text-primary">{f.name}</div>
                                                <div className="text-sm text-base-content/80 mt-1 leading-relaxed">{f.insight?.advice}</div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                {(f.insight?.flags || []).map((flag, idx) => (
                                                    <span key={idx} className="badge badge-xs badge-warning">{flag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card-actions justify-center mt-auto pt-4 border-t border-base-200">
                        <button className="btn btn-outline btn-error gap-2" onClick={() => { setFoodItems([]); setTotalCalories(0); }}>
                            <Trash2 className="w-4 h-4" /> Xóa kết quả
                        </button>
                        <button className="btn btn-success gap-2 text-white" onClick={saveMeal}>
                            <Save className="w-4 h-4" /> Lưu bữa ăn
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-5xl mx-auto pb-20">
            {isLoading && <LoadingSpinner />}

            <div className="alert alert-info shadow-sm mb-8">
                <Info className="w-5 h-5" />
                <span>Đây là công cụ phân tích AI miễn phí. Kết quả chỉ mang tính tham khảo.</span>
            </div>

            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    Công cụ tính Calo AI
                </h1>
                <p className="text-base-content/70">Tải lên ảnh món ăn để nhận diện và tính toán dinh dưỡng</p>
            </div>

            <div className="flex justify-center gap-4 mb-8">
                <button
                    className={`btn gap-2 ${showGrowthTracker ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setShowGrowthTracker(!showGrowthTracker)}
                >
                    <Activity className="w-4 h-4" />
                    {showGrowthTracker ? 'Đóng theo dõi' : 'Theo dõi tăng trưởng'}
                </button>
                <button
                    className={`btn gap-2 ${showLogger ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setShowLogger(!showLogger)}
                >
                    <FileText className="w-4 h-4" />
                    {showLogger ? 'Đóng nhật ký' : 'Ghi triệu chứng'}
                </button>
            </div>

            {showGrowthTracker && <GrowthTracker />}
            {showLogger && <SymptomLogger />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div className="w-full">
                    <ImageUpload onUpload={handleImageUpload} uploadedImage={uploadedImage} onRemove={handleRemoveImage} />
                </div>
                <div className="w-full">
                    <FoodDetection />
                </div>
            </div>

            {mealHistory.length > 0 && (
                <div className="mt-16">
                    <div className="flex justify-between items-center mb-6 border-b border-base-300 pb-4">
                        <h3 className="text-2xl font-bold flex items-center gap-2">
                            <Activity className="w-6 h-6 text-primary" />
                            Lịch sử bữa ăn
                        </h3>
                        <button className="btn btn-sm btn-ghost text-error gap-2" onClick={clearMeals}>
                            <Trash2 className="w-4 h-4" /> Xóa tất cả
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mealHistory.map(m => (
                            <div key={m.id} className="card bg-base-100 shadow-md border border-base-200 hover:shadow-lg transition-shadow">
                                <div className="card-body p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-xs text-base-content/60 uppercase tracking-wider font-semibold">
                                            {new Date(m.date).toLocaleString('vi-VN')}
                                        </div>
                                        <button className="btn btn-ghost btn-xs btn-circle text-error" onClick={() => deleteMeal(m.id)}>
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="font-bold text-lg mb-1 truncate" title={m.items.join(', ')}>
                                        {m.items.join(', ')}
                                    </div>
                                    <div className="badge badge-primary badge-outline">{m.calories} cal</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <FAQSection />

            <AlertModal show={showAlert} onClose={closeAlertModal} type={alertType} message={alertMessage} />
        </div>
    );
};

const FAQSection = () => {
    const faqs = [
        {
            question: "Ứng dụng đo calo hoạt động như thế nào?",
            answer: "Ứng dụng sử dụng trí tuệ nhân tạo (AI) để phân tích hình ảnh món ăn mà phụ huynh chụp hoặc tải lên. Hệ thống sẽ nhận diện các loại thực phẩm trong khẩu phần và ước tính lượng calo, chất đạm, chất béo, chất xơ... giúp theo dõi dinh dưỡng của trẻ dễ dàng hơn.",
        },
        {
            question: "Ứng dụng có miễn phí không?",
            answer: "Hiện tại, ứng dụng được cung cấp hoàn toàn miễn phí để hỗ trợ phụ huynh quản lý chế độ ăn và theo dõi dinh dưỡng cho trẻ tại nhà.",
        },
        {
            question: "Ứng dụng có phù hợp với trẻ biếng ăn hoặc suy dinh dưỡng không?",
            answer: "Có. Ứng dụng được thiết kế đặc biệt để giúp phụ huynh theo dõi khẩu phần ăn, lượng calo và dưỡng chất của trẻ biếng ăn, chậm tăng cân hoặc có vấn đề tiêu hóa, từ đó điều chỉnh bữa ăn hợp lý hơn.",
        },
        {
            question: "Ứng dụng có thể nhận diện món ăn do phụ huynh tự nấu không?",
            answer: "Hoàn toàn có thể. Chỉ cần chụp lại hình món ăn của bé, AI sẽ ước tính lượng calo và dưỡng chất dựa trên nguyên liệu phổ biến trong ẩm thực Việt.",
        },
        {
            question: "Mức độ chính xác của việc ước tính calo là bao nhiêu?",
            answer: "Kết quả ước tính có thể dao động nhẹ tùy theo khẩu phần và nguyên liệu thực tế, nhưng hệ thống AI được huấn luyện với hàng chục nghìn món ăn để đảm bảo độ chính xác cao nhất có thể.",
        },
        {
            question: "Tôi có thể theo dõi cân nặng và chiều cao của trẻ không?",
            answer: "Có. Ứng dụng cho phép nhập cân nặng, chiều cao và tuổi của trẻ để tự động gợi ý mức calo cần thiết mỗi ngày, giúp phụ huynh dễ dàng theo dõi tiến triển dinh dưỡng.",
        },
        {
            question: "Ứng dụng có tư vấn thực đơn cho trẻ suy dinh dưỡng không?",
            answer: "Ứng dụng có thể gợi ý khẩu phần mẫu theo độ tuổi và tình trạng dinh dưỡng của trẻ. Tuy nhiên, để có phác đồ chính xác, phụ huynh vẫn nên tham khảo ý kiến bác sĩ hoặc chuyên gia dinh dưỡng.",
        },
        {
            question: "Trẻ bị khó tiêu hoặc hay đầy bụng có thể sử dụng app này không?",
            answer: "Có thể. Ứng dụng giúp phụ huynh nhận biết những món ăn có hàm lượng chất béo hoặc đường cao – là nguyên nhân gây khó tiêu – và đưa ra gợi ý thay thế nhẹ nhàng, dễ hấp thu hơn.",
        },
        {
            question: "Tôi có thể lưu lại lịch sử bữa ăn của con không?",
            answer: "Có. Ứng dụng tự động lưu lại các món ăn đã được quét, giúp phụ huynh theo dõi tiến trình ăn uống, khẩu vị và lượng calo hằng ngày của trẻ.",
        },
        {
            question: "Ứng dụng có cần kết nối Internet không?",
            answer: "Có, để phân tích hình ảnh và tính toán chính xác, ứng dụng cần kết nối mạng Internet. Tuy nhiên, lịch sử dữ liệu của bé vẫn được lưu lại để xem khi ngoại tuyến.",
        },
        {
            question: "Dữ liệu hình ảnh của con tôi có được bảo mật không?",
            answer: "Chắc chắn. Tất cả hình ảnh và thông tin được mã hóa và lưu trữ an toàn. Ứng dụng tuân thủ các tiêu chuẩn bảo mật nhằm bảo vệ quyền riêng tư của trẻ.",
        },
        {
            question: "Ứng dụng có hỗ trợ tư vấn chuyên gia không?",
            answer: "Phiên bản sắp tới sẽ tích hợp chức năng tư vấn trực tuyến cùng chuyên gia dinh dưỡng để phụ huynh nhận được lời khuyên phù hợp hơn cho từng trường hợp cụ thể.",
        }
    ];

    return (
        <div className="mt-20">
            <div className="divider mb-10"></div>
            <h2 className="text-3xl font-bold text-center mb-8">Câu hỏi thường gặp</h2>
            <div className="space-y-2 max-w-3xl mx-auto">
                {faqs.map((faq, index) => (
                    <div key={index} className="collapse collapse-plus bg-base-100 border border-base-200 rounded-box">
                        <input type="checkbox" className="peer" />
                        <div className="collapse-title text-lg font-medium">
                            {faq.question}
                        </div>
                        <div className="collapse-content">
                            <p className="text-base-content/80">{faq.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
