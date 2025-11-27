import { Elysia } from "elysia";
import {
	ConflictError,
	ForbiddenError,
	HttpError,
	NotFoundError,
	UnauthorizedError,
} from "./httpErrors";

/**
 * A centralized error handling plugin for the Elysia application.
 * It catches errors thrown anywhere in the application and formats
 * them into a consistent JSON response.
 */
export const errorHandler = new Elysia({ name: "errorHandler" })
	.error({
		HttpError,
		ForbiddenError,
		NotFoundError,
		ConflictError,
		UnauthorizedError,
	})
	.onError(({ code, error, set }) => {
		if (error instanceof HttpError) {
			console.error(
				`[HttpError] Status: ${error.status}, Message: ${error.message}`,
			);
			set.status = error.status;
			return { message: error.message };
		}

		console.error(`[${code}] Path: ${error}`);
		switch (code) {
			case "NOT_FOUND":
				set.status = 404;
				return { message: "The requested route does not exist." };

			case "VALIDATION":
				set.status = 400;
				return {
					message: "Validation failed.",
					errors: error.all.map((e) => ({
						message: e.summary,
					})),
				};

			case "UNKNOWN":
			default:
				set.status = 500;
				return { message: "An unexpected internal server error occurred." };
		}
	});
