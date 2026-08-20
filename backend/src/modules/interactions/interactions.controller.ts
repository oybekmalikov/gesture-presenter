import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { AddCommentDto } from './dto/add-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  // Likes
  @Post('seminars/:seminarId/like')
  @UseGuards(JwtAuthGuard)
  toggleLike(
    @Param('seminarId') seminarId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.interactionsService.toggleLike(seminarId, userId);
  }

  // Comments
  @Get('seminars/:seminarId/comments')
  getComments(@Param('seminarId') seminarId: string) {
    return this.interactionsService.getSeminarComments(seminarId);
  }

  @Post('seminars/:seminarId/comments')
  @UseGuards(JwtAuthGuard)
  addComment(
    @Param('seminarId') seminarId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddCommentDto,
  ) {
    return this.interactionsService.addComment(seminarId, userId, dto);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  removeComment(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.interactionsService.removeComment(
      id,
      currentUser.id,
      currentUser.role,
    );
  }

  // Saved / Bookmarks
  @Post('seminars/:seminarId/save')
  @UseGuards(JwtAuthGuard)
  toggleSave(
    @Param('seminarId') seminarId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.interactionsService.toggleSave(seminarId, userId);
  }

  @Get('saved')
  @UseGuards(JwtAuthGuard)
  getSavedSeminars(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.interactionsService.getSavedSeminars(
      userId,
      Number(page) || 1,
      Number(limit) || 12,
    );
  }
}
