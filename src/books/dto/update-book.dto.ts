import { IsString, IsOptional, IsDateString, IsISBN } from 'class-validator';
import { IsISBNCustom } from 'src/common/validators/isbn.validator';

export class UpdateBookDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsISBNCustom()
  @IsOptional()
  isbn?: string;

  @IsDateString()
  @IsOptional()
  publishedDate?: string;

  @IsString()
  @IsOptional()
  genre?: string;
}
