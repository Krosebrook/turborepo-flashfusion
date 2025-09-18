export class ProjectContext {
  public readonly projectId: string;
  public readonly name: string;
  public readonly metadata: Record<string, any>;

  constructor(projectId: string, name: string, metadata: Record<string, any> = {}) {
    this.projectId = projectId;
    this.name = name;
    this.metadata = metadata;
  }

  getMetadata(key: string): any {
    return this.metadata[key];
  }

  setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }
}