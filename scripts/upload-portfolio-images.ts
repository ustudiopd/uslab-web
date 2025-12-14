/**
 * Portfolio 이미지를 Supabase Storage에 업로드하는 스크립트
 * 
 * 사용법:
 * npx tsx scripts/upload-portfolio-images.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// .env.local 파일에서 환경 변수 로드
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const BUCKET_NAME = 'uslab-images';
const PORTFOLIO_FOLDER = 'portfolio';

interface ImageInfo {
  localPath: string;
  fileName: string;
  storagePath: string;
}

const images: ImageInfo[] = [
  {
    localPath: path.join(process.cwd(), 'public', 'images', 'portfolio', 'lgcns-ax-platform.png'),
    fileName: 'lgcns-ax-platform.png',
    storagePath: `${PORTFOLIO_FOLDER}/lgcns-ax-platform.png`,
  },
  {
    localPath: path.join(process.cwd(), 'public', 'images', 'portfolio', 'microsoft-copilot.png'),
    fileName: 'microsoft-copilot.png',
    storagePath: `${PORTFOLIO_FOLDER}/microsoft-copilot.png`,
  },
  {
    localPath: path.join(process.cwd(), 'public', 'images', 'portfolio', 'hack-for-public.png'),
    fileName: 'hack-for-public.png',
    storagePath: `${PORTFOLIO_FOLDER}/hack-for-public.png`,
  },
];

async function uploadImage(imageInfo: ImageInfo): Promise<string | null> {
  try {
    // 파일 존재 확인
    if (!fs.existsSync(imageInfo.localPath)) {
      console.error(`❌ 파일을 찾을 수 없습니다: ${imageInfo.localPath}`);
      return null;
    }

    // 파일 읽기
    const fileBuffer = fs.readFileSync(imageInfo.localPath);
    // Node.js 환경에서는 Buffer를 직접 사용
    const file = Buffer.from(fileBuffer);

    console.log(`📤 업로드 중: ${imageInfo.fileName}...`);

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(imageInfo.storagePath, file, {
        contentType: 'image/png',
        upsert: true, // 기존 파일이 있으면 덮어쓰기
      });

    if (error) {
      console.error(`❌ 업로드 실패: ${imageInfo.fileName}`, error.message);
      return null;
    }

    // Public URL 가져오기
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(imageInfo.storagePath);

    if (!urlData?.publicUrl) {
      console.error(`❌ URL을 가져올 수 없습니다: ${imageInfo.fileName}`);
      return null;
    }

    console.log(`✅ 업로드 완료: ${imageInfo.fileName}`);
    console.log(`   URL: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error: any) {
    console.error(`❌ 오류 발생: ${imageInfo.fileName}`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Portfolio 이미지 업로드를 시작합니다...\n');

  const results: Array<{ image: ImageInfo; url: string | null }> = [];

  for (const image of images) {
    const url = await uploadImage(image);
    results.push({ image, url });
    console.log(''); // 빈 줄
  }

  // 결과 요약
  console.log('📊 업로드 결과:');
  console.log('─'.repeat(50));
  results.forEach(({ image, url }) => {
    if (url) {
      console.log(`✅ ${image.fileName}`);
      console.log(`   ${url}`);
    } else {
      console.log(`❌ ${image.fileName} - 실패`);
    }
  });
  console.log('─'.repeat(50));

  const successCount = results.filter((r) => r.url !== null).length;
  console.log(`\n✨ 완료: ${successCount}/${images.length}개 이미지 업로드됨`);

  if (successCount === images.length) {
    console.log('\n💡 다음 단계: Portfolio 컴포넌트를 업데이트하여 버킷 URL을 사용하세요.');
  }
}

main().catch((error) => {
  console.error('스크립트 실행 중 오류 발생:', error);
  process.exit(1);
});

