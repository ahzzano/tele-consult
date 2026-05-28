import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { GetAppontmentDto } from './dto/get-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser, type AuthUser } from 'src/auth/auth-user';

@Controller('appointments')
@UseGuards(AuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.appointmentsService.create(createAppointmentDto, user.id);
  }

  @Get()
  async findAll(
    @Query() getAppointmentDto: GetAppontmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.appointmentsService.findAll(getAppointmentDto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentsService.update(+id, updateAppointmentDto, user.id);
  }

  @Patch(':id/reschedule')
  reschedule(
    @Param('id') id: string,
    @Body() rescheduleAppointmentDto: RescheduleAppointmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentsService.reschedule(
      +id,
      rescheduleAppointmentDto,
      user.id,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.appointmentsService.remove(+id, user.id);
  }
}
