'use server';
/**
 * @fileOverview A flow for determining a user's region from coordinates.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { REGIONS } from '../../lib/constants';

const GeolocationInputSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const GeolocationOutputSchema = z.object({
  region: z.string().nullable(),
});

// The user-provided API key
const GOOGLE_API_KEY = 'AIzaSyBMf0WTsLQFteR6cPmTVps8_Gk4dpwGvVM';

const getCountryFromCoords = async (lat: number, lng: number): Promise<string | null> => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error('Geocoding API error:', data.status, data.error_message);
      return null;
    }
    // Find the country component
    for (const result of data.results) {
      for (const component of result.address_components) {
        if (component.types.includes('country')) {
          return component.long_name;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching from Geocoding API:', error);
    return null;
  }
};

const getRegionFromLocationFlow = ai.defineFlow(
  {
    name: 'getRegionFromLocationFlow',
    inputSchema: GeolocationInputSchema,
    outputSchema: GeolocationOutputSchema,
  },
  async ({ lat, lng }) => {
    const country = await getCountryFromCoords(lat, lng);
    if (!country) {
      return { region: null };
    }

    const regionList = REGIONS.join(', ');

    const { text } = await ai.generate({
      prompt: `Given the country "${country}", which of the following regions does it belong to?
      Regions: ${regionList}.
      Respond with ONLY the name of the matching region from the list provided. If no specific region matches, respond with "Global".`,
    });
    
    const matchedRegion = text.trim();
    
    if (REGIONS.includes(matchedRegion)) {
      return { region: matchedRegion };
    }

    return { region: 'Global' }; // Fallback to global
  }
);

export async function getRegionFromLocationFlowWrapper(input: z.infer<typeof GeolocationInputSchema>): Promise<string | null> {
    const result = await getRegionFromLocationFlow(input);
    return result.region;
}
