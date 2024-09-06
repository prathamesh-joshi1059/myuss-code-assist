import { FileValidator } from "@nestjs/common";
import { allowedExtensions, fileSizeLimit } from "../../myuss/services/quote/constants";

export class FileIsDefinedValidator extends FileValidator {
    constructor() {
        super({});
    }

    isValid(file?: Record<string, any>): boolean {
        return !!file && (file['size'] <= fileSizeLimit || allowedExtensions.includes(file['mimetype']));
    }

    buildErrorMessage(): string {
        return "File is not defined";
    }
}