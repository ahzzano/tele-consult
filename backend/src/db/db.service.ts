import { Injectable, OnModuleInit } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

@Injectable()
export class DbService {
    connection: NodePgDatabase<typeof schema> = drizzle(process.env.DATABASE_URL!)
}
