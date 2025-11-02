import { IsString, IsOptional, IsDateString, IsISBN } from 'class-validator';

export class UpdateBookDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsISBN()
  @IsOptional()
  isbn?: string;

  @IsDateString()
  @IsOptional()
  publishedDate?: string;

  @IsString()
  @IsOptional()
  genre?: string;
}
