import { Elysia, t } from "elysia";
import { ChildService } from "./child.service";
import {
    CreateChildSchema,
    UpdateChildSchema,
    ChildResponseSchema,
} from "./child.model";
import { UnauthorizedError } from "@common/errors/httpErrors";
import { jwt } from "@elysiajs/jwt";

const ErrorSchema = t.Object({
    message: t.String(),
});

export const childrenPlugin = new Elysia({ prefix: "/children" })
    .use(
        jwt({ name: "jwt", secret: process.env.JWT_SECRET as string, exp: "7d" })
    )
    .resolve(({ jwt }) => ({
        childService: new ChildService(),
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
                    "/",
                    async ({ body, user, childService, set }) => {
                        if (!user) throw new UnauthorizedError("User not authenticated");
                        const newChild = await childService.createChild(user.id, body);
                        set.status = 201;
                        return { child: newChild };
                    },
                    {
                        body: CreateChildSchema,
                        response: {
                            201: t.Object({ child: ChildResponseSchema }),
                            401: ErrorSchema,
                            500: ErrorSchema,
                        },
                        detail: {
                            tags: ["Child Management"],
                            summary: "Create a new child record",
                        },
                    }
                )
                .get(
                    "/",
                    async ({ user, childService }) => {
                        if (!user) throw new UnauthorizedError("User not authenticated");
                        const children = await childService.getChildrenByParentId(user.id);
                        return { children };
                    },
                    {
                        response: {
                            200: t.Object({ children: t.Array(ChildResponseSchema) }),
                            401: ErrorSchema,
                        },
                        detail: {
                            tags: ["Child Management"],
                            summary: "Get all children for the authenticated user",
                        },
                    }
                )
                .get(
                    "/:id",
                    async ({ params, user, childService }) => {
                        if (!user) throw new UnauthorizedError("User not authenticated");
                        const child = await childService.getChildById(
                            Number(params.id),
                            user.id
                        );
                        return { child };
                    },
                    {
                        params: t.Object({ id: t.Numeric() }),
                        response: {
                            200: t.Object({ child: ChildResponseSchema }),
                            401: ErrorSchema,
                            404: ErrorSchema,
                        },
                        detail: {
                            tags: ["Child Management"],
                            summary: "Get a specific child record by ID",
                        },
                    }
                )
                .patch(
                    "/:id",
                    async ({ params, body, user, childService }) => {
                        if (!user) throw new UnauthorizedError("User not authenticated");
                        const updatedChild = await childService.updateChild(
                            Number(params.id),
                            user.id,
                            body
                        );
                        return { child: updatedChild };
                    },
                    {
                        params: t.Object({ id: t.Numeric() }),
                        body: UpdateChildSchema,
                        response: {
                            200: t.Object({ child: ChildResponseSchema }),
                            401: ErrorSchema,
                            404: ErrorSchema,
                        },
                        detail: {
                            tags: ["Child Management"],
                            summary: "Update a child record",
                        },
                    }
                )
                .delete(
                    "/:id",
                    async ({ params, user, childService }) => {
                        if (!user) throw new UnauthorizedError("User not authenticated");
                        const result = await childService.deleteChild(
                            Number(params.id),
                            user.id
                        );
                        return result;
                    },
                    {
                        params: t.Object({ id: t.Numeric() }),
                        response: {
                            200: t.Object({ message: t.String() }),
                            401: ErrorSchema,
                            404: ErrorSchema,
                        },
                        detail: {
                            tags: ["Child Management"],
                            summary: "Delete a child record",
                        },
                    }
                )
    );