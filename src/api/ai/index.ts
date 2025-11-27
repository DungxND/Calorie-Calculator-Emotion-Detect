import { Elysia, t } from "elysia";
import { AIService } from "./ai.service";
import {
    DetectFoodSchema,
    DetectFoodResponseSchema,
    GeminiAdviceSchema,
    GeminiAdviceResponseSchema,
} from "./ai.model";
import { jwt } from "@elysiajs/jwt";
import { UnauthorizedError } from "@common/errors/httpErrors";

const ErrorSchema = t.Object({
    message: t.String(),
});

export const aiPlugin = new Elysia({ prefix: "/ai" })
    .use(
        jwt({ name: "jwt", secret: process.env.JWT_SECRET as string, exp: "7d" }),
    )
    .resolve(({ jwt }) => ({
        aiService: new AIService(),
    }))
    .guard(
        {
            beforeHandle: async ({ jwt, cookie }) => {
                const token = cookie?.auth?.value as string | undefined;
                if (!token) {
                    throw new UnauthorizedError("Missing token");
                }
                const payload = await jwt.verify(token);
                if (!payload) {
                    throw new UnauthorizedError("Invalid or expired token");
                }
            },
        },
        (app) =>
            app
                .resolve(async ({ jwt, cookie }) => {
                    const token = cookie?.auth?.value as string | undefined;
                    const userPayload = token
                        ? ((await jwt.verify(token)) as {
                            id: number;
                            email: string;
                            role: string;
                        } | null)
                        : null;
                    return { user: userPayload };
                })
                .post(
                    "/detect-food",
                    async ({ body, aiService }) => {
                        const result = await aiService.detectFoodAndDigestiveInsights(
                            body.image,
                        );
                        return result;
                    },
                    {
                        body: DetectFoodSchema,
                        response: {
                            200: DetectFoodResponseSchema,
                            500: ErrorSchema,
                            401: ErrorSchema,
                        },
                        detail: {
                            tags: ["AI"],
                            summary: "Detect food and provide digestive insights",
                        },
                    },
                )
                .post(
                    "/gemini-advice",
                    async ({ body, aiService }) => {
                        const result = await aiService.getGeminiAdvice(
                            body.note,
                            body.emotion,
                            body.severity,
                            body.time,
                        );
                        return result;
                    },
                    {
                        body: GeminiAdviceSchema,
                        response: {
                            200: GeminiAdviceResponseSchema,
                            500: ErrorSchema,
                            401: ErrorSchema,
                        },
                        detail: {
                            tags: ["AI"],
                            summary: "Get AI advice based on symptoms",
                        },
                    },
                ),
    );