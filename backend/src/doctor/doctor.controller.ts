import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { UpdateAppointmentBlocksDto } from './dto/update-appointment-blocks.dto';
import { GetDoctorDto } from './dto/get-doctor.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, type AuthUser } from '../auth/auth-user';

@Controller('doctor')
@UseGuards(AuthGuard)
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  create(@Body() createDoctorDto: CreateDoctorDto, @CurrentUser() user: AuthUser) {
    if (user.id !== createDoctorDto.acctId) {
      throw new ForbiddenException('You can only create your own doctor profile');
    }

    return this.doctorService.create(createDoctorDto);
  }

  @Get()
  findAll(@Query() getDoctorDto: GetDoctorDto) {
    return this.doctorService.findAll(getDoctorDto);
  }

  @Get('recommendations')
  recommend(@Query('symptoms') symptoms = '') {
    return this.doctorService.recommend(symptoms);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
    @CurrentUser() user: AuthUser,
  ) {
    this.ensureOwnDoctorProfile(+id, user);
    return this.doctorService.update(+id, updateDoctorDto);
  }

  @Get(':id/appointment-blocks')
  findAppointmentBlocks(@Param('id') id: string) {
    return this.doctorService.findAppointmentBlocks(+id);
  }

  @Put(':id/appointment-blocks')
  updateAppointmentBlocks(
    @Param('id') id: string,
    @Body() updateAppointmentBlocksDto: UpdateAppointmentBlocksDto,
    @CurrentUser() user: AuthUser,
  ) {
    this.ensureOwnDoctorProfile(+id, user);

    return this.doctorService.updateAppointmentBlocks(
      +id,
      updateAppointmentBlocksDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    this.ensureOwnDoctorProfile(+id, user);
    return this.doctorService.remove(+id);
  }

  private ensureOwnDoctorProfile(id: number, user: AuthUser) {
    if (user.id !== id) {
      throw new ForbiddenException('You can only manage your own doctor profile');
    }
  }
}
