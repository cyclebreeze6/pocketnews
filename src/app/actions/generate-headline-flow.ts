'use server';

import { generateHeadlineConfig } from '../../ai/flows/generate-headline-flow';
import type { GenerateHeadlineInput, GenerateHeadlineOutput } from '../../ai/flows/generate-headline-flow';

export async function generateHeadline(input: GenerateHeadlineInput): Promise<GenerateHeadlineOutput> {
  return generateHeadlineConfig(input);
}
