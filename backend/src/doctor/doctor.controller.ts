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
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { UpdateAppointmentBlocksDto } from './dto/update-appointment-blocks.dto';
import { GetDoctorDto } from './dto/get-doctor.dto';

@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  create(@Body() createDoctorDto: CreateDoctorDto) {
    return this.doctorService.create(createDoctorDto);
  }

  @Get()
  findAll(@Query() getDoctorDto: GetDoctorDto) {
    return this.doctorService.findAll(getDoctorDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
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
  ) {
    return this.doctorService.updateAppointmentBlocks(
      +id,
      updateAppointmentBlocksDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.doctorService.remove(+id);
  }
}
