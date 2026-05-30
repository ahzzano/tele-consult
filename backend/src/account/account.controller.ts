import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, type AuthUser } from '../auth/auth-user';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountService.register(createAccountDto);
  }

  @Get(':email')
  @UseGuards(AuthGuard)
  findOne(@Param('email') email: string, @CurrentUser() user: AuthUser) {
    if (user.email !== email) {
      throw new ForbiddenException('You can only view your own account');
    }

    return this.accountService.findProfile(email);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (user.id !== +id) {
      throw new ForbiddenException('You can only update your own account');
    }

    return this.accountService.update(+id, updateAccountDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    if (user.id !== +id) {
      throw new ForbiddenException('You can only delete your own account');
    }

    return this.accountService.remove(+id);
  }
}
