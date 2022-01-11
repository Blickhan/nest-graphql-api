import { Resolver, Query, Context } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CurrentUserId } from 'src/auth/current-user-id.decorator';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { nullable: true })
  @UseGuards(JwtGuard)
  me(@CurrentUserId() currentUserId: number) {
    return this.usersService.findById(currentUserId);
  }
}
