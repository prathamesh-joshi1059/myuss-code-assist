import { v4 as uuidv4 } from 'uuid';

export class GeneralUtils {
  // creatd and return a uuid
  static getUUID() {
    return uuidv4();
  }

  static roundToTwoDecimals(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  public static round(value, scale) {
    const scaleModifier = Math.pow(10, scale);
    return Math.round((value + Number.EPSILON) * scaleModifier) / scaleModifier;
  }

  // Function to convert a string to camelCase while preserving 'myuss' as a single word if present
  static toCamelCase(str: string): string {
    const words = str?.split(' ');
    const camelCasedRest = words
      ?.map((word, index) => {
        return index === 0
          ? word.toLowerCase() 
          : word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join('');

    return camelCasedRest;
  }

  // Function to convert a semi-colon separated string to an object with camelCased keys
  static convertStringToObject(inputString: string): Record<string, boolean> {
    const keysArray = inputString?.split(';');
    return keysArray?.reduce((acc: Record<string, boolean>, key: string) => {
      const trimmedKey = key.trim();
      const camelCaseKey = GeneralUtils.toCamelCase(trimmedKey);
      acc[camelCaseKey] = true;
      return acc;
    }, {});
  }

  static  getMatchingTrueFields(userModules:Record<string,boolean>, accountModules:Record<string,boolean>) {
    let enabledModules:Record<string,boolean> = {};
  
    for (let module in userModules) {
      if (userModules.hasOwnProperty(module) && userModules[module] === true && accountModules[module] === true) {
        enabledModules[module] = true;
      }
    }
  
    return enabledModules;
  }
}
