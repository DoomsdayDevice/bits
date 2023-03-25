import * as Excel from "exceljs";
import { Workbook } from "exceljs";
import { v4 as uuidv4 } from "uuid";
import { FileStorage } from "@infrastructure/datasources/file-storage/file-storage.datasource";

export abstract class BaseWorkbookGenerator {
  wb: Workbook = new Excel.Workbook();

  filePath = this.configService.get("filePath");

  fileUrl = this.configService.get("fileUrl");

  folderName = "documents/reports";

  objectName = `${this.folderName}/${uuidv4()}.xlsx`;

  private dlLink = "";

  protected constructor(
    protected configService: ConfigService,
    protected fileStorage: FileStorage,
    public fileName: string
  ) {
    this.wb.created = new Date();
  }

  get downloadLink(): string {
    if (this.configService.get("dev.saveFilesLocally"))
      return `${this.fileUrl}/${this.fileName}`;
    return this.dlLink;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  abstract generate(...args: any): Promise<void>;

  // eslint-disable-next-line consistent-return
  async saveToFile(): Promise<void> {
    if (this.configService.get("dev.saveFilesLocally")) {
      return this.wb.xlsx.writeFile(`${this.filePath}/${this.fileName}`);
    }

    const buffer = await this.wb.xlsx.writeBuffer();
    await this.fileStorage.putFile(buffer as Buffer, this.objectName, {
      fileName: this.fileName,
    });
    this.dlLink = await this.fileStorage.getDownloadUrl(this.objectName);
  }
}
