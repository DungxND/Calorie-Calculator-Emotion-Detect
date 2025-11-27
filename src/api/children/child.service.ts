import {
    NotFoundError,
    UnauthorizedError,
} from "@common/errors/httpErrors";
import { db } from "@user/sqlite";
import type {
    CreateChildSchema,
    UpdateChildSchema,
    ChildResponseSchema,
} from "./child.model";
import type { Static } from "elysia";

type ChildFromDb = Static<typeof ChildResponseSchema>;

export class ChildService {
    async createChild(parentId: number, childData: Static<typeof CreateChildSchema>) {
        const { name, birth_date, gender } = childData;

        const insertQuery = db.query<ChildFromDb, any>(`
			INSERT INTO children (parent_id, name, birth_date, gender)
			VALUES ($parent_id, $name, $birth_date, $gender)
			RETURNING *;
		`);

        const newChild = insertQuery.get({
            $parent_id: parentId,
            $name: name,
            $birth_date: birth_date,
            $gender: gender,
        });

        if (!newChild) {
            throw new Error("Failed to create child record.");
        }

        return newChild;
    }

    async getChildrenByParentId(parentId: number) {
        const query = db.query<ChildFromDb, { $parent_id: number }>(
            "SELECT * FROM children WHERE parent_id = $parent_id"
        );
        return query.all({ $parent_id: parentId });
    }

    async getChildById(childId: number, parentId: number) {
        const query = db.query<ChildFromDb, { $id: number }>(
            "SELECT * FROM children WHERE id = $id"
        );
        const child = query.get({ $id: childId });

        if (!child) {
            throw new NotFoundError("Child not found.");
        }

        if (child.parent_id !== parentId) {
            throw new UnauthorizedError("You do not have permission to access this child's record.");
        }

        return child;
    }

    async updateChild(
        childId: number,
        parentId: number,
        childData: Static<typeof UpdateChildSchema>
    ) {
        // Check ownership
        await this.getChildById(childId, parentId);

        const { name, birth_date, gender } = childData;

        const query = db.query<ChildFromDb, any>(`
			UPDATE children
			SET
				name = COALESCE($name, name),
				birth_date = COALESCE($birth_date, birth_date),
				gender = COALESCE($gender, gender),
				updated_at = CURRENT_TIMESTAMP
			WHERE id = $id
			RETURNING *;
		`);

        const updatedChild = query.get({
            $id: childId,
            $name: name ?? null,
            $birth_date: birth_date ?? null,
            $gender: gender ?? null,
        });

        if (!updatedChild) {
            throw new NotFoundError("Child not found.");
        }

        return updatedChild;
    }

    async deleteChild(childId: number, parentId: number) {
        // Check ownership
        await this.getChildById(childId, parentId);

        const query = db.query<{ id: number }, { $id: number }>(
            "DELETE FROM children WHERE id = $id RETURNING id"
        );
        const deletedChild = query.get({ $id: childId });

        if (!deletedChild) {
            throw new NotFoundError("Child not found.");
        }

        return { message: `Child with ID ${childId} successfully deleted.` };
    }
}