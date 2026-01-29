'use server';

import { getRegionFromLocationFlowWrapper } from '../../ai/flows/get-region-from-location-flow';

interface LocationInput {
    lat: number;
    lng: number;
}

export async function getRegionFromLocation(input: LocationInput): Promise<string | null> {
  return getRegionFromLocationFlowWrapper(input);
}
