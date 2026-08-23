/**
 * Firebase Client SDK Initialization Bridge for JIGYASA AI.
 */

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export const defaultFirebaseConfig: FirebaseClientConfig = {
  apiKey: "AIzaSyJIGYASA_Cloud_API_Key_Demo_2026",
  authDomain: "jigyasa-ai-cloud.firebaseapp.com",
  projectId: "jigyasa-ai-cloud",
  storageBucket: "jigyasa-ai-cloud.appspot.com",
  messagingSenderId: "1049204920",
  appId: "1:1049204920:web:8f9a0b1c2d3e4f5a",
};

export class FirebaseClient {
  private config: FirebaseClientConfig;
  public initialized: boolean = false;

  constructor(config?: FirebaseClientConfig) {
    this.config = config || defaultFirebaseConfig;
  }

  public async init(): Promise<boolean> {
    console.log('[FirebaseClient] Initializing client SDK for project:', this.config.projectId);
    this.initialized = true;
    return true;
  }

  public getConfig(): FirebaseClientConfig {
    return this.config;
  }
}

export const firebaseClient = new FirebaseClient();
