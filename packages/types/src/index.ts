export interface UserDTO {
  id: string;
  email: string;
  name?: string | null;
}

export interface OrganizationDTO {
  id: string;
  name: string;
}

export interface DataSourceDTO {
  id: string;
  type: 'MANUAL_UPLOAD' | 'GDRIVE' | 'SLACK';
  status: 'ACTIVE' | 'INDEXING' | 'ERROR';
  displayName: string;
  createdAt: Date;
}

export interface ChatSessionDTO {
  id: string;
  title: string;
  updatedAt: Date;
}

export interface MessageDTO {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: Date;
}

export interface CreateChatSessionInput {
  title?: string;
}

export interface SendMessageInput {
  sessionId: string;
  message: string;
}

export interface UploadDocumentInput {
  fileName: string;
  fileContentBase64: string; // Simplified for MVP
}
