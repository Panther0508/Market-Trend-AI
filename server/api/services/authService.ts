/**
 * Authentication Service
 * Manages API keys, authentication, and rate limiting
 */

import { ApiKey, RatePlan, RATE_PLAN_LIMITS } from '../models';
import config from '../config';

interface ApiKeyCreateParams {
    userId: string;
    name: string;
    ratePlan?: RatePlan;
    permissions?: string[];
}

interface ApiKeyValidateResult {
    valid: boolean;
    apiKey?: ApiKey;
    error?: string;
}

class AuthService {
    private apiKeys: Map<string, ApiKey> = new Map();
    private apiKeyIndex: Map<string, string> = new Map(); // key hash -> id

    constructor() {
        // Initialize demo API key
        this.createApiKey({
            userId: 'demo_user',
            name: 'Demo API Key',
            ratePlan: 'free',
            permissions: ['read', 'write'],
        });
    }

    /**
     * Create a new API key
     */
    createApiKey(params: ApiKeyCreateParams): ApiKey {
        const id = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const key = `${config.auth.apiKeyPrefix}${this.generateKey()}`;
        const ratePlan = params.ratePlan || 'free';
        const limits = RATE_PLAN_LIMITS[ratePlan];

        const apiKey: ApiKey = {
            id,
            key,
            userId: params.userId,
            name: params.name,
            ratePlan,
            rateLimit: limits.requestsPerMinute,
            monthlyUsage: 0,
            permissions: params.permissions || ['read'],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.apiKeys.set(id, apiKey);
        this.apiKeyIndex.set(key, id);

        return apiKey;
    }

    /**
     * Generate random API key
     */
    private generateKey(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Validate API key
     */
    validateApiKey(key: string): ApiKeyValidateResult {
        const id = this.apiKeyIndex.get(key);
        if (!id) {
            return { valid: false, error: 'Invalid API key' };
        }

        const apiKey = this.apiKeys.get(id);
        if (!apiKey) {
            return { valid: false, error: 'API key not found' };
        }

        if (!apiKey.isActive) {
            return { valid: false, error: 'API key is inactive' };
        }

        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
            return { valid: false, error: 'API key has expired' };
        }

        // Update last used
        apiKey.lastUsedAt = new Date();
        apiKey.monthlyUsage += 1;

        return { valid: true, apiKey };
    }

    /**
     * Get API key by ID
     */
    getApiKey(id: string): ApiKey | null {
        return this.apiKeys.get(id) || null;
    }

    /**
     * Get API key by key value
     */
    getApiKeyByValue(key: string): ApiKey | null {
        const id = this.apiKeyIndex.get(key);
        return id ? this.apiKeys.get(id) || null : null;
    }

    /**
     * Get all API keys for a user
     */
    getUserApiKeys(userId: string): ApiKey[] {
        return Array.from(this.apiKeys.values()).filter(k => k.userId === userId);
    }

    /**
     * Revoke API key
     */
    revokeApiKey(id: string): boolean {
        const apiKey = this.apiKeys.get(id);
        if (!apiKey) return false;

        apiKey.isActive = false;
        apiKey.updatedAt = new Date();

        return true;
    }

    /**
     * Delete API key
     */
    deleteApiKey(id: string): boolean {
        const apiKey = this.apiKeys.get(id);
        if (!apiKey) return false;

        this.apiKeyIndex.delete(apiKey.key);
        this.apiKeys.delete(id);

        return true;
    }

    /**
     * Get rate limit for API key
     */
    getRateLimit(apiKey: ApiKey): { limit: number; remaining: number; reset: number } {
        const now = Date.now();
        const windowSize = 60000; // 1 minute
        const reset = Math.ceil(now / windowSize) * windowSize;

        return {
            limit: apiKey.rateLimit,
            remaining: apiKey.rateLimit, // Simplified - in production would track actual usage
            reset,
        };
    }

    /**
     * Check if user has permission
     */
    hasPermission(apiKey: ApiKey, permission: string): boolean {
        return apiKey.permissions.includes(permission) || apiKey.permissions.includes('admin');
    }

    /**
     * Get rate plan limits
     */
    getRatePlanLimits(ratePlan: RatePlan): typeof RATE_PLAN_LIMITS[RatePlan] {
        return RATE_PLAN_LIMITS[ratePlan];
    }

    /**
     * Update API key rate plan
     */
    updateRatePlan(id: string, ratePlan: RatePlan): ApiKey | null {
        const apiKey = this.apiKeys.get(id);
        if (!apiKey) return null;

        apiKey.ratePlan = ratePlan;
        apiKey.rateLimit = RATE_PLAN_LIMITS[ratePlan].requestsPerMinute;
        apiKey.updatedAt = new Date();

        return apiKey;
    }

    /**
     * Generate JWT token (placeholder for future AI integration)
     * Currently returns a simple token for simulation
     */
    generateToken(userId: string): string {
        const payload = {
            userId,
            iat: Date.now(),
            exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        };
        return btoa(JSON.stringify(payload));
    }

    /**
     * Validate JWT token (placeholder for future AI integration)
     */
    validateToken(token: string): { valid: boolean; userId?: string } {
        try {
            const payload = JSON.parse(atob(token));
            if (payload.exp < Date.now()) {
                return { valid: false };
            }
            return { valid: true, userId: payload.userId };
        } catch {
            return { valid: false };
        }
    }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
