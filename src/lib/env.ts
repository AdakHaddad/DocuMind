export function validateEnv() {
  const requiredEnvVars = ['NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }

  // Ensure NEXTAUTH_SECRET is not empty
  if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be at least 32 characters long');
  }

  // Ensure NEXTAUTH_URL is a valid URL
  try {
    new URL(process.env.NEXTAUTH_URL || '');
  } catch (error) {
    throw new Error('NEXTAUTH_URL must be a valid URL');
  }
} 