import { GoogleGenAI } from "@google/genai";
import { InternalServerError } from "@common/errors/httpErrors";

export class AIService {
    private ai: GoogleGenAI;
    private model: string;

    constructor() {
        const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GOOGLE_AI_API_KEY is not set");
        }
        this.ai = new GoogleGenAI({ apiKey });
        this.model = "gemini-2.0-flash";
    }

    async detectFoodAndDigestiveInsights(base64Image: string) {
        try {
            // Extract base64 data and mime type
            const match = base64Image.match(/^data:(image\/\w+);base64,(.*)$/);
            if (!match) {
                throw new Error("Invalid image format");
            }
            const mimeType = match[1];
            const base64Data = match[2];

            const prompt = `
            Hãy nhận diện món ăn trong hình và phân tích các yếu tố ảnh hưởng đến tiêu hóa của trẻ em.
            Vui lòng trả về kết quả dưới dạng JSON thuần túy (không có markdown block) với cấu trúc sau:
            {
                "items": ["món ăn 1", "món ăn 2"],
                "total_calories": xx,
                "digestive_analysis": {
                    "fodmap_level": "Low/Medium/High",
                    "fiber_content": "Low/Medium/High",
                    "allergens": ["Gluten", "Lactose", "Nuts", "Soy", "None"],
                    "texture": "Soft/Crunchy/Mixed/Liquid",
                    "digestibility_score": 1-10 (10 là dễ tiêu hóa nhất),
                    "micronutrients": {
                        "iron": "Low/Medium/High",
                        "zinc": "Low/Medium/High",
                        "vitamin_d": "Low/Medium/High"
                    },
                    "warnings": ["Cảnh báo 1", "Cảnh báo 2"]
                }
            }
            Chỉ trả về JSON, không bao gồm nội dung khác.
            `;

            const response = await this.ai.models.generateContent({
                model: this.model,
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: base64Data,
                                },
                            },
                        ],
                    },
                ],
            });

            const text = (await response).text;
            if (!text) {
                throw new Error("No response text from AI");
            }

            const startIndex = text.indexOf("{");
            const endIndex = text.lastIndexOf("}");

            if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
                throw new Error("Invalid JSON response from AI");
            }

            const jsonStr = text.substring(startIndex, endIndex + 1);
            let parsedData;
            try {
                parsedData = JSON.parse(jsonStr);
            } catch (e) {
                const cleaned = jsonStr.replace(/```json/g, '').replace(/```/g, '');
                parsedData = JSON.parse(cleaned);
            }


            return {
                success: true,
                items: parsedData.items,
                count: parsedData.total_calories,
                digestive_analysis: parsedData.digestive_analysis,
            };
        } catch (error: any) {
            console.error("AI Detect Food Error:", error);
            throw new InternalServerError(`Failed to analyze food: ${error.message}`);
        }
    }

    async getGeminiAdvice(
        note: string,
        emotion: string,
        severity: string,
        time: string,
    ) {
        try {
            const prompt = `Cung cấp lời khuyên hỗ trợ nhẹ nhàng, không mang tính chẩn đoán cho phụ huynh có con gặp vấn đề về tiêu hóa.\n
            Ghi chú triệu chứng: ${note}\nCảm xúc quan sát được: ${emotion}\nMức độ: ${severity}\nThời gian: ${time}\n
            Đề xuất các biện pháp hỗ trợ ngay lập tức (uống nước, thực phẩm nên tránh, thực phẩm nên dùng), và khi nào cần đi khám. Giữ ngắn gọn (3-5 điểm chính) và viết cho phụ huynh.`;

            const response = await this.ai.models.generateContent({
                model: this.model,
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }],
                    },
                ],
            });

            return {
                success: true,
                advice: (await response).text || "No advice generated.",
            };
        } catch (error: any) {
            console.error("AI Advice Error:", error);
            throw new InternalServerError(`Failed to get advice: ${error.message}`);
        }
    }
}