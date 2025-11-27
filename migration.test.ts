import { describe, expect, it, beforeAll } from "bun:test";
import { app } from "./src/api/index"; // Import the Elysia app
import { db } from "./src/api/users/sqlite";

const BASE_URL = "http://localhost:3000/api";

describe("Migration Verification", () => {
    let token: string;
    let userId: number;
    let childId: number;

    // Cleanup before tests
    beforeAll(() => {
        db.run("DELETE FROM users WHERE email = 'testparent@example.com'");
        // Cascading delete handles children and logs
    });

    it("should register a new parent user", async () => {
        const req = new Request(`${BASE_URL}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "testparent@example.com",
                username: "testparent",
                password: "password123",
                first_name: "Test",
                last_name: "Parent",
                role: "student" // Using student as default role for now
            }),
        });
        const res = await app.handle(req);
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.user.email).toBe("testparent@example.com");
        userId = data.user.id;
    });

    it("should login and get token", async () => {
        const req = new Request(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "testparent@example.com",
                password: "password123",
            }),
        });
        const res = await app.handle(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        token = data.token;
        expect(token).toBeDefined();
    });

    it("should create a child", async () => {
        const req = new Request(`${BASE_URL}/children`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": `auth=${token}`
            },
            body: JSON.stringify({
                name: "Baby Doe",
                birth_date: "2020-01-01",
                gender: "male"
            }),
        });
        const res = await app.handle(req);
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.child.name).toBe("Baby Doe");
        childId = data.child.id;
    });

    it("should create a growth log", async () => {
        const req = new Request(`${BASE_URL}/logs/growth`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": `auth=${token}`
            },
            body: JSON.stringify({
                child_id: childId,
                date: new Date().toISOString(),
                weight: 15.5,
                height: 100,
                note: "Growing well"
            }),
        });
        const res = await app.handle(req);
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.log.weight).toBe(15.5);
    });

    it("should fetch growth logs", async () => {
        const req = new Request(`${BASE_URL}/logs/growth/${childId}`, {
            method: "GET",
            headers: {
                "Cookie": `auth=${token}`
            },
        });
        const res = await app.handle(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.logs.length).toBeGreaterThan(0);
        expect(data.logs[0].weight).toBe(15.5);
    });
});