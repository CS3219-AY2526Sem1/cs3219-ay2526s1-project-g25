import { touchPresence } from "../../services/presenceService";
import { jest } from "@jest/globals";

describe("touch presence", () => {
    beforeEach(() => {
        // To check the lastSeen time is correct.
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2025-01-01T10:00:00Z')); // Set a specific time for testing
    })

    it("should update presence correctly", () => {
        const p = new Map();
        const userId = "alice";
        const cursor = { line: 0, col: 0 }
        
        touchPresence(p, userId, cursor);

        expect(p.get("alice")).toEqual({ cursor, lastSeen: new Date('2025-01-01T10:00:00Z').getTime() })
    })
})
