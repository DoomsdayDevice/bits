import * as Moment from 'moment';
import { extendMoment } from 'moment-range';

const moment = extendMoment(Moment);

export function addDaysToDate(date: Date, days: number): Date {
  const newDate = new Date(date.valueOf());
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}
// counts from ZERO to 11
export const getLastDayOfMonth = (y: number, m: number): number =>
  new Date(y, (m + 1) % 11, 0).getDate();

export function getStartOfMonth(yearOrDate: number | Date, monthNum = 0): Date {
  if (typeof yearOrDate === 'number') {
    return new Date(yearOrDate, monthNum, 1, 0, 0, 0, 0);
  }
  return new Date(yearOrDate.getFullYear(), yearOrDate.getMonth(), 1, 0, 0, 0, 0);
}

export function getEndOfMonth(yearOrDate: number | Date, monthNum = 0): Date {
  if (typeof yearOrDate === 'number') {
    return new Date(yearOrDate, monthNum, getLastDayOfMonth(yearOrDate, monthNum), 23, 59, 59, 59);
  }
  return new Date(
    yearOrDate.getFullYear(),
    yearOrDate.getMonth(),
    getLastDayOfMonth(yearOrDate.getFullYear(), yearOrDate.getMonth()),
    23,
    59,
    59,
    59,
  );
}

export const padDate = (num: number): string => num.toString().padStart(2, '0');

export function rangesOverlap(s1: Date, e1: Date, s2: Date, e2: Date): boolean {
  const range1 = moment.range(s1, e1);
  const range2 = moment.range(s2, e2);
  return range1.overlaps(range2);
}

export class DateTimeService {}
