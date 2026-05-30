import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, type AuthUser } from '../auth/auth-user';

@Controller('prescriptions')
@UseGuards(AuthGuard)
export class PrescriptionsController {
    constructor(private readonly prescriptionsService: PrescriptionsService) { }

    @Post()
    async create(
        @Body() createPrescriptionDto: CreatePrescriptionDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.prescriptionsService.create(createPrescriptionDto, user.id);
    }

    @Get()
    async findAll(@Query() query: {
        doctor?: number,
        patient?: number,
        record?: number
    }, @CurrentUser() user: AuthUser) {
        return await this.prescriptionsService.findAll(query, user.id);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        return await this.prescriptionsService.findOne(+id, user.id);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updatePrescriptionDto: UpdatePrescriptionDto,
        @CurrentUser() user: AuthUser,
    ) {
        return await this.prescriptionsService.update(+id, updatePrescriptionDto, user.id);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        return await this.prescriptionsService.remove(+id, user.id);
    }
}
