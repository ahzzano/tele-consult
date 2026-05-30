import { randomBytes } from 'crypto';

const TEST_JWT_SECRET = randomBytes(32).toString('hex');
const MIN_JWT_SECRET_LENGTH = 32;

export function getJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (secret && secret.length >= MIN_JWT_SECRET_LENGTH) {
        return secret;
    }

    if (process.env.NODE_ENV === 'test') {
        return TEST_JWT_SECRET;
    }

    if (secret) {
        throw new Error(
            `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long.`,
        );
    }

    throw new Error('JWT_SECRET is required.');
}
