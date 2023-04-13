import {
  Worksheet,
  Row,
  Cell,
  Column,
  Workbook,
  CellValue,
  Border,
  Borders,
} from "exceljs";
import {
  IExcelCellOptions,
  IExcelCellStyle,
  IExcelRowOptions,
  IExcelFormattingOptions,
  ExcelMatrixTable,
  ExcelCell,
  ExcelCellItem,
  IExcelHeader,
  ExcelHeaderRow,
} from "./excel.interface";

export class BaseExcel {
  colLight = "FFADD6B4";

  colDark = "FF77ADA4";

  colDarker = "FF669C93";

  colAccent = "FFD6C4";

  colAccent2 = "FF99CCC9";

  borderStyle: Border = { style: "thin", color: { argb: "FF000000" } };

  bordersStyle: Partial<Borders> = {
    top: this.borderStyle,
    left: this.borderStyle,
    bottom: this.borderStyle,
    right: this.borderStyle,
  };

  constructor(protected ws: Worksheet) {}

  applyStylesToCell(cell: Cell, style: IExcelCellStyle = {}): void {
    if (style.alignment) cell.style.alignment = style.alignment;
    if (style.numFmt) cell.style.numFmt = style.numFmt;
    if (style.font) cell.style.font = style.font;
    if (style.border) cell.style.border = style.border;
    if (style.fill) cell.style.fill = style.fill;
  }

  formattingCell(cell: Cell, options: IExcelCellOptions = {}): void {
    this.applyStylesToCell(cell, options.style);
  }

  styleCell(r: number, c: number, style: IExcelCellStyle): void {
    const cell = this.ws.getCell(r, c);
    this.applyStylesToCell(cell, style);
  }

  formattingRow(row: Row, options: IExcelRowOptions = {}): void {
    if (options.height) row.height = options.height;
    if (options.alignment) row.alignment = options.alignment;
    if (options.font) row.font = options.font;
    if (options.border) row.border = options.border;
    if (options.outlineLevel) row.outlineLevel = options.outlineLevel;
    if (options.hidden) row.hidden = options.hidden;
  }

  checkExcelCellValue(cell: ExcelCellItem, value: string): boolean {
    if (typeof cell === "object" && cell !== null) {
      if ("value" in cell) {
        return cell.value === value;
      }
    } else {
      return cell === value;
    }

    return false;
  }

  /**
   * Проверка, является ли значение ячейки соответствующим объектом
   * @param val
   */
  isPartialCell(val: ExcelCellItem): val is ExcelCell {
    return typeof val === "object" && val !== null && "value" in val;
  }

  /**
   * Добавление матрицы (таблицы) на лист
   * @param {*} sheet
   * @param {*} data
   * @param {*} colNum
   * @param {*} rowNum
   * @param {*} options
   */
  addMatrix(
    sheet: Worksheet,
    data: ExcelMatrixTable,
    colNum: number,
    rowNum: number,
    options: IExcelFormattingOptions = {}
  ): void {
    for (let r = 0; r < data.length; r++) {
      const currRow = sheet.getRow(r + rowNum);
      this.formattingRow(currRow, options.row);
      for (let c = 0; c < data[r].length; c++) {
        const dataCell = data[r][c];
        const currCell = currRow.getCell(c + colNum);
        this.formattingCell(currCell, options.cell);
        if (this.isPartialCell(dataCell)) {
          currCell.value = dataCell.value;
          this.formattingCell(currCell, dataCell);
        } else {
          currCell.value = dataCell;
        }
      }
    }
  }

  /**
   * Добавление таблицы согласно заголовкам (соблюдается порядок)
   * Поддерживается горизонтальный merge ячеек при наличии у заголовка опции colSize
   * @param {*} worksheet
   * @param {*} data
   * @param {*} headers
   * @param {*} colNum
   * @param {*} rowNum
   * @param {*} options
   */
  addMatrixByHeaders(
    worksheet: Worksheet,
    data: ExcelHeaderRow[],
    headers: IExcelHeader[],
    colNum: number,
    rowNum: number,
    options: IExcelFormattingOptions = {}
  ): void {
    for (let r = 0; r < data.length; r++) {
      const currRowNum = rowNum + r;
      const currRow = worksheet.getRow(currRowNum);
      const currDataRow = data[r];
      this.formattingRow(currRow, options.row);

      let mergedCount = 0;
      for (let c = 0; c < headers.length; c++) {
        const currColNum = colNum + c + mergedCount;
        const currKey = headers[c].key;
        const currHeader = headers[c];
        const currMergedCount = currHeader.colSize ? currHeader.colSize - 1 : 0;
        if (currMergedCount) {
          mergedCount += currMergedCount;
        }

        // Если в данных есть такое свойство
        const currCell = currRow.getCell(currColNum);
        this.formattingCell(currCell, options.cell);
        if (
          currKey &&
          currDataRow[currKey] !== null &&
          currDataRow[currKey] !== undefined
        ) {
          const currProp = currDataRow[currKey];
          // Если надо - мерджим ячейки
          if (currMergedCount) {
            const currColLetter = utils.numToLetter(currColNum);
            const endColLetter = utils.numToLetter(
              currColNum + currMergedCount
            );
            worksheet.mergeCells(
              `${currColLetter}${currRowNum}`,
              `${endColLetter}${currRowNum}`
            );
          }

          if (typeof currProp === "string" || typeof currProp === "number") {
            if (currHeader.isUrl && typeof currProp === "string") {
              currCell.value = { text: currProp, hyperlink: currProp };
              currCell.style = {
                font: { underline: true, color: { argb: "FF0645AD" } },
              };
            } else {
              currCell.value = currProp;
            }
          } else if (currProp && "value" in currProp) {
            currCell.value = currProp.value;
            this.formattingCell(currCell, currProp);
          }
        }
      }
    }
  }

  /**
   * Формирует стиль numFmt, подстраивающийся под число и количество знаков после запятой,
   * а также ограничивающий количество знаков максимально возможным.
   * @param {number} number - число, на основании которого формируется стиль nmtFmt
   * @param {number} maxDecimalCount - максимальное количество знаков после запятой
   * @param {string} additionalSymbols - добавляемые в конец символы (рублей, процентов и т.д.)
   */
  dynamicNumFmtStyle(
    number: number,
    maxDecimalCount: number,
    additionalSymbols = ""
  ): string {
    const realDecimalCount = utils.decimalCount(number);
    let formatPrt1 = "#";
    let formatPrt2 = "0";

    if (maxDecimalCount > 0 && realDecimalCount > 0) {
      formatPrt1 += ",";
      formatPrt2 += ".";
      for (let i = 0; i < maxDecimalCount && i < realDecimalCount; i++) {
        formatPrt1 += "#";
        formatPrt2 += "0";
      }
    }

    return formatPrt1 + formatPrt2 + additionalSymbols;
  }

  /**
   * Добавление простых (однострочных) заголовков таблицы.
   * Поддерживается горизонтальный merge ячеек при наличии у заголовка опции colSize
   * @param {*} worksheet
   * @param {*} headers
   * @param {*} startColNum
   * @param {*} startRowNum
   * @param {*} options
   */
  addSimpleHeader(
    worksheet: Worksheet,
    headers: IExcelHeader[],
    startColNum: number,
    startRowNum: number,
    options: IExcelFormattingOptions = {}
  ): void {
    if (options.setColumns !== false) worksheet.columns = headers as Column[];
    const headerRow = worksheet.getRow(startRowNum);

    this.formattingRow(headerRow, options.row);

    let mergedCount = 0;
    for (let c = 0; c < headers.length; c++) {
      const currColNum = startColNum + c + mergedCount;
      const currHeader = headers[c];

      // Если надо, мержим ячейки
      if (currHeader.colSize && currHeader.colSize > 1) {
        const currColLetter = utils.numToLetter(currColNum);
        const endColLetter = utils.numToLetter(
          currColNum + currHeader.colSize - 1
        );
        worksheet.mergeCells(
          `${currColLetter}${startRowNum}`,
          `${endColLetter}${startRowNum}`
        );
        mergedCount += currHeader.colSize - 1;
      }

      const currCell = headerRow.getCell(currColNum);
      currCell.value = headers[c].title;
      this.formattingCell(currCell, options.cell);
    }
  }

  addSimpleTable(
    worksheet: Worksheet,
    headers: IExcelHeader[],
    data: ExcelHeaderRow[],
    startColNum: number,
    startRowNum: number,
    headerOptions: IExcelFormattingOptions = {},
    bodyOptions: IExcelFormattingOptions = {}
  ): void {
    this.addSimpleHeader(
      worksheet,
      headers,
      startColNum,
      startRowNum,
      headerOptions
    );
    this.addMatrixByHeaders(
      worksheet,
      data,
      headers,
      startColNum,
      startRowNum + 1,
      bodyOptions
    );
  }

  async addImageOnSheet(
    wb: Workbook,
    ws: Worksheet,
    url: string,
    options: {
      tl: { col: number; row: number };
      ext: { width: number; height: number };
    }
  ): Promise<void> {
    const image = await utils.getBase64FromFile(url);
    const logoImage = wb.addImage({
      base64: image,
      extension: "png",
    });

    ws.addImage(logoImage, options);
  }

  // PRINTING

  // eslint-disable-next-line

  printCell(row: number, col: number, val: CellValue): void {
    const cell = this.ws.getCell(row, col);
    cell.value = val;
  }

  printArray(
    row: number,
    colStart: number,
    arr: any[],
    cellOptions: IExcelCellOptions = {}
  ): void {
    let col = colStart;
    for (const val of arr) {
      this.printCell(row, col, val);
      const cell = this.ws.getCell(row, col);
      this.formattingCell(cell, cellOptions);
      col++;
    }
  }

  printArrayToColumn(rowStart: number, col: number, arr: CellValue[]): void {
    for (const val of arr) {
      this.printCell(rowStart++, col, val);
    }
  }

  printMatrix(rowStart: number, colStart: number, matrix: CellValue[][]): void {
    for (const arr of matrix) {
      this.printArrayToColumn(rowStart, colStart++, arr);
    }
  }

  printMatrixHorizontal(
    rowStart: number,
    colStart: number,
    matrix: CellValue[][]
  ): void {
    for (const arr of matrix) {
      this.printArray(rowStart++, colStart, arr);
    }
  }

  setColumnValues(colNum: number, vals: CellValue[]): void {
    const column = this.ws.getColumn(colNum);
    column.values = vals;
  }

  addArrayToRow(rowNum: number, arr: CellValue[]): void {
    const row = this.ws.getRow(rowNum);
    const values = row.values as CellValue[];
    const newValues = Object.values(arr).map((elem) => elem || "");
    row.values = [...values, ...newValues];
  }

  setDataValidationOfCell(row: number, col: number, formula: string): void {
    const cell = this.ws.getCell(row, col);
    cell.dataValidation = {
      type: "list",
      allowBlank: true,
      showErrorMessage: true,
      formulae: [formula],
    };
  }

  // FORMATTING

  borderizeCell(cell: Cell): void;

  // eslint-disable-next-line no-dupe-class-members
  borderizeCell(row: number, col: number): void;

  // eslint-disable-next-line no-dupe-class-members
  borderizeCell(param1: Cell | number, param2?: number): void {
    const cell: Cell =
      typeof param1 === "number" ? this.ws.getCell(param1, param2) : param1;
    cell.border = this.bordersStyle;
  }

  colorCell(row: number, col: number, color: string): void {
    const cell = this.ws.getCell(row, col);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: color },
    };
    this.borderizeCell(cell);
  }

  colorRow(rowNum: number, color: string): void {
    const selectedRow = this.ws.getRow(rowNum);
    selectedRow.eachCell((c) => {
      if (!c.fill) {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: color },
        };
      }
      this.borderizeCell(c);
    });
  }

  colorRect(
    r1: number,
    c1: number,
    r2: number,
    c2: number,
    color: string
  ): void {
    for (let r = r1; r < r2 + 1; r++) {
      for (let c = c1; c < c2 + 1; c++) {
        this.colorCell(r, c, color);
      }
    }
  }

  setFontOfCell(
    row: number,
    col: number,
    bold?: boolean,
    fontSize?: number,
    color?: string,
    underline?: boolean
  ): void {
    const cell = this.ws.getCell(row, col);
    cell.font = {
      bold,
      size: fontSize,
      underline,
      color: color ? { argb: color } : undefined,
    };
  }

  setFontOfRow(
    rowNum: number,
    bold = false,
    fontSize: number | null = null
  ): void {
    const selectedRow = this.ws.getRow(rowNum);
    selectedRow.eachCell((c) => {
      if (bold) c.font = { bold };
      if (fontSize) c.font = { size: fontSize };
    });
  }

  alignRow(rowNum: number): void {
    const row = this.ws.getRow(rowNum);
    row.alignment = {
      wrapText: true,
      vertical: "middle",
      horizontal: "center",
    };
  }

  // MULTIPLE ROWS

  setHeightToMultipleRows(rowStart: number, arrOfHeights: number[]): void {
    for (let i = 0; i < arrOfHeights.length; i++) {
      this.setRowHeight(rowStart + i, arrOfHeights[i]);
    }
  }

  alignMultipleRows(rowStart: number, rowEnd: number): void {
    for (let i = 0; i < rowEnd; i++) {
      this.alignRow(rowStart + i);
    }
  }

  colorMultipleRows(rowStart: number, arrOfColors: string[]): void {
    for (let i = 0; i < arrOfColors.length; i++) {
      this.colorRow(rowStart + i, arrOfColors[i]);
    }
  }

  formatMultipleRows(
    rowStart: number,
    arrayOfFormatFuncs: (((rowNum: number) => void) | null)[]
  ): void {
    for (let i = 0; i < arrayOfFormatFuncs.length; i++) {
      const fn = arrayOfFormatFuncs[i];
      if (fn) fn.bind(this)(rowStart + i);
    }
  }

  // NUMBER FORMATTING
  formatColAsRubles(colNum: number): void {
    this.ws.getColumn(colNum).numFmt = '#,##0" ₽";[Red]-#,##0" ₽"';
  }

  formatRowAsRubles(rowNum: number): void {
    this.ws.getRow(rowNum).numFmt = '#,##0" ₽";[Red]-#,##0" ₽"';
  }

  formatColAsRublesDec(colNum: number): void {
    this.ws.getColumn(colNum).numFmt = '#,##0.00" ₽";[Red]-#,##0.00" ₽"';
  }

  formatRowAsRublesDec(rowNum: number): void {
    this.ws.getRow(rowNum).numFmt = '#,##0.00" ₽";[Red]-#,##0.00" ₽"';
  }

  formatColAsPercents(colNum: number): void {
    this.ws.getColumn(colNum).numFmt = "0%";
  }

  formatRowAsPercents(rowNum: number): void {
    this.ws.getRow(rowNum).numFmt = "0%";
  }

  formatColAsPercentsDec(colNum: number): void {
    this.ws.getColumn(colNum).numFmt = "0.00%";
  }

  formatRowAsPercentsDec(rowNum: number): void {
    this.ws.getRow(rowNum).numFmt = "0.00%";
  }

  formatRowAsNums(rowNum: number): void {
    this.ws.getRow(rowNum).numFmt = "#,##0";
  }

  formatColAsNums(colNum: number): void {
    this.ws.getColumn(colNum).numFmt = "#,##0";
  }

  formatColAsNumsDec(colNum: number): void {
    this.ws.getColumn(colNum).numFmt = "#,##0.00";
  }

  hideColumn(colNum: number): void {
    const col = this.ws.getColumn(colNum);
    col.hidden = true;
  }

  colorizeColumn(
    columnNum: number,
    rowStart: number,
    rowEnd: number,
    color: string
  ): void {
    for (let row = rowStart; row < rowEnd; row++) {
      const cell = this.ws.getCell(row, columnNum);
      if (!cell.fill) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          // bgColor: { argb: color },
          fgColor: { argb: color },
        };
      }
      if (!cell.border) {
        this.borderizeCell(cell);
      }
    }
  }

  setColumnWidth(colNum: number, width: number): void {
    const column = this.ws.getColumn(colNum);
    column.width = width;
  }

  setRowHeight(rowNum: number, height: number): void {
    this.ws.getRow(rowNum).height = height;
  }

  mergeCells(row1: number, col1: number, row2: number, col2: number): void {
    this.ws.mergeCells(row1, col1, row2, col2);
  }

  percentize(num: number): number {
    return Math.round(num * 100);
  }

  percentizeDecimal(num: number): number {
    return Number((num * 100).toFixed(1));
  }

  cellNumsToAddr(r: number, c: number): string {
    return `${numToLetter(c)}${r}`;
  }

  asFormula(f: string): CellValue {
    return {
      formula: f,
    } as CellValue;
  }
}
