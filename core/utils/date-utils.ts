export class DateUtils {
  public static getToday(): Date {
    return new Date();
  }

  public static getDifferenceInDays(date1: Date, date2: Date): number {
    const diffInMs: number = date1.getTime() - date2.getTime();
    return Math.round(diffInMs / (1000 * 60 * 60 * 24));
  }

  public static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    
    return result;
  }

  static getDateStringForToday() {
    return new Date().toISOString().split('T')[0];
  }

  static getDateStringForDaysFromToday(days: number): string {
    return new Date(new Date().getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  public static formatDateAsSalesforceString(date: Date): string {
    const year = date.getFullYear();
    const month = this.padNumber(date.getMonth() + 1);
    const day = this.padNumber(date.getDate());
    return `${year}-${month}-${day}`;
  }

  public static padNumber(num: number): string {
    return num.toString().padStart(2, '0');
  }
  public static getDateInMyUssDashboardFormat(date: Date) : string{
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  }
}
