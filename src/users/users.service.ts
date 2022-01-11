import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  async findById(id: number) {
    return this.usersRepository.findOne(id);
  }

  async findByUsername(username: string) {
    return this.usersRepository.findOne({ where: { username } });
  }

  async create(createUserInput: { username: string; password: string }) {
    const newUser = this.usersRepository.create(createUserInput);

    return this.usersRepository.save(newUser);
  }
}
