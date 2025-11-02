import { IsString, IsNotEmpty, IsOptional, IsDateString, IsMongoId } from 'class-validator';
import { IsISBNCustom } from 'src/common/validators/isbn.validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsISBNCustom()
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