import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, type AuthUser } from '../auth/auth-user';

@Controller('records')
@UseGuards(AuthGuard)
export class RecordsController {
    constructor(private readonly recordsService: RecordsService) { }

    @Post()
    async create(@Body() createRecordDto: CreateRecordDto, @CurrentUser() user: AuthUser) {
        return await this.recordsService.create(createRecordDto, user.id);
    }

    @Get()
    async findAll(@Query() query: {
        doctor?: number,
        patient?: number
    }, @CurrentUser() user: AuthUser) {
        return await this.recordsService.findAll(query, user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        return this.recordsService.findOne(+id, user.id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateRecordDto: UpdateRecordDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.recordsService.update(+id, updateRecordDto, user.id);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        return await this.recordsService.remove(+id, user.id);
    }
}
