import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { RefreshToken } from './entities/refresh-tokens.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokensService } from './tokens.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    PassportModule,
    UsersModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        signOptions: { expiresIn: '2h' },
        secret: process.env.JWT_SECRET,
      }),
    }),
  ],
  providers: [AuthService, AuthResolver, JwtStrategy, TokensService],
})
export class AuthModule {}
