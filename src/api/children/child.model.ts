import { t } from "elysia";

export const ChildSchema = t.Object({
    id: t.Number(),
    parent_id: t.Number(),
    name: t.String(),
    birth_date: t.String({ format: "date" }),
    gender: t.Union([
        t.Literal("male"),
        t.Literal("female"),
        t.Literal("other"),
    ]),
    created_at: t.String(),
    updated_at: t.String(),
});

export const CreateChildSchema = t.Object({
    name: t.String({ minLength: 1, maxLength: 100 }),
    birth_date: t.String({ format: "date" }),
    gender: t.Union([
        t.Literal("male"),
        t.Literal("female"),
        t.Literal("other"),
    ]),
});

export const UpdateChildSchema = t.Partial(CreateChildSchema);

export const ChildResponseSchema = ChildSchema;