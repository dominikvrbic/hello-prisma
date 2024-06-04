import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { UserService } from './user.service';
import { User } from '@prisma/client';

describe('UserService (Integration)', () => {
  let app: INestApplication;
  let service: UserService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [UserService, PrismaService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = app.get<UserService>(UserService);
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });
  afterEach(async () => prisma.user.deleteMany());

  // Helper to generate a test user
  const createTestUser = async (): Promise<User> => {
    return prisma.user.create({
      data: {
        name: 'Test User',
        email: `test${Date.now()}@example.com`, // Unique email to avoid conflicts
      },
    });
  };

  it('should find a unique user', async () => {
    const testUser = await createTestUser();
    const foundUser = await service.user({ id: testUser.id });
    expect(foundUser).toEqual(testUser);
  });

  it('should find multiple users', async () => {
    await createTestUser(); // Create a few test users
    await createTestUser();

    const users = await service.users({ where: {} }); // Get all
    expect(users.length).toBe(2);
  });

  it('should create, update, and delete a user', async () => {
    const newUser = await service.createUser({
      name: 'New User',
      email: 'new@example.com',
    });
    expect(newUser).toHaveProperty('id');

    const updatedUser = await service.updateUser({
      where: { id: newUser.id },
      data: { name: 'Updated User' },
    });
    expect(updatedUser.name).toBe('Updated User');

    const deletedUser = await service.deleteUser({ id: newUser.id });
    expect(deletedUser.id).toBe(newUser.id);
  });
});
