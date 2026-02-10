import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
    success: boolean;
    data: T;
    meta?: {
        timestamp: string;
        path: string;
        duration?: number;
    };
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, Response<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<Response<T>> {
        const request = context.switchToHttp().getRequest();
        const startTime = Date.now();

        return next.handle().pipe(
            map((data) => ({
                success: true,
                data,
                meta: {
                    timestamp: new Date().toISOString(),
                    path: request.path,
                    duration: Date.now() - startTime,
                },
            })),
        );
    }
}
