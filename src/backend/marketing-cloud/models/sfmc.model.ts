export class SFMC_DataExtensionRow {
}

export class SFMC_DataExtensionRowsInsertDTO {
  items: SFMC_DataExtensionRow[];

  constructor(items: SFMC_DataExtensionRow[]) {
    this.items = items;
  }
}


export class SFMC_DataExtensionRowsUpsertDTO {
  keys: object;
  values: object;

  constructor(row: SFMC_DataExtensionRow, keyFields: string[]) {
    const keys = {};
    keyFields.forEach((keyField) => {
      keys[keyField] = row[keyField];
    });
    this.keys = keys;
    const values = {};
    Object.keys(row).forEach((key) => {
      if (!keyFields.includes(key)) {
        values[key] = row[key];
      }
    });
    this.values = values;
  }
}

export class SFMC_TransactionalMessage {
  definitionKey: string;
  recipient: SFMC_TransactionalMessageRecipient;
}

export class SFMC_TransactionalMessages {
  definitionKey: string;
  recipients: SFMC_TransactionalMessageRecipient[];
  constructor() {
    this.recipients = [];
  }
}

export class SFMC_TransactionalMessageRecipient {
  contactKey: string;
  to: string;
  attributes: object;
}

export class SFMC_TransactionalMessageResponse {
  requestId: string;
  errorcode: number;
  responses: SFMC_TransactionalMessageResponseItem[];
}

export class SFMC_TransactionalMessageResponseItem {
  messageKey: string;
}