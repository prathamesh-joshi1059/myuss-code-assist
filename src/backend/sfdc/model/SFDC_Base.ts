export class Attributes {
  type: string;
  url?: string;
  referenceId?: string;
}

export class SFDC_Object {
  attributes?: Attributes;

  constructor() {}

  protected _setTypeAttribute(objectType: string) {
    if (!this.attributes) {
      this.attributes = new Attributes();
    }
    this.attributes.type = objectType;
  }

}