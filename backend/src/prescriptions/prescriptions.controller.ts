import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';

@Controller('prescriptions')
export class PrescriptionsController {
    constructor(private readonly prescriptionsService: PrescriptionsService) { }

    @Post()
    async create(@Body() createPrescriptionDto: CreatePrescriptionDto) {
        return this.prescriptionsService.create(createPrescriptionDto);
    }

    @Get()
    async findAll(@Query() query: {
        doctor?: number,
        patient?: number,
        record?: number
    }) {
        return await this.prescriptionsService.findAll(query);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.prescriptionsService.findOne(+id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updatePrescriptionDto: UpdatePrescriptionDto) {
        return await this.prescriptionsService.update(+id, updatePrescriptionDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return await this.prescriptionsService.remove(+id);
    }
}
