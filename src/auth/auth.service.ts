import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { UserAuthInput } from './dto/user-auth.input';
import { hash, compare } from 'bcrypt';

type BaseUser = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateCredentials(
    username: string,
    password: string,
  ): Promise<BaseUser | null> {
    const user = await this.usersService.findOne(username);

    const valid = user ? await compare(password, user.password) : false;

    if (!valid) return null;

    return {
      id: user.id,
      username: user.username,
    };
  }

  private generateToken(user: BaseUser) {
    const payload = { username: user.username, sub: user.id };
    return this.jwtService.sign(payload);
  }

  async login(loginUserInput: UserAuthInput) {
    const { username, password } = loginUserInput;

    const user = await this.validateCredentials(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      access_token: this.generateToken(user),
      user,
    };
  }

  async signup(signupUserInput: UserAuthInput) {
    const { username, password } = signupUserInput;

    const existingUser = await this.usersService.findOne(username);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await this.usersService.create({
      username,
      password: hashedPassword,
    });

    return {
      access_token: this.generateToken(newUser),
      user: newUser,
    };
  }
}
