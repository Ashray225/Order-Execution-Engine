export interface IRepository<T> {
  save(data: T): Promise<void>;
  update(id: string, data: Partial<T>): Promise<void>;
  remove(id: string): Promise<void>;
  findById(id: string): Promise<T | null>;
}