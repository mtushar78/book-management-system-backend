import { IsString, IsNotEmpty, IsOptional, IsDateString, IsMongoId, IsISBN } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsISBN()
  @IsNotEmpty()
  isbn: string;

  @IsDateString()
  @IsOptional()
  publishedDate?: string;

  @IsString()
  @IsOptional()
  genre?: string;

  @IsMongoId()
  @IsNotEmpty()
  authorId: string;
}