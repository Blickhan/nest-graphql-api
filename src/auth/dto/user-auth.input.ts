import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UserAuthInput {
  @Field()
  username: string;

  @Field()
  password: string;
}
