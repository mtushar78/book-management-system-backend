import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Author, AuthorDocument } from './entities/author.entity';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectModel(Author.name)
    private readonly authorModel: Model<AuthorDocument>,
  ) {}

  async create(createAuthorDto: CreateAuthorDto): Promise<Author> {
    const author = new this.authorModel(createAuthorDto);
    return await author.save();
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    firstName?: string,
    lastName?: string,
  ): Promise<{ data: Author[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (firstName) {
      filter.firstName = { $regex: firstName, $options: 'i' };
    }
    if (lastName) {
      filter.lastName = { $regex: lastName, $options: 'i' };
    }

    const [data, total] = await Promise.all([
      this.authorModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.authorModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Author> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }

    const author = await this.authorModel.findById(id).exec();
    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }
    return author;
  }

  async update(id: string, updateAuthorDto: UpdateAuthorDto): Promise<Author> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }

    const author = await this.authorModel
      .findByIdAndUpdate(id, updateAuthorDto, { new: true })
      .exec();

    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }

    return author;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }

    const author = await this.authorModel.findById(id).exec();

    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }

    // Check if author has books (you'll need to inject BooksService or do a count)
    // For now, we'll skip this check, but you can add it back if needed

    await this.authorModel.findByIdAndDelete(id).exec();
  }
}