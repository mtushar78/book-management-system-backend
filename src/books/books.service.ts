import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { AuthorsService } from '../authors/authors.service';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name)
    private readonly bookModel: Model<BookDocument>,
    private readonly authorsService: AuthorsService,
  ) {}

 async create(createBookDto: CreateBookDto): Promise<Book> {
  try {
    await this.authorsService.findOne(createBookDto.authorId);
  } catch (error) {
    throw new BadRequestException(
      `Author with ID ${createBookDto.authorId} does not exist`,
    );
  }

  try {
    const book = new this.bookModel({
      ...createBookDto,
      author: new Types.ObjectId(createBookDto.authorId),
    });
    const savedBook = await book.save();
    
    // Fix: Handle null case properly
    const populatedBook = await this.bookModel
      .findById(savedBook._id)
      .populate('author')
      .exec();

    if (!populatedBook) {
      throw new NotFoundException('Book was created but could not be retrieved');
    }

    return populatedBook;
  } catch (error) {
    if (this.isDuplicateKeyError(error)) {
      throw new ConflictException(
        `Book with ISBN ${createBookDto.isbn} already exists`,
      );
    }
    throw error;
  }
}

  async findAll(
    page: number = 1,
    limit: number = 10,
    title?: string,
    isbn?: string,
    authorId?: string,
  ): Promise<{ data: Book[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (title) {
      filter.title = { $regex: title, $options: 'i' };
    }
    if (isbn) {
      filter.isbn = { $regex: isbn, $options: 'i' };
    }
    if (authorId) {
      if (Types.ObjectId.isValid(authorId)) {
        filter.author = new Types.ObjectId(authorId);
      }
    }

    const [data, total] = await Promise.all([
      this.bookModel
        .find(filter)
        .populate('author')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.bookModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Book> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    const book = await this.bookModel.findById(id).populate('author').exec();
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return book;
  }

  async update(id: string, updateBookDto: UpdateBookDto): Promise<Book> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    try {
      const book = await this.bookModel
        .findByIdAndUpdate(id, updateBookDto, { new: true })
        .populate('author')
        .exec();

      if (!book) {
        throw new NotFoundException(`Book with ID ${id} not found`);
      }

      return book;
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(
          `Book with ISBN ${updateBookDto.isbn} already exists`,
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    const book = await this.bookModel.findByIdAndDelete(id).exec();
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    return (
      'code' in error &&
      error.code === 11000 &&
      'keyPattern' in error &&
      typeof error.keyPattern === 'object' &&
      error.keyPattern !== null &&
      'isbn' in error.keyPattern
    );
  }
}