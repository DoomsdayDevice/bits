export interface MetaDataOptions {
  mimetype?: string;
  fileName?: string;
}

export enum FileType {
  profilePicture = 'profilePicture',
}

export interface File {
  id: string;
  objectName: string;
  mimetype: string;
  entityName: string;
  entityId: string;
  fileType: FileType;
}
