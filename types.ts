export interface WebSource {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web: WebSource;
}

export interface GroundingMetadata {
  groundingChunks: GroundingChunk[];
}

export interface SearchResult {
  text: string;
  sources: GroundingChunk[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: GroundingChunk[];
}
