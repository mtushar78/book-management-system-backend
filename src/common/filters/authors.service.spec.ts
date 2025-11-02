import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthorsService } from '../../authors/authors.service';
import { Author } from '../../authors/entities/author.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateAuthorDto } from '../../authors/dto/create-author.dto';
import { UpdateAuthorDto } from '../../authors/dto/update-author.dto';

describe('AuthorsService', () => {
  let service: AuthorsService;
  let repository: Repository<Author>;

  const mockAuthor: Author = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    firstName: 'John',
    lastName: 'Doe',
    bio: 'A great author',
    birthDate: new Date('1980-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    books: [],
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorsService,
        {
          provide: getRepositoryToken(Author),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuthorsService>(AuthorsService);
    repository = module.get<Repository<Author>>(getRepositoryToken(Author));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new author', async () => {
      const createAuthorDto: CreateAuthorDto = {
        firstName: 'John',
        lastName: 'Doe',
        bio: 'A great author',
        birthDate: '1980-01-01',
      };

      mockRepository.create.mockReturnValue(mockAuthor);
      mockRepository.save.mockResolvedValue(mockAuthor);

      const result = await service.create(createAuthorDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createAuthorDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockAuthor);
      expect(result).toEqual(mockAuthor);
    });
  });

  describe('findAll', () => {
    it('should return paginated authors', async () => {
      const authors = [mockAuthor];
      mockRepository.findAndCount.mockResolvedValue([authors, 1]);

      const result = await service.findAll(1, 10);

      expect(mockRepository.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        data: authors,
        total: 1,
        page: 1,
        limit: 10,
      });
    });

    it('should filter by firstName', async () => {
      const authors = [mockAuthor];
      mockRepository.findAndCount.mockResolvedValue([authors, 1]);

      const result = await service.findAll(1, 10, 'John');

      expect(mockRepository.findAndCount).toHaveBeenCalled();
      expect(result.data).toEqual(authors);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return an author by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockAuthor);

      const result = await service.findOne(mockAuthor.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockAuthor.id },
      });
      expect(result).toEqual(mockAuthor);
    });

    it('should throw NotFoundException if author not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an author', async () => {
      const updateAuthorDto: UpdateAuthorDto = {
        bio: 'Updated bio',
      };

      const updatedAuthor = { ...mockAuthor, ...updateAuthorDto };
      mockRepository.findOne.mockResolvedValue(mockAuthor);
      mockRepository.save.mockResolvedValue(updatedAuthor);

      const result = await service.update(mockAuthor.id, updateAuthorDto);

      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.bio).toEqual(updateAuthorDto.bio);
    });

    it('should throw NotFoundException if author not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete an author without books', async () => {
      mockRepository.findOne.mockResolvedValue(mockAuthor);
      mockRepository.remove.mockResolvedValue(mockAuthor);

      await service.remove(mockAuthor.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockAuthor.id },
        relations: ['books'],
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockAuthor);
    });

    it('should throw NotFoundException if author not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if author has books', async () => {
      const authorWithBooks = { ...mockAuthor, books: [{ id: '1' }] };
      mockRepository.findOne.mockResolvedValue(authorWithBooks);

      await expect(service.remove(mockAuthor.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
