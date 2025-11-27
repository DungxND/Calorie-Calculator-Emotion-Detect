import { t } from "elysia";

export const DetectFoodSchema = t.Object({
    image: t.String(), // Base64 string
});

export const GeminiAdviceSchema = t.Object({
    note: t.String(),
    emotion: t.String(),
    severity: t.String(),
    time: t.String(),
});

export const DetectFoodResponseSchema = t.Object({
    success: t.Boolean(),
    items: t.Array(t.String()),
    count: t.Number(), // total_calories
    digestive_analysis: t.Object({
        fodmap_level: t.String(),
        fiber_content: t.String(),
        allergens: t.Array(t.String()),
        texture: t.String(),
        digestibility_score: t.Number(),
        micronutrients: t.Object({
            iron: t.String(),
            zinc: t.String(),
            vitamin_d: t.String(),
        }),
        warnings: t.Array(t.String()),
    }),
});

export const GeminiAdviceResponseSchema = t.Object({
    success: t.Boolean(),
    advice: t.String(),
});