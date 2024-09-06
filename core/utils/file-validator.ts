import { FileValidator } from "@nestjs/common";
import { allowedExtensions, fileSizeLimit } from "../../myuss/services/quote/constants";

export class FileIsDefinedValidator extends FileValidator {
    constructor() { 
        super({});
    }
    isValid(file?: Object): boolean {
        if(file['size'] > fileSizeLimit && !allowedExtensions.includes(file['mimetype'])){
            return false;
        }else{
            return !! file;
        }
    }
    buildErrorMessage(): string {
        return "File is not defined";
    }
}