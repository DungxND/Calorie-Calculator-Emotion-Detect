import { faker } from "@faker-js/faker";

const API_ENDPOINT =
	process.env.API_USER_REGISTRATION_URL || "http://localhost:3000/api/users/";
const CONCURRENT_REQUESTS = 30;

interface UserPayload {
	email: string;
	username: string;
	password: string;
	first_name: string;
	last_name: string;
	dob: string | null;
}

function createFakeUserPayload(): UserPayload {
	const firstName = faker.person.firstName();
	const lastName = faker.person.lastName();
	const dob = faker.date.birthdate({ min: 18, max: 80, mode: "age" });

	return {
		email: faker.internet.email({ firstName, lastName }),
		username: faker.internet
			.username({ firstName, lastName })
			.slice(0, 20)
			.padEnd(5, "0")
			.toLowerCase(),
		password: "password123!",
		first_name: firstName,
		last_name: lastName,
		dob: dob.toISOString().split("T")[0],
	};
}

async function createAdminUser() {
	const adminPayload = {
		email: "admin@example.com",
		username: "admin",
		password: "password",
		first_name: "Admin",
		last_name: "User",
		dob: null,
		role: "admin",
	};
	await registerUser(adminPayload);
}

async function registerUser(
	payload: UserPayload & { role?: string },
): Promise<{ success: boolean; email: string; detail: any }> {
	try {
		const response = await fetch(API_ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (response.ok) {
			return {
				success: true,
				email: payload.email,
				detail: `Status: ${response.status}`,
			};
		} else {
			const errorBody = await response
				.json()
				.catch(() => ({ message: "Could not parse error response." }));
			return {
				success: false,
				email: payload.email,
				detail: { status: response.status, error: errorBody },
			};
		}
	} catch (error: any) {
		return {
			success: false,
			email: payload.email,
			detail: { error: error.message },
		};
	}
}

async function seedUsersViaApi(totalUsers: number) {
	const userPayloads = Array.from(
		{ length: totalUsers },
		createFakeUserPayload,
	);
	const results: { success: boolean; email: string; detail: any }[] = [];

	for (let i = 0; i < userPayloads.length; i += CONCURRENT_REQUESTS) {
		const batch = userPayloads.slice(i, i + CONCURRENT_REQUESTS);
		const promises = batch.map((payload) => registerUser(payload));

		const batchResults = await Promise.all(promises);
		results.push(...batchResults);

		const successes = batchResults.filter((r) => r.success).length;
		console.log(
			`[Batch ${i / CONCURRENT_REQUESTS + 1}] Processed ${batch.length} users. Success: ${successes}, Fail: ${batch.length - successes}. Total: ${results.length}/${totalUsers}`,
		);
	}

	const successfulCreations = results.filter((r) => r.success);
	const failedCreations = results.filter((r) => !r.success);

	console.log("\n--- Seeding Complete ---");
	console.log(`✅ Successful registrations: ${successfulCreations.length}`);
	console.log(`❌ Failed registrations:     ${failedCreations.length}`);

	if (failedCreations.length > 0) {
		console.log("\n--- Failure Details ---");
		failedCreations.slice(0, 5).forEach((failure) => {
			console.log(`- Email: ${failure.email}`);
			console.log(`  Reason: ${JSON.stringify(failure.detail)}\n`);
		});
		if (failedCreations.length > 5) {
			console.log(`... and ${failedCreations.length - 5} more failures.`);
		}
	}
}

async function run() {
	const args = process.argv.slice(2);
	const countArg = args.find((arg) => !isNaN(parseInt(arg, 10)));
	const count = countArg ? parseInt(countArg, 10) : 50;

	if (count <= 0) {
		console.error("Please provide a positive number of users to create.");
		process.exit(1);
	}

	await seedUsersViaApi(count);
	await createAdminUser();
}

run().catch((err) => {
	console.error("An unexpected error occurred:", err);
	process.exit(1);
});
