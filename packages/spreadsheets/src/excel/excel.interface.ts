import { Font, Alignment, Borders, Fill, Cell, Style, Column } from 'exceljs';

export interface WorkbookGeneratorFactory<Gen> {
  getGenerator(): Gen;
}

export type ExcelStyle = Partial<Style>;

export interface IExcelHeader extends Partial<Column> {
  title: string;
  width?: number;
  key: string;

  /* Кастомные */
  colNum?: number;
  isTargeting?: boolean;
  colSize?: number;
  isUrl?: boolean;
}

export interface IExcelRowOptions {
  height?: number;
  alignment?: Partial<Alignment>;
  font?: Partial<Font>;
  border?: Partial<Borders>;
  outlineLevel?: number;
  hidden?: boolean;
}

export interface IExcelCellStyle {
  numFmt?: string;
  font?: Partial<Font>;
  alignment?: Partial<Alignment>;
  border?: Partial<Borders>;
  fill?: Fill;
}

export interface IExcelCellOptions {
  style?: IExcelCellStyle;
}

export interface IExcelFormattingOptions {
  row?: IExcelRowOptions;
  cell?: IExcelCellOptions;
  setColumns?: boolean;
}

export type ExcelCellItem = ExcelCell | string | null | undefined | number;
export type ExcelMatrixRow = ExcelCellItem[];
export type ExcelMatrixTable = ExcelMatrixRow[];

export type ExcelCell = Partial<Cell>;

export type ExcelHeaderRow = Record<string, ExcelCellItem>;
