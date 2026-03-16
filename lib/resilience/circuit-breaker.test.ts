import { describe, it, expect, beforeEach, vi } from "vitest";
import { CircuitBreaker } from "./circuit-breaker";

describe("CircuitBreaker", () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
        circuitBreaker = new CircuitBreaker("test-service", {
            failureThreshold: 3,
            successThreshold: 2,
            timeout: 1000, // 1 second for faster tests
        });
    });

    describe("initial state", () => {
        it("starts in CLOSED state", () => {
            expect(circuitBreaker.getState()).toBe("CLOSED");
        });

        it("returns correct stats initially", () => {
            const stats = circuitBreaker.getStats();
            expect(stats.name).toBe("test-service");
            expect(stats.state).toBe("CLOSED");
            expect(stats.failures).toBe(0);
            expect(stats.successes).toBe(0);
        });
    });

    describe("CLOSED state behavior", () => {
        it("executes function successfully", async () => {
            const result = await circuitBreaker.execute(async () => "success");
            expect(result).toBe("success");
            expect(circuitBreaker.getState()).toBe("CLOSED");
        });

        it("resets failure count on success", async () => {
            // Cause some failures (but not enough to open)
            const failingFn = async () => {
                throw new Error("fail");
            };

            try {
                await circuitBreaker.execute(failingFn);
            } catch { }
            try {
                await circuitBreaker.execute(failingFn);
            } catch { }

            // Now a success should reset failures
            await circuitBreaker.execute(async () => "success");

            const stats = circuitBreaker.getStats();
            expect(stats.failures).toBe(0);
        });

        it("transitions to OPEN after reaching failure threshold", async () => {
            const failingFn = async () => {
                throw new Error("fail");
            };

            // Trigger 3 failures (threshold)
            for (let i = 0; i < 3; i++) {
                try {
                    await circuitBreaker.execute(failingFn);
                } catch { }
            }

            expect(circuitBreaker.getState()).toBe("OPEN");
        });
    });

    describe("OPEN state behavior", () => {
        beforeEach(async () => {
            // Force into OPEN state
            const failingFn = async () => {
                throw new Error("fail");
            };
            for (let i = 0; i < 3; i++) {
                try {
                    await circuitBreaker.execute(failingFn);
                } catch { }
            }
        });

        it("rejects requests immediately when OPEN", async () => {
            await expect(
                circuitBreaker.execute(async () => "success")
            ).rejects.toThrow("Circuit breaker test-service is OPEN");
        });

        it("transitions to HALF_OPEN after timeout", async () => {
            // Wait for timeout
            await new Promise((resolve) => setTimeout(resolve, 1100));

            // Next call should be allowed (transitions to HALF_OPEN)
            const result = await circuitBreaker.execute(async () => "success");
            expect(result).toBe("success");
            expect(circuitBreaker.getState()).toBe("HALF_OPEN");
        });
    });

    describe("HALF_OPEN state behavior", () => {
        beforeEach(async () => {
            // Force into HALF_OPEN state
            const failingFn = async () => {
                throw new Error("fail");
            };
            for (let i = 0; i < 3; i++) {
                try {
                    await circuitBreaker.execute(failingFn);
                } catch { }
            }
            await new Promise((resolve) => setTimeout(resolve, 1100));
            await circuitBreaker.execute(async () => "success");
        });

        it("transitions back to OPEN on failure", async () => {
            try {
                await circuitBreaker.execute(async () => {
                    throw new Error("fail");
                });
            } catch { }

            expect(circuitBreaker.getState()).toBe("OPEN");
        });

        it("transitions to CLOSED after success threshold", async () => {
            // Need 1 more success (already had 1 in beforeEach)
            await circuitBreaker.execute(async () => "success");

            expect(circuitBreaker.getState()).toBe("CLOSED");
        });
    });

    describe("forceReset", () => {
        it("resets circuit breaker to initial state", async () => {
            // Force into OPEN state
            const failingFn = async () => {
                throw new Error("fail");
            };
            for (let i = 0; i < 3; i++) {
                try {
                    await circuitBreaker.execute(failingFn);
                } catch { }
            }

            expect(circuitBreaker.getState()).toBe("OPEN");

            circuitBreaker.forceReset();

            expect(circuitBreaker.getState()).toBe("CLOSED");
            expect(circuitBreaker.getStats().failures).toBe(0);
        });
    });
});
