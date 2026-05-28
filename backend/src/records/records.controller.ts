import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';

@Controller('records')
export class RecordsController {
    constructor(private readonly recordsService: RecordsService) { }

    @Post()
    async create(@Body() createRecordDto: CreateRecordDto) {
        return await this.recordsService.create(createRecordDto);
    }

    @Get()
    async findAll(@Query() query: {
        doctor?: number,
        patient?: number
    }) {
        return await this.recordsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.recordsService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateRecordDto: UpdateRecordDto) {
        return this.recordsService.update(+id, updateRecordDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.recordsService.remove(+id);
    }
}
