import { v4 as uuidv4 } from 'uuid';

export class GeneralUtils {
  static getUUID(): string {
    return uuidv4();
  }

  static roundToTwoDecimals(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  static round(value: number, scale: number): number {
    const scaleModifier = Math.pow(10, scale);
    return Math.round((value + Number.EPSILON) * scaleModifier) / scaleModifier;
  }

  static toCamelCase(str: string): string {
    const words = str?.split(' ');
    const camelCasedRest = words
      ?.map((word, index) => {
        return index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join('');

    return camelCasedRest;
  }

  static convertStringToObject(inputString: string): Record<string, boolean> {
    const keysArray = inputString?.split(';');
    return keysArray?.reduce((acc: Record<string, boolean>, key: string) => {
      const trimmedKey = key.trim();
      const camelCaseKey = GeneralUtils.toCamelCase(trimmedKey);
      acc[camelCaseKey] = true;
      return acc;
    }, {});
  }

  static getMatchingTrueFields(userModules: Record<string, boolean>, accountModules: Record<string, boolean>): Record<string, boolean> {
    const enabledModules: Record<string, boolean> = {};

    for (const module in userModules) {
      if (userModules[module] === true && accountModules[module] === true) {
        enabledModules[module] = true;
      }
    }

    return enabledModules;
  }
}