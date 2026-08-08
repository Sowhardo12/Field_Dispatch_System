import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type WorkLogDocument = WorkLog & Document;

@Schema({ collection: 'work_logs', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class WorkLog {
  @Prop({ required: true, index: true })
  work_order_id?: number;

  @Prop({ required: true, index: true })
  technician_id?: number;

  @Prop({ type: [String], default: [] })
  checklists?: string[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  hardware_metadata?: Record<string, any>;

  @Prop({ required: true })
  technician_notes?: string;

  created_at?: Date;
}

export const WorkLogSchema = SchemaFactory.createForClass(WorkLog);