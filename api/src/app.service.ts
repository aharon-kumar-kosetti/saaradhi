import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Saaradhi API is running. Document comprehension, not legal advice.';
  }
}
