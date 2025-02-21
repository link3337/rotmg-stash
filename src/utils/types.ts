export function stringToBoolean(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true';
}

export const mapResponseToUIModel = <T, U>(
  responseDTO: U,
  propertyMappings?: Record<string, keyof T>
): T => {
  // Create an empty object that will hold the mapped DTO
  const mappedDTO: Partial<T> = {};

  // Loop through each property in the responseDTO
  for (const key in responseDTO) {
    // Check if propertyMappings exist and if the current key is in propertyMappings
    if (propertyMappings && key in propertyMappings) {
      // If there is a mapping for the current key, use it to set the property in the mappedDTO
      mappedDTO[propertyMappings[key] as keyof T] = responseDTO[key] as unknown as T[keyof T];
    } else {
      // If there is no mapping for the current key, use the key as is to set the property in the mappedDTO
      mappedDTO[key as unknown as keyof T] = responseDTO[key] as unknown as T[keyof T];
    }
  }

  // Return the mappedDTO as a type T
  return mappedDTO as T;
};
