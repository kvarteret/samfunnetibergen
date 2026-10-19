export const SKONK_DEPLOYMENT = "skonk"

export function configuredLunaDeployment(): string {
  return process.env.AZURE_OPENAI_LUNA_DEPLOYMENT?.trim() || SKONK_DEPLOYMENT
}

export function shouldCaptureSkonkTelemetry(deployment: string): boolean {
  return deployment === SKONK_DEPLOYMENT
}
