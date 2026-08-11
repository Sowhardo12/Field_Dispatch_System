import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ExecutionLogsService } from './execution-logs.service';
import { CreateWorkLogDto } from './dto/execution-log.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/interfaces/domain.interface';

@Controller('work-orders/:id/logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExecutionLogsController{
  constructor(private readonly executionLogsService: ExecutionLogsService){}
  @Post()
  @Roles(UserRole.TECHNICIAN)
  async createLog(
    @Param('id', ParseIntPipe) workOrderId: number,
    @CurrentUser('id') technicianId: number,
    @Body() dto: CreateWorkLogDto,
  ) {
    const data = await this.executionLogsService.createLog(workOrderId, technicianId, dto);
    return {
      success: true,
      data,
      error: null,
      timestamp: new Date().toISOString(),
    };
  }
  @Get()
  @Roles(UserRole.CLIENT, UserRole.DISPATCHER, UserRole.TECHNICIAN, UserRole.ADMIN)
  async getLogs(@Param('id', ParseIntPipe) workOrderId: number) {
    const data = await this.executionLogsService.getLogsForWorkOrder(workOrderId);
    return {
      success: true,
      data,
      error: null,
      timestamp: new Date().toISOString(),
    };
  }
}