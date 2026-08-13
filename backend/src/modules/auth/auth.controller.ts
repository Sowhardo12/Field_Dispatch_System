import { Controller, Post, Body, HttpCode,Get,HttpStatus,UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto,LogoutDto } from './dto/auth.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('auth')  // url/auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    return {
      success: true,
      data: user,
      error: null,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const authResult = await this.authService.login(dto);
    return {
      success: true,
      data: authResult,
      error: null,
      timestamp: new Date().toISOString(),
    };
  }
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    const authResult = await this.authService.refreshToken(dto);
    return {
      success: true,
      data: authResult,
      error: null,
      timestamp: new Date().toISOString(),
    };
  }
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: LogoutDto) {
    const result = await this.authService.logout(dto);
    return {
      success: true,
      data: result,
      error: null,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser('id') userId: number) {
    const profile = await this.authService.getProfile(userId);
    return {
      success: true,
      data: profile,
      error: null,
      timestamp: new Date().toISOString(),
    };
  }

}