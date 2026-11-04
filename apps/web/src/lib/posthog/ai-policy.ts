// The Azure deployment is still named "skonk"; only the code names say Mime.
export const MIME_DEPLOYMENT = "skonk"

export function configuredLunaDeployment(): string {
  return process.env.AZURE_OPENAI_LUNA_DEPLOYMENT?.trim() || MIME_DEPLOYMENT
}

export function shouldCaptureMimeTelemetry(deployment: string): boolean {
  return deployment === MIME_DEPLOYMENT
}
