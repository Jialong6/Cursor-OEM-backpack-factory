import { NextRequest, NextResponse } from 'next/server';
import { getCountryByCode } from '@/lib/countries';

/**
 * API Response 接口
 */
interface GeoSuccessResponse {
  success: true;
  data: {
    countryCode: string;
    countryName: string;
  };
}

interface GeoErrorResponse {
  success: false;
  error: string;
}

type GeoResponse = GeoSuccessResponse | GeoErrorResponse;

/**
 * GET /api/geo
 *
 * 根据请求头中的地理位置信息返回用户的国家信息。
 * 支持以下请求头（按优先级排序）：
 * 1. x-vercel-ip-country - Vercel Edge 自动添加
 * 2. cf-ipcountry - Cloudflare 自动添加
 * 3. x-country - 自定义头部
 *
 * @returns 成功时返回 { success: true, data: { countryCode, countryName } }
 * @returns 失败时返回 { success: false, error: message }
 */
export async function GET(request: NextRequest): Promise<NextResponse<GeoResponse>> {
  // 按优先级尝试获取国家代码
  const countryCode =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country') ||
    '';

  // 处理空值情况
  if (!countryCode) {
    return NextResponse.json(
      {
        success: false,
        error: 'Country not detected. No geo headers present.',
      },
      { status: 404 }
    );
  }

  // 根据代码获取国家信息
  const country = getCountryByCode(countryCode);

  if (!country) {
    return NextResponse.json(
      {
        success: false,
        error: `Unknown country code: ${countryCode}`,
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      countryCode: country.code,
      countryName: country.nameEn,
    },
  });
}
