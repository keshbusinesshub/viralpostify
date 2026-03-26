import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { SchedulerProcessor } from './scheduler.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'post-queue',
    }),
  ],
  controllers: [SchedulerController],
  providers: [SchedulerService, SchedulerProcessor],
  exports: [SchedulerService],
})
export class SchedulerModule {}
