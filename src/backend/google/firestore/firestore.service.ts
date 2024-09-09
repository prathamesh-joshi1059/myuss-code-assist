import { Injectable } from '@nestjs/common';
import { Firestore, Timestamp } from '@google-cloud/firestore';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../core/logger/logger.service';

@Injectable()
export class FirestoreService {
  private readonly firestore: Firestore;

  constructor(private configService: ConfigService, private logger: LoggerService) {
    const firebaseDB = this.configService.get<string>('FIRESTORE_DB');
    this.logger.info(`FirestoreService: constructor: firebaseDB: ${firebaseDB}`);
    this.firestore = new Firestore({
      databaseId: firebaseDB,
    });
  }

  async getCollection(collection: string): Promise<any[]> {
    const collectionRef = this.firestore.collection(collection);
    const snapshot = await collectionRef.get();
    return snapshot.docs.map((doc) => doc.data());
  }

  async getCollectionDocs(collection: string): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
    const collectionRef = this.firestore.collection(collection);
    const snapshot = await collectionRef.get();
    return snapshot.docs;
  }

  async getCollectionDocsByFieldName(
    collection: string,
    fieldName: string,
    fieldValue: any
  ): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
    const collectionRef = this.firestore.collection(collection).where(fieldName, '==', fieldValue);
    const snapshot = await collectionRef.get();
    return snapshot.docs;
  }

  async getDocument(collection: string, document: string): Promise<any | null> {
    const documentRef = this.firestore.collection(collection).doc(document);
    const doc = await documentRef.get();
    return doc.exists ? doc.data() : null;
  }

  async createDocument(collection: string, document: string, data: any): Promise<any> {
    const documentRef = this.firestore.collection(collection).doc(document);
    await documentRef.set(data);
    return data;
  }

  async updateDocument(collection: string, document: string, data: any): Promise<any> {
    const documentRef = this.firestore.collection(collection).doc(document);
    await documentRef.update(data);
    return data;
  }

  async deleteDocument(collection: string, document: string): Promise<boolean> {
    const documentRef = this.firestore.collection(collection).doc(document);
    await documentRef.delete();
    return true;
  }

  async upsertDocument(collection: string, documentId: string, data: any): Promise<void> {
    const documentRef = this.firestore.collection(collection).doc(documentId);
    await documentRef.set(data, { merge: true });
  }

  getTimestampFromDate(date: Date): Timestamp {
    return Timestamp.fromDate(date);
  }

  async batchUpsertDocuments<T>(collectionName: string, documents: { [id: string]: T }): Promise<void> {
    const batch = this.firestore.batch();
    Object.entries(documents).forEach(([id, data]) => {
      const docRef = this.firestore.collection(collectionName).doc(id);
      batch.set(docRef, data, { merge: true });
    });
    await batch.commit();
  }
}