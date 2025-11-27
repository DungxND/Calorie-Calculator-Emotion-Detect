import { t } from "elysia";

export const UserSchema = t.Object({
	id: t.Number(),
	email: t.String({ format: "email" }),
	username: t.String(),
	password: t.String(),
	first_name: t.String(),
	last_name: t.String(),
	dob: t.Nullable(t.String({ format: "date" })),
	role: t.Union([
		t.Literal("admin"),
		t.Literal("teacher"),
		t.Literal("student"),
	]),
	created_at: t.String(),
	updated_at: t.String(),
});

export const SignUpSchema = t.Object({
	email: t.String({ format: "email" }),
	username: t.String({ minLength: 5, maxLength: 30 }),
	password: t.String({ minLength: 6 }),
	first_name: t.String({ minLength: 1, maxLength: 50 }),
	last_name: t.String({ minLength: 1, maxLength: 50 }),
	dob: t.Optional(
		t.Union(
			[t.String({ format: "date" }), t.Null(), t.String({ minLength: 0 })],
			{
				default: null,
			},
		),
	),
});

export const CreateUserSchema = t.Intersect([
	SignUpSchema,
	t.Object({
		role: t.Optional(
			t.Union([t.Literal("admin"), t.Literal("teacher"), t.Literal("student")]),
		),
	}),
]);

export const LoginSchema = t.Object({
	email: t.String({ format: "email" }),
	password: t.String({ minLength: 6 }),
});

export const UserResponseSchema = UserSchema;
export const SafeUserResponseSchema = t.Omit(UserResponseSchema, ["password"]);
