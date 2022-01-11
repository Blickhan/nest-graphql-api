import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { AuthInput } from './dto/auth.input';
import { hash, compare } from 'bcrypt';
import { TokensService } from './tokens.service';
import { RefreshInput } from './dto/refresh.input';
import { AuthResponse } from './dto/auth.response';
import { RefreshResponse } from './dto/refresh.response';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private tokensService: TokensService,
  ) {}

  async validateCredentials(
    username: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.usersService.findByUsername(username);

    const valid = user ? await compare(password, user.password) : false;

    return valid ? user : null;
  }

  async login(loginUserInput: AuthInput) {
    const { username, password } = loginUserInput;

    const user = await this.validateCredentials(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.generateAuthResponse(user);
  }

  async signup(signupUserInput: AuthInput) {
    const { username, password } = signupUserInput;

    const existingUser = await this.usersService.findByUsername(username);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await this.usersService.create({
      username,
      password: hashedPassword,
    });

    return this.generateAuthResponse(newUser);
  }

  private async generateAuthResponse(user: User): Promise<AuthResponse> {
    const accessToken = await this.tokensService.generateAccessToken(user);
    const refreshToken = await this.tokensService.generateRefreshToken(
      user,
      60 * 60 * 24 * 30,
    );

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async refreshAuth(refreshAuthInput: RefreshInput): Promise<RefreshResponse> {
    const { user, token } =
      await this.tokensService.createAccessTokenFromRefreshToken(
        refreshAuthInput.refreshToken,
      );

    return {
      accessToken: token,
      user,
    };
  }
}
