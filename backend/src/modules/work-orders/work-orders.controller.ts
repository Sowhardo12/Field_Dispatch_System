import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto, QueryWorkOrderDto } from './dto/work-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RateLimiterGuard } from '../../common/guards/rate-limiter.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/interfaces/domain.interface';
import { clientCommandMessageReg } from 'bullmq';


@Controller('work-orders')
@UseGuards(JwtAuthGuard,RolesGuard)

export class WorkOrdersController{
  constructor(private readonly workOrdersService: WorkOrdersService){}
  @Post()
  @Roles(UserRole.CLIENT)
  @UseGuards(RateLimiterGuard)
  async create(
    @CurrentUser('id') clientId:number,
    @Body() dto: CreateWorkOrderDto,
  ){

    console.log('=== DEBUG ===');
    console.log('clientId value:', clientId);
    console.log('clientId type:', typeof clientId);
    console.log('dto:', dto);
    console.log('=== END DEBUG ===');
    const data = await this.workOrdersService.createWorkOrder(clientId,dto);
    return {
      success: true,
      data,
      error: null,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @Roles(UserRole.CLIENT,UserRole.DISPATCHER,UserRole.TECHNICIAN,UserRole.ADMIN)
  async findAll(@Query() query: QueryWorkOrderDto){
    const data = await this.workOrdersService.findAll(query);
    return {
      success: true,
      data,
      error: null,
      timestamp: new Date().toISOString(),
    };
  }
  @Get(':id')
  @Roles(UserRole.CLIENT, UserRole.DISPATCHER, UserRole.TECHNICIAN, UserRole.ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.workOrdersService.findOne(id);
    return {
      success: true,
      data,
      error: null,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/dispatch')
  @Roles(UserRole.DISPATCHER,UserRole.ADMIN)
  async dispatch(@Param('id', ParseIntPipe) id: number) {
    const data = await this.workOrdersService.dispatchWorkOrder(id);
    return {
      success: true,
      data,
      error: null,
      timestamp: new Date().toISOString(),
    };
  }
  @Patch(':id/accept')
  @Roles(UserRole.TECHNICIAN)
  async accept(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') technicianId: number,
  ) {
    const data = await this.workOrdersService.acceptWorkOrder(id, technicianId);
    return {
      success: true,
      data,
      error: null,
      timestamp: new Date().toISOString(),
    };
  }
  @Patch(':id/complete')
  @Roles(UserRole.TECHNICIAN)
  async complete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') technicianId: number,
  ) {
    const data = await this.workOrdersService.completeWorkOrder(id, technicianId);
    return {
      success: true,
      data,
      error: null,
      timestamp: new Date().toISOString(),
    };
  }
  @Patch(':id/close')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async close(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: UserRole,
  ) {
    const data = await this.workOrdersService.closeWorkOrder(id, userId, userRole);
    return {
      success: true,
      data,
      error: null,
      timestamp: new Date().toISOString(),
    };
  }

}