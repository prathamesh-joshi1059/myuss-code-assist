import { Injectable } from '@nestjs/common';
import { Firestore, Timestamp } from '@google-cloud/firestore';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../core/logger/logger.service';

@Injectable()
export class FirestoreService {
  private readonly firestore: Firestore;

  constructor(private configService: ConfigService, private logger: LoggerService) {
    const firebaseDB = this.configService.get('FIRESTORE_DB');
    this.logger.info(`FirestoreService: constructor: firebaseDB: ${firebaseDB}`);
    this.firestore = new Firestore({
      databaseId: firebaseDB,
    });
  }

  async getCollection(collection: string) {
    const collectionRef = this.firestore.collection(collection);
    const snapshot = await collectionRef.get();
    const data = snapshot.docs.map((doc) => doc.data());
    return data;
  }

  async getCollectionDocs(collection: string) {
    const collectionRef = this.firestore.collection(collection);
    const snapshot = await collectionRef.get();
    return snapshot.docs;
  }
  async getCollectionDocsByFieldName(collection: string, FieldName: string, FieldValue: any) {
    // this.logger.info(`Inside get quote collection docs: getQuoteCollectionDocs: collection: ${collection}, Field Name:${FieldName} , Field Value: ${FieldValue}`);
    const collectionRef = this.firestore.collection(collection).where(FieldName, '==', FieldValue);
    const snapshot = await collectionRef.get();
    // this.logger.info(`Inside get quote collection docs: getQuoteCollectionDocs: snapshot: ${snapshot}`);
    return snapshot.docs;
  }
  async getDocument(collection: string, document: string) {
    const documentRef = this.firestore.collection(collection).doc(document);
    const doc = await documentRef.get();
    if (!doc.exists) {
      return null;
    }
    const data = doc.data();
    return data;
  }

  async createDocument(collection: string, document: string, data: any) {
    const documentRef = this.firestore.collection(collection).doc(document);
    await documentRef.set(JSON.parse(JSON.stringify(data)));
    return data;
  }

  async updateDocument(collection: string, document: string, data: any) {
    const documentRef = this.firestore.collection(collection).doc(document);
    await documentRef.update(data);
    return data;
  }

  async deleteDocument(collection: string, document: string) {
    const documentRef = this.firestore.collection(collection).doc(document);
    await documentRef.delete();
    return true;
  }

  async upsertDocument(collection: string, documentId: string, data: any) {
    const documentRef = await this.firestore.collection(collection).doc(documentId).set(data, { merge: true });
  }

  getTimestampFromDate(date: Date) {
    return Timestamp.fromDate(date);
  }
  // firestore.service

  async batchUpsertDocuments<T>(collectionName: string, documents: { [id: string]: T }) {
    const batch = this.firestore.batch();
    Object.entries(documents).forEach(([id, data]) => {
      const docRef = this.firestore.collection(collectionName).doc(id)
;
      batch.set(docRef, data, { merge: true });
    });
    await batch.commit();
  }
}
