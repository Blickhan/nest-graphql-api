import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignOptions, TokenExpiredError } from 'jsonwebtoken';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { RefreshToken } from './entities/refresh-tokens.entity';
import { RefreshTokensService } from './refresh-tokens.service';

// TODO: Use my app's url
const BASE_OPTIONS: SignOptions = {
  issuer: 'https://my-app.com',
  audience: 'https://my-app.com',
};

export interface RefreshTokenPayload {
  jti: number;
  sub: number;
}

@Injectable()
export class TokensService {
  constructor(
    private refreshTokensService: RefreshTokensService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async generateAccessToken(user: User): Promise<string> {
    const opts: SignOptions = {
      ...BASE_OPTIONS,
      subject: String(user.id),
    };

    return this.jwtService.signAsync({}, opts);
  }

  async generateRefreshToken(user: User, expiresIn: number): Promise<string> {
    const refreshToken = await this.refreshTokensService.create(
      user,
      expiresIn,
    );

    const opts: SignOptions = {
      ...BASE_OPTIONS,
      expiresIn,
      subject: String(user.id),
      jwtid: String(refreshToken.id),
    };

    return this.jwtService.signAsync({}, opts);
  }

  /**
   * Decodes and validates refresh token
   */
  async resolveRefreshToken(
    encoded: string,
  ): Promise<{ user: User; refreshToken: RefreshToken }> {
    const payload = await this.decodeRefreshToken(encoded);
    const refreshToken = await this.getRefreshTokenFromPayload(payload);

    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }

    if (refreshToken.isRevoked) {
      throw new Error('Refresh token revoked');
    }

    const user = await this.getUserFromPayload(payload);

    if (!user) {
      throw new Error('Refresh token malformed');
    }

    return { user, refreshToken };
  }

  async createAccessTokenFromRefreshToken(
    refreshToken: string,
  ): Promise<{ token: string; user: User }> {
    const { user } = await this.resolveRefreshToken(refreshToken);

    const token = await this.generateAccessToken(user);

    return { user, token };
  }

  private async decodeRefreshToken(
    token: string,
  ): Promise<RefreshTokenPayload> {
    try {
      return this.jwtService.verifyAsync(token);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else {
        throw new Error('Refresh token malformed');
      }
    }
  }

  private async getUserFromPayload(
    payload: RefreshTokenPayload,
  ): Promise<User> {
    const subId = payload.sub;

    if (!subId) {
      throw new Error('Refresh token malformed');
    }

    return this.usersService.findById(subId);
  }

  private async getRefreshTokenFromPayload(
    payload: RefreshTokenPayload,
  ): Promise<RefreshToken | null> {
    const tokenId = payload.jti;

    if (!tokenId) {
      throw new Error('Refresh token malformed');
    }

    return this.refreshTokensService.findById(tokenId);
  }
}
