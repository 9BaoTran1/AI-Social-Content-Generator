import { generateOrderAI } from '../src/lib/aiService.ts';
import { DEFAULT_PROGRAMS } from '../src/data/defaultPrograms.ts';
import { OrderType } from '../src/types.ts';
import fs from 'fs';
import path from 'path';

interface UserSimulationResult {
  userId: number;
  userName: string;
  orderType: OrderType;
  contextSnippet: string;
  isDuplicateTopic: boolean;
  status: 'SUCCESS' | 'CRASH';
  fulfillmentSource: 'CACHE' | 'GEMINI_API' | 'BENCHMARK_FALLBACK';
  latencyMs: number;
  contentLength: number;
  variationsCount: number;
  hasDmScript: boolean;
  hasDirectorAnalysis: boolean;
  errorMessage?: string;
}

const COMMON_TRENDING_TOPIC = 'Review một năm nỗ lực nhưng cảm thấy dậm chân tại chỗ và áp lực so sánh với bạn bè cùng lứa tuổi 25';

const DIVERSE_TOPICS: { orderType: OrderType; context: string }[] = [
  { orderType: 'order_1', context: 'Clip TikTok: Nỗi sợ tuổi 25, áp lực làm 12 tiếng/ngày mà không thấy tương lai.' },
  { orderType: 'order_1', context: 'Clip TikTok: Tự ti khi nhìn bạn bè mua nhà mua xe, mình vẫn ở trọ chông chênh.' },
  { orderType: 'order_1', context: 'Clip TikTok: Hội chứng kẻ giả mạo (impostor syndrome), luôn nghĩ mình may mắn chứ không có năng lực.' },
  { orderType: 'order_2', context: 'Post Facebook: Tranh cãi giữa Gen Z từ chối OT và Sếp đòi hỏi cống hiến hết mình.' },
  { orderType: 'order_2', context: 'Post Facebook: Góc nhìn đa chiều về việc nhân sự giỏi 3 năm đột ngột nộp đơn nghỉ việc vì kiệt sức.' },
  { orderType: 'order_2', context: 'Post Facebook: Thảo luận về văn hóa micromanage và sự thiếu an toàn tâm lý tại công sở.' },
  { orderType: 'order_3', context: 'Post Facebook dài: Kiệt sức thầm lặng (quiet burnout) của dân sáng tạo nội dung khi đêm nào cũng bất an.' },
  { orderType: 'order_3', context: 'Post Facebook dài: Nghịch lý nghề nghiệp: Càng cố gắng làm hài lòng mọi người càng đánh mất bản sắc riêng.' },
  { orderType: 'order_3', context: 'Post Facebook dài: Khủng hoảng tuổi 30: Khi mức lương tăng nhưng năng lượng sống chạm đáy.' },
  { orderType: 'order_4', context: 'Threads comment: Đêm muộn tan làm nhìn thành phố sáng đèn, tự hỏi mình đang chạy theo điều gì.' },
  { orderType: 'order_4', context: 'Threads comment: Cảm giác trống rỗng khi vừa đạt một mục tiêu lớn mà không thấy vui.' },
  { orderType: 'order_5', context: 'Threads post: 3 sự thật trần trụi về việc làm việc chăm chỉ mà không ai nói cho bạn biết.' },
  { orderType: 'order_5', context: 'Threads post: Đừng nhầm lẫn giữa việc bận rộn cả ngày với việc tiến bộ thực sự.' },
  { orderType: 'order_6', context: 'LinkedIn post: Case study quản trị: Vì sao 60% quản lý cấp trung (Middle Managers) đang đối mặt với nguy cơ kiệt sức?' },
  { orderType: 'order_6', context: 'LinkedIn post: Framework 4 điểm xây dựng Psychological Safety cho đội ngũ nhân sự trong thời kỳ biến động.' },
  { orderType: 'order_7', context: 'Email Nurturing: Lá thư gửi bạn vào sáng thứ Hai - Dừng lại 5 phút để đo lường mức năng lượng nội tại.' },
  { orderType: 'order_7', context: 'Email Nurturing: 3 câu hỏi soi chiếu giúp bạn nhận diện điểm nghẽn nghề nghiệp trong tuần này.' },
];

async function run80UserConcurrencyStressTest() {
  console.log('================================================================================');
  console.log('⚡ HIGH-CONCURRENCY AUDIT: 80 SIMULTANEOUS USERS STRESS TEST SIMULATION ⚡');
  console.log('================================================================================');
  console.log('[Configuration]:');
  console.log('- Concurrent Virtual Users : 80 users');
  console.log('- Request Trigger Mode     : Promise.allSettled (Simultaneous Concurrency Burst)');
  console.log('- Free Gemini API Quota    : 15 Requests Per Minute (RPM)');
  console.log('- Cache Engine             : Smart Local Cache (<0.05s response, 0 Quota)');
  console.log('- Fallback Engine          : Template Fallback Engine (0.1s Zero-Crash Benchmark)');
  console.log(`- Programs In Scope        : ${DEFAULT_PROGRAMS.length} active programs`);
  console.log('--------------------------------------------------------------------------------\n');

  const userPayloads: {
    userId: number;
    userName: string;
    orderType: OrderType;
    context: string;
    isDuplicateTopic: boolean;
  }[] = [];

  for (let i = 1; i <= 80; i++) {
    if (i <= 25) {
      userPayloads.push({
        userId: i,
        userName: `User_${String(i).padStart(2, '0')} (Trending Group)`,
        orderType: 'order_1',
        context: COMMON_TRENDING_TOPIC,
        isDuplicateTopic: true,
      });
    } else {
      const topicIndex = (i - 26) % DIVERSE_TOPICS.length;
      const t = DIVERSE_TOPICS[topicIndex];
      userPayloads.push({
        userId: i,
        userName: `User_${String(i).padStart(2, '0')} (Diverse Group)`,
        orderType: t.orderType,
        context: `${t.context} [Session-User-${i}]`,
        isDuplicateTopic: false,
      });
    }
  }

  console.log('[Stress Test Launch]: Firing 80 requests simultaneously into generateOrderAI...');
  const batchStartTime = Date.now();

  const promises = userPayloads.map(async (u): Promise<UserSimulationResult> => {
    const startTime = performance.now();
    try {
      const result = await generateOrderAI({
        orderType: u.orderType,
        context: u.context,
        programs: DEFAULT_PROGRAMS,
      });

      const endTime = performance.now();
      const latencyMs = Math.round((endTime - startTime) * 10) / 10;

      let fulfillmentSource: 'CACHE' | 'GEMINI_API' | 'BENCHMARK_FALLBACK' = 'GEMINI_API';
      if (result.platformNotes?.includes('[Smart Cache')) {
        fulfillmentSource = 'CACHE';
      } else if (result.rationale?.includes('Template Fallback Engine') || result.rationale?.includes('Dự Phòng Thông Minh')) {
        fulfillmentSource = 'BENCHMARK_FALLBACK';
      }

      const hasContent = Boolean(result.primaryContent && result.primaryContent.trim().length > 50);
      const variationsValid = Array.isArray(result.variations) && result.variations.length >= 1;
      const hasDm = Boolean(result.dmFollowUpScript?.step1_empathy);
      const hasDirector = Boolean(result.directorStrategicAnalysis?.targetAudience);

      const isHealthy = hasContent && variationsValid;

      return {
        userId: u.userId,
        userName: u.userName,
        orderType: u.orderType,
        contextSnippet: u.context.slice(0, 45) + '...',
        isDuplicateTopic: u.isDuplicateTopic,
        status: isHealthy ? 'SUCCESS' : 'CRASH',
        fulfillmentSource,
        latencyMs,
        contentLength: result.primaryContent?.length || 0,
        variationsCount: result.variations?.length || 0,
        hasDmScript: hasDm,
        hasDirectorAnalysis: hasDirector,
      };
    } catch (err: any) {
      const endTime = performance.now();
      return {
        userId: u.userId,
        userName: u.userName,
        orderType: u.orderType,
        contextSnippet: u.context.slice(0, 45) + '...',
        isDuplicateTopic: u.isDuplicateTopic,
        status: 'CRASH',
        fulfillmentSource: 'GEMINI_API',
        latencyMs: Math.round((endTime - startTime) * 10) / 10,
        contentLength: 0,
        variationsCount: 0,
        hasDmScript: false,
        hasDirectorAnalysis: false,
        errorMessage: err?.message || String(err),
      };
    }
  });

  const settledResults = await Promise.all(promises);
  const totalBatchDurationMs = Date.now() - batchStartTime;

  console.log(`\n[Stress Test Complete]: All 80 concurrent requests completed in ${totalBatchDurationMs}ms (${(totalBatchDurationMs / 1000).toFixed(2)}s).\n`);

  const totalRequests = settledResults.length;
  const successCount = settledResults.filter((r) => r.status === 'SUCCESS').length;
  const crashCount = settledResults.filter((r) => r.status === 'CRASH').length;
  const successRate = (successCount / totalRequests) * 100;
  const crashRate = (crashCount / totalRequests) * 100;

  const cacheResults = settledResults.filter((r) => r.fulfillmentSource === 'CACHE');
  const apiResults = settledResults.filter((r) => r.fulfillmentSource === 'GEMINI_API' && r.status === 'SUCCESS');
  const fallbackResults = settledResults.filter((r) => r.fulfillmentSource === 'BENCHMARK_FALLBACK');

  const allLatencies = settledResults.map((r) => r.latencyMs).sort((a, b) => a - b);
  const minLatency = allLatencies[0] || 0;
  const maxLatency = allLatencies[allLatencies.length - 1] || 0;
  const avgLatency = Math.round(allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length);

  const getPercentile = (arr: number[], pct: number) => {
    const idx = Math.min(arr.length - 1, Math.floor((pct / 100) * arr.length));
    return arr[idx];
  };

  const p50 = getPercentile(allLatencies, 50);
  const p90 = getPercentile(allLatencies, 90);
  const p95 = getPercentile(allLatencies, 95);
  const p99 = getPercentile(allLatencies, 99);

  const avgCacheLatency = cacheResults.length > 0 ? (cacheResults.reduce((a, b) => a + b.latencyMs, 0) / cacheResults.length).toFixed(2) : '0';
  const avgApiLatency = apiResults.length > 0 ? (apiResults.reduce((a, b) => a + b.latencyMs, 0) / apiResults.length).toFixed(2) : '0';
  const avgFallbackLatency = fallbackResults.length > 0 ? (fallbackResults.reduce((a, b) => a + b.latencyMs, 0) / fallbackResults.length).toFixed(2) : '0';

  console.log('================================================================================');
  console.log('📊 CONCURRENCY METRICS SUMMARY (80 SIMULTANEOUS USERS)');
  console.log('================================================================================');
  console.log(`- Total Simulated Users    : ${totalRequests}`);
  console.log(`- Successful Responses     : ${successCount} / ${totalRequests} (${successRate.toFixed(1)}%)`);
  console.log(`- Crashes / Blank Screens  : ${crashCount} / ${totalRequests} (${crashRate.toFixed(1)}%)`);
  console.log(`- Total Batch Execution    : ${totalBatchDurationMs}ms (~${(totalBatchDurationMs / 1000).toFixed(2)}s)`);
  console.log(`- Overall Concurrency RPS  : ${(totalRequests / (totalBatchDurationMs / 1000)).toFixed(1)} requests/second`);
  console.log('--------------------------------------------------------------------------------');
  console.log('⏱️ LATENCY PERCENTILES:');
  console.log(`- Min Latency (Cực tiểu)   : ${minLatency} ms`);
  console.log(`- Average Latency (Trung bình) : ${avgLatency} ms`);
  console.log(`- Median (P50)             : ${p50} ms`);
  console.log(`- P90                      : ${p90} ms`);
  console.log(`- P95                      : ${p95} ms`);
  console.log(`- Max Latency (P100 / Max) : ${maxLatency} ms`);
  console.log('--------------------------------------------------------------------------------');
  console.log('🛡️ ARCHITECTURAL FULFILLMENT BREAKDOWN:');
  console.log(`1. Smart Local Cache       : ${cacheResults.length} requests (${((cacheResults.length / totalRequests) * 100).toFixed(1)}%) | Avg Latency: ${avgCacheLatency}ms | Quota: 0 calls`);
  console.log(`2. Live Gemini API         : ${apiResults.length} requests (${((apiResults.length / totalRequests) * 100).toFixed(1)}%) | Avg Latency: ${avgApiLatency}ms | Quota: ${apiResults.length} calls`);
  console.log(`3. Benchmark Fallback Eng  : ${fallbackResults.length} requests (${((fallbackResults.length / totalRequests) * 100).toFixed(1)}%) | Avg Latency: ${avgFallbackLatency}ms | Quota: 0 extra`);
  console.log('================================================================================\n');

  console.log('Sample User Requests (First 15 of 80):');
  console.table(
    settledResults.slice(0, 15).map((r) => ({
      User: r.userName,
      Order: r.orderType,
      Source: r.fulfillmentSource,
      Latency: `${r.latencyMs}ms`,
      ContentLen: `${r.contentLength} chars`,
      Status: r.status,
    }))
  );

  const reportData = {
    testDate: new Date().toISOString(),
    totalUsers: totalRequests,
    successRate: `${successRate.toFixed(1)}%`,
    crashRate: `${crashRate.toFixed(1)}%`,
    totalBatchDurationMs,
    latency: {
      min: minLatency,
      max: maxLatency,
      avg: avgLatency,
      p50,
      p90,
      p95,
      p99,
    },
    sources: {
      cache: { count: cacheResults.length, avgLatencyMs: avgCacheLatency },
      liveApi: { count: apiResults.length, avgLatencyMs: avgApiLatency },
      benchmarkFallback: { count: fallbackResults.length, avgLatencyMs: avgFallbackLatency },
    },
    detailedResults: settledResults,
  };

  const outputPath = path.resolve('scratch/stress_test_80_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(reportData, null, 2), 'utf-8');
  console.log(`\n[Report Saved]: Full raw dataset saved to ${outputPath}`);
}

run80UserConcurrencyStressTest().catch(console.error);
