import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Author } from '../../authors/entities/author.entity';

export type BookDocument = Book & Document;

@Schema({ timestamps: true })
export class Book {
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  isbn: string;

  @Prop({ type: Date })
  publishedDate: Date;

  @Prop()
  genre: string;

  @Prop({ type: Types.ObjectId, ref: 'Author', required: true })
  author: Types.ObjectId | Author;

  @Prop({ type: String, required: true })
  authorId: string;

  createdAt: Date;
  updatedAt: Date;
}

export const BookSchema = SchemaFactory.createForClass(Book);