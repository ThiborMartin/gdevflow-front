import { UserRole } from './auth';

export interface ProjectMessage {
  id: number;
  content: string;
  createdAt?: string;
  projectId: number;
  senderId: number;
  senderName: string;
  senderRole: UserRole;
}
