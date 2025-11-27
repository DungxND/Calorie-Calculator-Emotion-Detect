import { beforeEach, describe, expect, test } from "bun:test";
import {
	ConflictError,
	NotFoundError,
	UnauthorizedError,
} from "@common/errors/httpErrors";
import { db } from "@user/sqlite";
import { UserService } from "@user/user.service";
import { hashPassword } from "@user/utils/passwordHash";

// Mock JWT client
const mockJwt = {
	sign: async (payload: Record<string, any>) => "mock-token",
	verify: async (token: string) => ({
		id: 1,
		email: "test@example.com",
		role: "student",
	}),
};

describe("UserService", () => {
	let userService: UserService;

	beforeEach(() => {
		// Reset the database before each test
		db.run("DELETE FROM users;");
		db.run('DELETE FROM sqlite_sequence WHERE name="users";'); // Reset autoincrement
		userService = new UserService(mockJwt);
	});

	const sampleUser = {
		email: "test@example.com",
		username: "testuser",
		password: "password123",
		first_name: "Test",
		last_name: "User",
		dob: "2000-01-01",
	};

	// Helper to create a user directly in the DB for tests
	const createUserInDb = async (userData: typeof sampleUser) => {
		const hashedPassword = await hashPassword(userData.password);
		db.prepare(
			"INSERT INTO users (email, username, password, first_name, last_name, dob) VALUES (?, ?, ?, ?, ?, ?)",
		).run(
			userData.email,
			userData.username,
			hashedPassword,
			userData.first_name,
			userData.last_name,
			userData.dob,
		);
	};

	// --- createUser tests ---
	describe("createUser", () => {
		test("should create a new user successfully", async () => {
			const newUser = await userService.createUser(sampleUser);
			expect(newUser).toBeDefined();
			expect(newUser.email).toBe(sampleUser.email);
			expect(newUser.username).toBe(sampleUser.username);
		});

		test("should throw ConflictError for duplicate email", async () => {
			await userService.createUser(sampleUser);
			const promise = userService.createUser({
				...sampleUser,
				username: "newuser",
			});
			expect(promise).rejects.toThrow(
				new ConflictError("A user with this email already exists."),
			);
		});

		test("should throw ConflictError for duplicate username", async () => {
			await userService.createUser(sampleUser);
			const promise = userService.createUser({
				...sampleUser,
				email: "new@example.com",
			});
			expect(promise).rejects.toThrow(
				new ConflictError("A user with this username already exists."),
			);
		});
	});

	// --- login tests ---
	describe("login", () => {
		test("should return a token on successful login", async () => {
			await createUserInDb(sampleUser);
			const { token } = await userService.login({
				email: sampleUser.email,
				password: sampleUser.password,
			});
			expect(token).toBe("mock-token");
		});

		test("should throw UnauthorizedError for non-existent email", async () => {
			const promise = userService.login({
				email: "wrong@email.com",
				password: "password",
			});
			expect(promise).rejects.toThrow(
				new UnauthorizedError("Invalid email or password."),
			);
		});

		test("should throw UnauthorizedError for incorrect password", async () => {
			await createUserInDb(sampleUser);
			const promise = userService.login({
				email: sampleUser.email,
				password: "wrongpassword",
			});
			expect(promise).rejects.toThrow(
				new UnauthorizedError("Invalid email or password."),
			);
		});
	});

	// --- getUserById tests ---
	describe("getUserById", () => {
		test("should return a user for a valid ID", async () => {
			await createUserInDb(sampleUser);
			const user = await userService.getUserById(1);
			expect(user).toBeDefined();
			expect(user.id).toBe(1);
			expect(user.email).toBe(sampleUser.email);
		});

		test("should throw NotFoundError for an invalid ID", async () => {
			const promise = userService.getUserById(999);
			expect(promise).rejects.toThrow(new NotFoundError("User not found."));
		});
	});

	// --- getAllUsers tests ---
	describe("getAllUsers", () => {
		test("should return an array of all users", async () => {
			await createUserInDb(sampleUser);
			await createUserInDb({
				...sampleUser,
				email: "test2@example.com",
				username: "testuser2",
			});

			const { users } = await userService.getAllUsers();
			expect(users).toBeInstanceOf(Array);
			expect(users.length).toBe(2);
		});
	});

	// --- updateUser tests ---
	describe("updateUser", () => {
		test("should update a user successfully", async () => {
			await createUserInDb(sampleUser);
			const updatedData = { first_name: "Updated", last_name: "Name" };
			const updatedUser = await userService.updateUser(1, updatedData);

			expect(updatedUser).toBeDefined();
			expect(updatedUser.first_name).toBe("Updated");
			expect(updatedUser.last_name).toBe("Name");
		});

		test("should throw NotFoundError when updating a non-existent user", async () => {
			const promise = userService.updateUser(999, { first_name: "Ghost" });
			expect(promise).rejects.toThrow(new NotFoundError("User not found."));
		});
	});

	// --- deleteUser tests ---
	describe("deleteUser", () => {
		test("should delete a user successfully", async () => {
			await createUserInDb(sampleUser);
			const result = await userService.deleteUser(1);
			expect(result.message).toBe("User with ID 1 successfully deleted.");

			const user = db.prepare("SELECT * FROM users WHERE id = ?").get(1);
			expect(user).toBeNull();
		});

		test("should throw NotFoundError when deleting a non-existent user", async () => {
			const promise = userService.deleteUser(999);
			expect(promise).rejects.toThrow(new NotFoundError("User not found."));
		});
	});
});
