export interface SingleReport {
  question: string;
  report: string;
}

export interface DocumentObject {
  _id: string;
  title: string;
  slug: string;
  owner: string;
  content: string;
  summary: string;
  access: "private" | "public";
  driveFileUrl: string;
  reports: SingleReport[];
  createdAt: Date;
  updatedAt: Date;
} 