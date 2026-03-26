import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulePostDto } from './dto/schedule-post.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('posts')
export class SchedulerController {
  constructor(private schedulerService: SchedulerService) {}

  @Post('schedule')
  schedule(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SchedulePostDto,
  ) {
    return this.schedulerService.schedulePost(user.id, dto);
  }

  @Get('scheduled')
  getScheduled(@CurrentUser() user: CurrentUserPayload) {
    return this.schedulerService.getScheduledPosts(user.id);
  }
}
