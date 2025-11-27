// Elysia API server

import { ForbiddenError, UnauthorizedError } from "@common/errors/httpErrors";
import { jwt } from "@elysiajs/jwt";
import { Elysia, t } from "elysia";
import {
	CreateUserSchema,
	LoginSchema,
	SafeUserResponseSchema,
	SignUpSchema,
	UserResponseSchema,
} from "./user.model";
import { UserService } from "./user.service";

const ErrorSchema = t.Object({
	message: t.String(),
});

if (!process.env.JWT_SECRET) {
	console.error("FATAL ERROR: JWT_SECRET is not defined in .env");
	process.exit(1);
}

export const usersPlugin = new Elysia({})
	.use(
		jwt({ name: "jwt", secret: process.env.JWT_SECRET as string, exp: "7d" }),
	)
	.resolve(({ jwt }) => ({
		userService: new UserService(jwt as any),
	}))

	.group("/auth", (app) =>
		app
			.post(
				"/login",
				async ({ body, set, cookie, userService }) => {
					const { token } = await userService.login(body);

					cookie.auth?.set({
						value: token,
						path: "/",
						httpOnly: true,
						sameSite: "lax",
						maxAge: 60 * 60 * 24 * 7, // 7 days
					});

					set.status = 200;
					return { token };
				},
				{
					body: LoginSchema,
					response: {
						200: t.Object({ token: t.String() }),
						401: ErrorSchema,
					},
					detail: {
						tags: ["Authentication"],
						summary: "Log in a user",
					},
				},
			)

			.post(
				"/logout",
				({ cookie }) => {
					const token = cookie?.auth?.value as string | undefined;

					if (!token) {
						throw new UnauthorizedError("No active session to log out from.");
					}

					cookie.auth?.remove();
					return { ok: true };
				},
				{
					detail: {
						tags: ["Authentication"],
						summary: "Log out the current user",
					},
					response: {
						200: t.Object({ ok: t.Boolean() }),
						401: ErrorSchema,
					},
				},
			),
	)

	.group("/users", (app) =>
		app
			.post(
				"/",
				async ({ body, set, userService }) => {
					const newUser = await userService.createUser(body);

					set.status = 201;
					return { user: newUser };
				},
				{
					body: CreateUserSchema,
					response: {
						201: t.Object({ user: t.Omit(UserResponseSchema, ["password"]) }),
						409: ErrorSchema,
						500: ErrorSchema,
					},
					detail: {
						tags: ["User Management"],
						summary: "Register a new user",
					},
				},
			)

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

						.get(
							"/",
							async ({ user, userService, set }) => {
								if (user?.role !== "admin") {
									throw new ForbiddenError("Admins only");
								}

								set.headers["Cache-Control"] =
									"public, max-age=3600, stale-while-revalidate=3600";
								const { users } = await userService.getAllUsers();
								return { users };
							},
							{
								response: {
									200: t.Object({ users: t.Array(SafeUserResponseSchema) }),
									403: ErrorSchema,
								},
								detail: {
									tags: ["User Management"],
									summary: "Get all users (Admin Only)",
								},
							},
						)

						.get(
							"/me",
							async ({ user, userService }) => {
								if (!user || typeof user.id !== "number") {
									throw new UnauthorizedError("Invalid user payload");
								}
								const currentUser = await userService.getUserById(user.id);
								return { user: currentUser };
							},
							{
								response: {
									200: t.Object({
										user: t.Omit(UserResponseSchema, ["password"]),
									}),
									401: ErrorSchema,
									404: ErrorSchema,
								},
								detail: {
									tags: ["User Management"],
									summary: "Get current authenticated user",
								},
							},
						)

						.get(
							"/:user_id",
							async ({ params, user, userService }) => {
								if (
									user?.role !== "admin" &&
									user?.id !== Number(params.user_id)
								) {
									throw new ForbiddenError(
										"Only admins or the user themselves can access this information",
									);
								}
								const foundUser = await userService.getUserById(params.user_id);
								return { user: foundUser };
							},
							{
								params: t.Object({ user_id: t.Numeric() }),
								response: {
									200: t.Object({ user: SafeUserResponseSchema }),
									403: ErrorSchema,
									404: ErrorSchema,
								},
								detail: {
									tags: ["User Management"],
									summary: "Get user by ID",
								},
							},
						)

						.patch(
							"/:user_id",
							async ({ params, body, user, userService }) => {
								if (
									user?.role !== "admin" &&
									user?.id !== Number(params.user_id)
								) {
									throw new ForbiddenError(
										"Only admins or the user themselves can update this information",
									);
								}
								const updatedUser = await userService.updateUser(
									params.user_id,
									body,
								);
								return { user: updatedUser };
							},
							{
								params: t.Object({ user_id: t.Numeric() }),
								body: t.Partial(
									t.Omit(SignUpSchema, [
										"id",
										"password",
										"role",
										"created_at",
										"updated_at",
									]),
								),
								response: {
									200: t.Object({ user: SafeUserResponseSchema }),
									404: ErrorSchema,
								},
								detail: {
									tags: ["User Management"],
									summary: "Partially update a user account information",
								},
							},
						)

						.delete(
							"/:user_id",
							async ({ params, user, userService }) => {
								if (
									user?.role !== "admin" &&
									user?.id !== Number(params.user_id)
								) {
									throw new ForbiddenError(
										"Only admins or the user themselves can delete this account",
									);
								}

								const result = await userService.deleteUser(params.user_id);
								return { message: result.message };
							},
							{
								params: t.Object({ user_id: t.Numeric() }),
								response: {
									200: t.Object({ message: t.String() }),
									404: ErrorSchema,
								},
								detail: {
									tags: ["User Management"],
									summary: "Delete a user",
								},
							},
						),
			),
	);

export type App = typeof usersPlugin;
