import type { CircuitState, CircuitBreakerConfig } from "@/types/api.types";

/**
 * Circuit Breaker Pattern Implementation.
 *
 * Prevents cascading failures by failing fast when a service is degraded.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is down, requests fail immediately
 * - HALF_OPEN: Testing if service has recovered
 */
export class CircuitBreaker {
    private state: CircuitState = "CLOSED";
    private failures = 0;
    private successes = 0;
    private lastFailTime = 0;

    constructor(
        private name: string,
        private config: CircuitBreakerConfig = {
            failureThreshold: 5,
            successThreshold: 2,
            timeout: 60_000, // 1 minute
        }
    ) { }

    /**
     * Execute a function with circuit breaker protection.
     * Throws if circuit is OPEN and timeout hasn't elapsed.
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        // Check if we should transition from OPEN to HALF_OPEN
        if (this.state === "OPEN") {
            if (Date.now() - this.lastFailTime >= this.config.timeout) {
                this.state = "HALF_OPEN";
                this.successes = 0;
            } else {
                throw new Error(`Circuit breaker ${this.name} is OPEN`);
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess(): void {
        if (this.state === "HALF_OPEN") {
            this.successes++;
            if (this.successes >= this.config.successThreshold) {
                this.reset();
            }
        } else {
            // In CLOSED state, reset failure count on success
            this.failures = 0;
        }
    }

    private onFailure(): void {
        this.failures++;
        this.lastFailTime = Date.now();

        if (
            this.state === "HALF_OPEN" ||
            this.failures >= this.config.failureThreshold
        ) {
            this.state = "OPEN";
        }
    }

    private reset(): void {
        this.state = "CLOSED";
        this.failures = 0;
        this.successes = 0;
    }

    /**
     * Get current circuit state for health checks.
     */
    getState(): CircuitState {
        return this.state;
    }

    /**
     * Get circuit breaker statistics.
     */
    getStats() {
        return {
            name: this.name,
            state: this.state,
            failures: this.failures,
            successes: this.successes,
            lastFailTime: this.lastFailTime
                ? new Date(this.lastFailTime).toISOString()
                : null,
        };
    }

    /**
     * Manually reset the circuit breaker (for admin/testing).
     */
    forceReset(): void {
        this.reset();
        this.lastFailTime = 0;
    }
}

// Global circuit breaker instances
export const geminiCircuitBreaker = new CircuitBreaker("gemini-api", {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60_000, // 1 minute
});

export const supabaseCircuitBreaker = new CircuitBreaker("supabase-api", {
    failureThreshold: 10,
    successThreshold: 3,
    timeout: 30_000, // 30 seconds
});
