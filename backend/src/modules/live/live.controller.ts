import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { LiveService } from './live.service';
import { UpdateLiveStateDto } from './dto/update-live-state.dto';
import { CreateRecordingDto } from './dto/create-recording.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Audit } from '../../common/decorators/audit.decorator';

@Controller('live')
export class LiveController {
  constructor(private readonly liveService: LiveService) {}

  @Get('active')
  getActiveSessions() {
    return this.liveService.getActiveSessions();
  }

  @Get(':seminarId/token')
  @UseGuards(OptionalJwtAuthGuard)
  getToken(
    @Param('seminarId') seminarId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.liveService.generateLiveKitToken(seminarId, currentUser);
  }

  @Post(':seminarId/token')
  @UseGuards(OptionalJwtAuthGuard)
  generateToken(
    @Param('seminarId') seminarId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.liveService.generateLiveKitToken(seminarId, currentUser);
  }

  @Get(':seminarId')
  getSession(@Param('seminarId') seminarId: string) {
    return this.liveService.getSession(seminarId);
  }

  @Post(':seminarId/start')
  @UseGuards(JwtAuthGuard)
  @Audit({ action: 'live_session_start', entityType: 'live_session' })
  startLiveSession(
    @Param('seminarId') seminarId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.liveService.startLiveSession(
      seminarId,
      currentUser.id,
      currentUser.role,
    );
  }

  @Patch(':seminarId/state')
  @UseGuards(JwtAuthGuard)
  updateLiveState(
    @Param('seminarId') seminarId: string,
    @Body() dto: UpdateLiveStateDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.liveService.updateLiveState(
      seminarId,
      dto,
      currentUser.id,
      currentUser.role,
    );
  }

  @Post(':seminarId/end')
  @UseGuards(JwtAuthGuard)
  @Audit({ action: 'live_session_end', entityType: 'live_session' })
  endLiveSession(
    @Param('seminarId') seminarId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.liveService.endLiveSession(
      seminarId,
      currentUser.id,
      currentUser.role,
    );
  }

  @Post(':seminarId/recordings')
  @UseGuards(JwtAuthGuard)
  @Audit({ action: 'recording_uploaded', entityType: 'recording' })
  addRecording(
    @Param('seminarId') seminarId: string,
    @Body() dto: CreateRecordingDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.liveService.addRecording(
      seminarId,
      dto,
      currentUser.id,
      currentUser.role,
    );
  }
}
