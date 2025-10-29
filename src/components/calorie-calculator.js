import { useState } from "react";
import LoadingSpinner from "@/components/spinner";
import {AlertModal} from "@/components/model/alert";

// Defines the main component for the calorie calculator page
export const CalorieCalculatorPage = () => {
    // State hooks for managing various states
    const [uploadedImage, setUploadedImage] = useState(null);
    const [foodItems, setFoodItems] = useState([]);
    const [totalCalories, setTotalCalories] = useState(0);
    const [isLoading, setLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');


    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                const base64Image = await getBase64(file);
                setUploadedImage(base64Image); // Updates state with the base64 encoded image
                sendImageToServer(base64Image); // Sends the base64 encoded image to the server
            } catch (error) {
                console.error('Error reading file:', error);
            }
        }
    };

    const getBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result); // Resolves the promise upon successful file read
            reader.onerror = error => reject(error); // Rejects the promise if file reading fails
            reader.readAsDataURL(file); // Reads the file as a base64 data URL
        });
    };

    // Component for uploading images
    const ImageUpload = ({ onUpload, uploadedImage }) => {
        return (
            <div className="text-center p-4">
                <input id="upload" type="file" accept="image/*" onChange={onUpload} className="hidden" />
                <div className="image-container h-[380px] md:h-[200px] lg:h-[380px] w-full bg-white rounded-lg overflow-hidden">
                    {uploadedImage && <img src={uploadedImage} alt="Uploaded Food" className="w-full h-full object-cover" />}
                </div>
            </div>
        );
    };

    // Sends the base64 encoded image to the server for processing
    const sendImageToServer = (base64Image) => {
        setLoading(true);
        fetch('/api/detect_food', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: base64Image }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setFoodItems(data.items);
                    setTotalCalories(data.count);
                } else {
                    setShowAlert(true);
                    setAlertMessage(data.message);
                }
                setLoading(false);
            })
            .catch(error => {
                console.error('Error:', error);
                // Show AlertModal on error
                setLoading(false);
                setShowAlert(true);
                setAlertMessage('Failed to analyze the image. Please try again.');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Closes the alert modal
    const closeAlertModal = () => setShowAlert(false);

    // Component displaying the result of food detection
    const FoodDetection = () => {
        if (foodItems.length === 0) {
            return <div className="md:flex-1 h-auto flex flex-col justify-between bg-base-100 rounded-box shadow">
                <h2 className="text-xl md:text-2xl font-bold text-center mb-4 text-gray-700 py-4">
                    Phân tích món ăn sẽ hiển thị ở đây
                </h2>
            </div>;
        }

        return (
            <div className="md:flex-1 h-auto flex flex-col justify-between bg-base-100 rounded-box shadow">
                <div className="p-4">
                    <h2 className="text-xl md:text-2xl font-bold text-center mb-4 text-gray-700">Detected Food Items</h2>
                    <div className="flex flex-wrap gap-2 justify-center items-center">
                        {foodItems.map((item, index) => (
                            <span key={index} className="badge badge-primary badge-outline p-4 text-sm md:text-base">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="divider divider-horizontal"></div>
                <div className="py-4 px-4 text-center">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-700">Tổng Calories:</h3>
                    <p className="text-2xl font-bold text-blue-600">{totalCalories} cal</p>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-2">
            {isLoading && (
                <LoadingSpinner />
            )}
            <div className="alert alert-info bg-blue-100 shadow-lg max-w-4xl w-full mb-4">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Đây là một tool phân tích miễn phí. Giới hạn 2 lần thử. Nếu gặp lỗi, vui lòng thử lại.</span>
                </div>
            </div>

            <div className="container max-w-4xl p-5 bg-base-100 shadow-xl rounded-lg">
                <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">Công cụ đo Calories</h1>
                <label htmlFor="upload" className="btn btn-primary cursor-pointer mb-4">
                    Đăng tải hình ảnh món ăn
                </label>

                <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-1">
                        <div className="image-upload-area border-2 border-dashed h-[380px] md:h-[200px] lg:h-[380px] border-gray-300 rounded-lg flex justify-center items-center relative text-center bg-white">
                            <ImageUpload onUpload={handleImageUpload} uploadedImage={uploadedImage} />
                            {!uploadedImage && (
                                <div className="absolute inset-0 flex flex-col justify-center items-center text-gray-500">
                                    <p>Không có ảnh nào được tải lên</p>
                                    <p className="mt-2">Ảnh của bạn sẽ xuất hiện tại đây</p>
                                </div>
                            )}
                        </div>
                    </div>



                    <FoodDetection />
                </div>
            </div>

            <FAQSection />

            <AlertModal show={showAlert} onClose={closeAlertModal} type="error" message={alertMessage} />
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
        <div className="mt-8">
            <div className="divider"></div>
            <h2 className="text-xl font-semibold mb-4">Các câu hỏi thường gặp</h2>
            {faqs.map((faq, index) => (
                <div key={index} className="collapse collapse-plus border border-base-300 bg-base-100 rounded-box mb-2">
                    <input type="checkbox" className="peer" />
                    <div className="collapse-title text-lg font-medium">
                        {faq.question}
                    </div>
                    <div className="collapse-content text-base">
                        <p>{faq.answer}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};
