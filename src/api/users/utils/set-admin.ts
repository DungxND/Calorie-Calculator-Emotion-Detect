import { db } from "../sqlite";

const emailToUpdate = "admin@a.b";

interface User {
	id: number;
	email: string;
	role: string;
}

const updateUserRole = () => {
	try {
		const user = db
			.query<User, string>("SELECT id, email, role FROM users WHERE email = ?")
			.get(emailToUpdate);

		if (!user) {
			console.log(`User with email ${emailToUpdate} not found.`);
			return;
		}

		if (user.role === "admin") {
			console.log(`User ${emailToUpdate} is already an admin.`);
			return;
		}

		db.run("UPDATE users SET role = ? WHERE email = ?", [
			"admin",
			emailToUpdate,
		]);

		console.log(`User ${emailToUpdate} has been updated to an admin.`);
	} catch (error) {
		console.error("Failed to update user role:", error);
	}
};

updateUserRole();
