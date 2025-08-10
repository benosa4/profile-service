
export class ForbiddenException extends Error {
    statusCode: number;
  
    constructor(message?: string) {
      super(message || 'Forbidden');
      this.name = 'ForbiddenException';
      this.statusCode = 403;
    }
  
    status(): number {
      return this.statusCode;
    }
  }
  