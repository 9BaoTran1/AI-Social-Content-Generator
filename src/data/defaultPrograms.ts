import { ProgramItem, OrderMeta, SampleTemplate } from '../types';

export const DEFAULT_PROGRAMS: ProgramItem[] = [
  {
    id: 'prog-1',
    title: 'YEAR-IN-REVIEW 2025 × SELF-POSITIONING TEST 2026',
    type: 'ct',
    description: 'Dành cho người đi làm – những người đã nỗ lực cả năm và cần một điểm dừng để nhìn rõ mình hơn, đánh giá cơ hội - thách thức, ghi nhận thành tựu và tái định vị bản thân.',
    targetAudience: ['Người đi làm 22-38 tuổi', 'Nhân sự trải qua 1 năm bận rộn', 'Người cần nhìn lại và tái định hướng năm mới'],
    painPoints: [
      'Cuốn theo công việc 365 ngày không có thời gian dừng lại nhìn nhận sự trưởng thành',
      'Mơ hồ về định vị bản thân sau 12 tháng biến động',
      'Chưa rõ năm mới nên ưu tiên điều gì và bứt phá ra sao'
    ],
    coreValues: [
      'Nhìn lại & đánh giá cơ hội - thách thức sau 1 năm',
      'Ghi nhận những điều đã làm được dù nhỏ hay lớn',
      'Rút ra bài học quý giá và thực hành lòng biết ơn',
      'Định vị lại chính mình và chuẩn bị bứt phá năm mới'
    ],
    testOrFormAngle: 'Self-Positioning Test & Year Review Matrix - Test định vị bản thân & bài tập soi chiếu cá nhân hóa 1-1',
    isActive: true,
    isBuiltin: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'prog-2',
    title: 'Special 2026 – The Art of Conversation',
    type: 'ct',
    description: 'Nghệ thuật giao tiếp và thấu hiểu chính mình trong các mối quan hệ đa tầng (sếp, đồng nghiệp, vợ chồng, con cái) thông qua tư duy giao tiếp nhạy bén và lắng nghe sâu sắc.',
    targetAudience: ['Người đi làm gặp khúc mắc giao tiếp', 'Cặp đôi/vợ chồng/cha mẹ', 'Người muốn hòa hợp các mối quan hệ mà không đánh mất sự bình an'],
    painPoints: [
      'Chưa hiểu rõ phong cách và tư duy giao tiếp cốt lõi của chính mình',
      'Dễ rơi vào xung đột, hiểu lầm hoặc phòng thủ khi giao tiếp với sếp/đồng nghiệp/gia đình',
      'Gặp khó khăn trong việc vừa đạt mục đích hội thoại vừa giữ sự chân thành'
    ],
    coreValues: [
      'Gọi tên phong cách và tư duy giao tiếp của bản thân',
      'Hòa hợp mọi mối quan hệ: chuyển hóa xung đột thành sự thấu hiểu',
      'Giao tiếp thành công bền vững, giữ bình an nội tâm',
      'Tích hợp bài tập thực hành hàng ngày và theo dõi tiến trình cá nhân'
    ],
    testOrFormAngle: 'Bộ đánh giá phong cách giao tiếp & giải mã điểm nghẽn tương tác 1:1',
    imageUrl: 'https://storage.tally.so/30581dc9-c72d-4fb7-9469-676e57bb30ed/photo_6197064284425096831_y.jpg',
    isActive: true,
    isBuiltin: true,
    createdAt: '2026-01-05'
  },
  {
    id: 'prog-3',
    title: 'SPOT ON - BẠN MẠNH Ở ĐÂU?',
    type: 'ws',
    description: 'Workshop khám phá và định vị đúng điểm mạnh thực sự của bản thân, tháo gỡ tâm lý "ai cũng làm được vậy thôi" và xây dựng sự tự tin từ gốc rễ nội tại.',
    targetAudience: ['Người chăm chỉ nỗ lực nhưng chưa dám khẳng định thế mạnh', 'Người tự ti so sánh', 'Độ tuổi 20-35 tuổi'],
    painPoints: [
      'Làm được nhiều việc nhưng coi là điều bình thường ("Ai cũng làm được vậy thôi")',
      'Không biết mình thật sự giỏi ở đâu, đứng đúng vị trí chưa hay do hoàn cảnh đẩy đưa',
      'Mất định vị về bản sắc cá nhân, cảm thấy tự ti hoặc mông lung'
    ],
    coreValues: [
      'Soi gương chính mình: nhìn nhận rõ ràng, tìm đúng điểm mạnh để tập trung phát triển',
      'Mở rộng góc nhìn: gỡ bỏ lối nhìn tiêu cực về bản thân, khám phá tài năng ẩn giấu',
      'Xây nền vững chắc: định hướng môi trường và con đường phù hợp với giá trị thật',
      'Tự tin tự nhiên khi không cần phải cố trở thành một ai khác'
    ],
    testOrFormAngle: 'Template đánh giá mức độ thấu hiểu tính cách, con người thật & lộ trình phát triển điểm mạnh 1-1',
    isActive: true,
    isBuiltin: true,
    createdAt: '2026-01-10'
  },
  {
    id: 'prog-4',
    title: 'NEW CHAPTER – BƯỚC NGOẶT SỰ NGHIỆP',
    type: 'ws',
    description: 'Talkshow/Workshop dành cho những người mong muốn nhìn lại hành trình nghề nghiệp, khám phá thế mạnh, hiểu góc nhìn nhà tuyển dụng để ra quyết định chuyển hướng phù hợp.',
    targetAudience: ['Người đi làm đang băn khoăn gắn bó hay chuyển hướng', 'Người muốn tìm môi trường phù hợp với giá trị cá nhân', 'Senior/Junior 23-35 tuổi'],
    painPoints: [
      'Đi làm mỗi ngày nhưng tự hỏi có phù hợp với công việc hiện tại không',
      'Muốn chuyển hướng nhưng không biết bắt đầu từ đâu',
      'Dành nhiều thời gian tìm việc mới nhưng ít thời gian hiểu rõ bản thân'
    ],
    coreValues: [
      'Nhìn lại hành trình nghề nghiệp cá nhân',
      'Khám phá thế mạnh cốt lõi và giá trị khác biệt',
      'Hiểu góc nhìn của nhà tuyển dụng và thị trường lao động thực tế',
      'Có cơ sở vững vàng để đưa ra quyết định bước ngoặt sự nghiệp'
    ],
    testOrFormAngle: 'Bài đánh giá năng lực & độ phù hợp nghề nghiệp kèm tư vấn định hướng 1-1',
    imageUrl: 'https://storage.tally.so/54a75189-634d-42f2-b242-6a2d421b87a5/photo_2026-07-31_18-06-37.jpg',
    isActive: true,
    isBuiltin: true,
    createdAt: '2026-01-15'
  },
  {
    id: 'prog-5',
    title: 'FOCUS MASTERY - LÀM CHỦ NĂNG LƯỢNG VÀ SỰ TẬP TRUNG',
    type: 'ws',
    description: 'Làm chủ sự tập trung từ 3 trụ cột: Sức khỏe thể chất, Dũng khí dám cắt bỏ mục tiêu phụ, và Sự thấu hiểu sâu sắc chính mình.',
    targetAudience: ['Người hay bị xao nhãng, trì hoãn', 'Người quá tải công việc, năng lượng thất thường', 'Người liên tục đổi mục tiêu'],
    painPoints: [
      'Dễ mất tập trung, thiếu kiên nhẫn, phân tán năng lượng vào nhiều việc nhỏ nhặt',
      'Khó khăn trong việc dám cắt bỏ mục tiêu phụ để dồn tâm sức cho điều cốt lõi',
      'Cạn kiệt năng lượng thể chất và tinh thần giữa nhịp sống số'
    ],
    coreValues: [
      'Nhận diện: Bắt trúng thủ phạm gây mất tập trung và phân mảnh năng lượng',
      'Thực hành: Xác định ưu tiên, sắp xếp lộ trình và lựa chọn tâm điểm theo từng giai đoạn',
      'Chuyển hóa: Tối ưu thời gian và năng lượng để sống chủ động và rõ ràng mỗi ngày'
    ],
    testOrFormAngle: 'Bảng đánh giá mức độ rò rỉ năng lượng & quản trị sự chú ý cá nhân hóa 1-1',
    isActive: true,
    isBuiltin: true,
    createdAt: '2026-01-20'
  },
  {
    id: 'prog-6',
    title: 'LIFE ACTION – ĐẠO DIỄN CHÍNH MÌNH',
    type: 'ws',
    description: 'Hành trình cùng bạn nhìn lại những gì đã qua, thay đổi góc nhìn và chủ động viết tiếp kịch bản cuộc đời mình thay vì sống theo mong đợi của người khác.',
    targetAudience: ['Người từng trải qua thất bại hoặc mất phương hướng', 'Người cảm thấy đang sống theo kịch bản của người khác', 'Độ tuổi 20-35 tuổi'],
    painPoints: [
      'Cảm giác bế tắc khi cuộc đời không diễn ra như kịch bản mong muốn',
      'Mang cảm giác thất bại, tự trách hoặc không dám bắt đầu lại',
      'Sống vì sự kỳ vọng của xã hội mà quên mất mình thực sự là ai'
    ],
    coreValues: [
      'Nơi được bày tỏ: Kể câu chuyện, suy nghĩ và trăn trở thật của bản thân',
      'Nơi được lắng nghe & chia sẻ: Cùng người có chuyên môn và những người đồng hành',
      'Nơi soi chiếu: Nhận ra mình là ai, mình đang có gì và muốn trở thành người như thế nào',
      'Chủ động viết tiếp chương mới rực rỡ của cuộc đời'
    ],
    testOrFormAngle: 'Review đánh giá hành trình cá nhân & định hướng tái cấu trúc tư duy 1-1',
    isActive: true,
    isBuiltin: true,
    createdAt: '2026-01-25'
  },
  {
    id: 'prog-7',
    title: 'SỨC BỀN THỜI ĐẠI SỐ - RÈN LUYỆN CƠ BẮP NÃO BỘ',
    type: 'ws',
    description: 'Rèn luyện sức bền tinh thần, tính kiên định và năng lực suy nghĩ sâu sắc, phân tích vấn đề trong thời đại tiện nghi nhanh chóng.',
    targetAudience: ['Người dễ bỏ cuộc trước khó khăn', 'Người bị ảnh hưởng bởi thói quen mì ăn liền', 'Sinh viên và người trẻ 20-30 tuổi'],
    painPoints: [
      'Mọi thứ có sẵn trong một cú chạm khiến sức chịu đựng, nghị lực giảm đi',
      'Dễ nản lòng, buông xuôi khi gặp trở ngại hay vấn đề phức tạp',
      'Thiếu tư duy đào sâu và kiên trì rèn luyện cơ bắp tinh thần'
    ],
    coreValues: [
      'Xây dựng sức bền tinh thần: Không khuất phục, kiên định với mục tiêu',
      'Rèn luyện cơ bắp não bộ thông qua phân tích, nghiền ngẫm sâu',
      'Gia tăng năng lực thấu hiểu bản thân và giải quyết vấn đề thực tế'
    ],
    testOrFormAngle: 'Bài test đánh giá độ bền tinh thần & khả năng chịu áp lực giải quyết vấn đề 1-1',
    imageUrl: 'https://storage.tally.so/e198b8f6-8c1a-4faa-aeb4-b3a65a302e62/6069155373756649146.jpg',
    isActive: true,
    isBuiltin: true,
    createdAt: '2026-02-01'
  },
  {
    id: 'prog-8',
    title: 'SINH VIÊN THỜI THỰC CHIẾN',
    type: 'ws',
    description: 'Trang bị năng lực thực chiến, bản lĩnh ứng biến áp lực, kỹ năng giao tiếp hợp tác và tư duy giải quyết vấn đề dành riêng cho sinh viên chuẩn bị ra trường.',
    targetAudience: ['Sinh viên năm 3, 4', 'Cử nhân mới tốt nghiệp', 'Người chuẩn bị bước vào môi trường làm việc thực tế'],
    painPoints: [
      'Học giỏi trên trường nhưng mông lung, thiếu tự tin khi bước ra ngoài đi làm',
      'Lo lắng không đủ năng lực cạnh tranh, thiếu kỹ năng giải quyết tình huống thực tế',
      'Ngại giao tiếp khi bị từ chối, góp ý hoặc thay đổi môi trường'
    ],
    coreValues: [
      'Bù đắp khoảng cách giữa lý thuyết đại học và thực chiến thị trường',
      'Rèn luyện bản lĩnh vượt qua áp lực và thích nghi môi trường mới',
      'Nâng cao năng lực giao tiếp khéo léo, xử lý xung đột và hợp tác',
      'Chuẩn bị hành trang tự tin và vững vàng nhất trước ngày tốt nghiệp'
    ],
    testOrFormAngle: 'Bảng đánh giá năng lực thực chiến sinh viên & chuẩn bị phỏng vấn/tâm thế đi làm 1-1',
    imageUrl: 'https://storage.tally.so/39fa7140-d0ba-4419-8a74-1d7e3935b165/6087095795749425686.jpg',
    isActive: true,
    isBuiltin: true,
    createdAt: '2026-02-05'
  }
];

export const ORDERS_METADATA: OrderMeta[] = [
  {
    id: 'order_1',
    orderNumber: 1,
    title: 'Comment qua clip TikTok',
    platform: 'Tiktok',
    category: 'comment',
    allowedTypes: ['ws', 'ct'],
    description: 'Viết comment đồng cảm, đánh đúng tâm lý người trẻ 20-39 tuổi, khơi gợi nhu cầu hiểu mình và tặng bài test / đánh giá 1-1 miễn phí.',
    toneGuideline: 'Đồng cảm sâu sắc, nhẹ nhàng, không phán xét, văn phong tự nhiên đời thường, kết thúc bằng lời mời inbox nhận test free.',
    defaultPrompt: 'Tạo comment TikTok chuyển đổi comment thành inbox dựa trên nội dung clip này.'
  },
  {
    id: 'order_2',
    orderNumber: 2,
    title: 'Comment qua post Facebook',
    platform: 'Facebook',
    category: 'comment',
    allowedTypes: ['ws', 'ct'], // Chạy tự do cả WS & CT
    description: 'Comment đa chiều, đồng cảm thực tế cho các bên, hạ thấp bản thân, gợi ý Workshop hoặc Chương trình nhẹ nhàng, tinh tế. Không giới hạn WS/CT.',
    toneGuideline: 'Tự nhiên, đa chiều, khách quan, không áp đặt hay giáo điều. Đề xuất WS hoặc CT một cách tinh tế.',
    defaultPrompt: 'Tạo comment Facebook tự nhiên, góc nhìn đa chiều và đề xuất Workshop/Chương trình phù hợp.'
  },
  {
    id: 'order_3',
    orderNumber: 3,
    title: 'Viết bài Facebook (Long-Form)',
    platform: 'Facebook',
    category: 'post',
    allowedTypes: ['ws', 'ct'], // Chạy tự do cả WS & CT
    description: 'Bài viết Facebook dài (Long-Form) có chiều sâu, hook giật tít chạm trăn trở nghề nghiệp, khẳng định dự án cộng đồng phi lợi nhuận không bán khóa học/PR lùa gà, kèm bình luận ghim mồi đặt link.',
    toneGuideline: 'Đồng cảm sâu sắc, chân thực, cuốn hút, cam kết phi lợi nhuận minh bạch. Kết bài bằng lời kêu gọi xem bình luận ghim để nhận link bài test/đăng ký.',
    defaultPrompt: 'Viết bài Facebook dài (Long-form) có chiều sâu, kèm bình luận ghim mồi đặt link.'
  },
  {
    id: 'order_4',
    orderNumber: 4,
    title: 'Comment Threads',
    platform: 'Threads',
    category: 'comment',
    allowedTypes: ['ws', 'ct'],
    description: 'Comment Threads chân thật, ngắn gọn, giàu tính tự sự (storytelling), dễ chạm vào nỗi đau nội tâm của người đọc.',
    toneGuideline: 'Văn phong thủ thỉ, sâu lắng, cá nhân hóa cao, gợi mở tâm sự để người xem muốn chủ động nhắn tin.',
    defaultPrompt: 'Tạo comment Threads chạm cảm xúc và chuyển đổi thành inbox.'
  },
  {
    id: 'order_5',
    orderNumber: 5,
    title: 'Viết bài Threads',
    platform: 'Threads',
    category: 'post',
    allowedTypes: ['ws', 'ct'],
    description: 'Bài đăng Threads ngắn gọn, ngắt dòng nhịp nhàng, hook thu hút, insight sắc bén và CTA tự nhiên về dự án/bài test 1-1.',
    toneGuideline: 'Authentic, gần gũi, câu từ gãy gọn, không đao to búa lớn, giữ sự khiêm nhường và cởi mở.',
    defaultPrompt: 'Viết bài Threads viral giữ đúng tinh thần chân thật và kết nối.'
  },
  {
    id: 'order_6',
    orderNumber: 6,
    title: 'Tiếp cận qua tin nhắn LinkedIn',
    platform: 'LinkedIn',
    category: 'message',
    allowedTypes: ['ws', 'ct'],
    description: 'Mẫu tin nhắn InMail / DM kết nối chuyên nghiệp dưới góc nhìn HRBP/L&D, nói về nghiên cứu năng lượng, MBTI và tham vấn 1:1 miễn phí.',
    toneGuideline: 'Chuyên nghiệp, lịch sự, có căn cứ khoa học, ấm áp và tôn trọng thời gian của đối phương.',
    defaultPrompt: 'Soạn tin nhắn LinkedIn tiếp cận cá nhân hóa theo phong cách HRBP/L&D.'
  },
  {
    id: 'order_7',
    orderNumber: 7,
    title: 'Viết content Email',
    platform: 'Email',
    category: 'email',
    allowedTypes: ['ws', 'ct'],
    description: 'Email nuôi dưỡng/chăm sóc học viên tiềm năng với tiêu đề cuốn hút, câu chuyện khơi mở và các câu hỏi soi chiếu giá trị bản thân.',
    toneGuideline: 'Thân mật, chia sẻ như một người bạn đồng hành, đặt câu hỏi gợi mở để người nhận hồi âm hoặc bấm link form.',
    defaultPrompt: 'Viết email marketing / nurturing giàu giá trị và chuyển đổi cao.'
  }
];

export const BENCHMARK_TEMPLATES: SampleTemplate[] = [
  {
    id: 'bm-tt-1',
    platform: 'TikTok',
    category: 'Comment Thấu Hiểu',
    title: 'Khung mẫu: Cơ hội được thử & hiểu bản thân',
    tags: ['Tiktok', 'Hiểu bản thân', '20-39t'],
    keyInsight: 'Nhấn mạnh việc dám bước đi đến từ sự hiểu mình, không phải do thiếu năng lực.',
    content: `Mình nghĩ ai cũng nên cho bản thân cơ hội được thử, được sai và được học. Nhiều khi mình chưa dám bước đi không phải vì không có khả năng, mà vì chưa thật sự hiểu mình là ai và phù hợp với điều gì. Đừng ngại trải nghiệm những điều mới, bởi chính những trải nghiệm đó sẽ giúp mình nhìn rõ giá trị, điểm mạnh và cả những giới hạn cần vượt qua của bản thân. Mình có biết một dự án khá hay giúp xác định hiện tại bạn đang ở trạng thái nào, điều gì đang cản trở sự phát triển và đâu là hướng đi phù hợp hơn trong thời gian tới. Nếu bạn đang muốn hiểu bản thân hơn và phát triển đúng hướng, có thể nhắn mình nhé`
  },
  {
    id: 'bm-tt-2',
    platform: 'TikTok',
    category: 'Comment Tuổi 20-39',
    title: 'Khung mẫu: Đừng so sánh bản thân & Test trưởng thành',
    tags: ['Tiktok', 'So sánh', 'Bài test 1-1'],
    keyInsight: 'Gỡ bỏ tự ti khi so sánh với người khác, trao quyền tự quyết cuộc đời.',
    content: `Gửi các bạn đang ở độ tuổi 20-39t, đừng so sánh bản thân với người khác, cũng đừng vì 1 lời của người khác mà nghi ngờ và tự ti về bản thân. Cuộc đời của bản thân phụ thuộc vào sự lựa chọn của chính mình, vậy hãy suy nghĩ thật kỹ và lựa chọn đúng và trải nghiệm tất cả để biết mình chọn đúng hay sai. Mình có 1 bài test đánh giá mức độ trưởng thành của suy nghĩ và có giải đáp chi tiết 1-1 hướng phát triển. Bạn nào mong muốn mình trở nên vững vàng, quyết đoán, tích cực hơn, cần mình gửi cho free nhé ạ   `
  },
  {
    id: 'bm-tt-3',
    platform: 'TikTok',
    category: 'Comment Cảm Xúc & Sức Bền',
    title: 'Khung mẫu: Vượt qua tiêu cực & Xây dựng tư duy bền bỉ',
    tags: ['Tiktok', 'Cảm xúc', 'Sức bền'],
    keyInsight: 'Bình thường hóa cảm giác muốn bỏ cuộc và đưa ra giải pháp rèn luyện ý chí.',
    content: `Một điều mà mình thấy các bạn trẻ bây giờ cũng nên học đó là nhanh lấy lại cảm xúc - vượt qua sự tiêu cực Vì chúng ta thì rất dễ buồn chán và từ bỏ chỉ vì một vài vấn đề nhỏ trong ngày, ngay sau đó là vứt hết mọi thứ, không muốn làm gì, cũng không giải quyết vấn đề. Đôi khi bạn không muốn vậy đâu, nhưng không thể làm khác được. Điều này cũng là ở tinh thần, ý chí của bản thân. Mình đang có một bài test review nhỏ có giải đáp chi tiết 1-1 qua online giúp đỡ xây dựng suy nghĩ tư duy mạnh mẽ, chủ động, tích cực, bền bỉ hơn phù hợp với tính cách, tiềm năng của từng bạn. Mình vẫn chia sẻ free cho các bạn nào từ 20+ đang cần ạ.   `
  },
  {
    id: 'bm-tt-4',
    platform: 'TikTok',
    category: 'Comment Tuổi 21-35',
    title: 'Khung mẫu: Chữa lành vs Thấu hiểu bản chất',
    tags: ['Tiktok', 'Đứa trẻ bên trong', 'Template 1-1'],
    keyInsight: 'Đi tìm nguyên nhân gốc rễ của sự thiếu tự tin thay vì chỉ chữa lành tạm thời.',
    content: `Gửi các bạn đang trong hành trình rực rỡ tuổi 21-35 tuổi: Đây có lẽ là lúc bạn đang tha thiết đi tìm hướng đi phù hợp cho mình. Nhưng đa số chúng ta lại đang đi tìm “giải pháp” để chữa lành cho đứa trẻ bên trong của mình. Dù có làm được nhiều việc, nhưng sao vẫn không cảm thấy tự tin và hạnh phúc mỗi ngày? Mình có một Template đánh giá mức độ thấu hiểu tính cách, con người thật của bạn và hỗ trợ giải đáp 1-1 về lộ trình để cải thiện bản lĩnh và sự tự tin từ bên trong. Bạn nào đang cần một "người dẫn đường" thì mình gửi tặng free nhé   `
  },
  {
    id: 'bm-tt-5',
    platform: 'TikTok',
    category: 'Comment Đi Làm & Kỹ Năng Mềm',
    title: 'Khung mẫu: Chuyên môn vs Tư duy làm việc với con người',
    tags: ['Tiktok', 'Người đi làm', 'Thời đại AI'],
    keyInsight: 'Chuyên môn là chưa đủ, tư duy giải quyết vấn đề và hiểu mình mới tạo ra đột phá.',
    content: `Mình từng nghĩ chỉ cần giỏi chuyên môn là đủ. Càng đi làm mới thấy nhiều người không hẳn code giỏi nhất nhưng lại được giao dự án lớn hơn vì họ có tư duy giải quyết vấn đề, giao tiếp và làm việc với con người rất tốt. Điều này không ai dạy kỹ ở trường cả. Nhờ một bài đánh giá về tư duy và năng lực cá nhân mà mình hiểu rõ điểm mạnh, điểm cần phát triển của bản thân hơn. Bạn nào đang loay hoay về định hướng nghề nghiệp hoặc muốn phát triển xa hơn trong thời đại AI thì ib mình, mình share nhé.`
  },
  {
    id: 'bm-li-1',
    platform: 'LinkedIn',
    category: 'Tin nhắn Outreach HRBP',
    title: 'Mẫu tiếp cận LinkedIn: HRBP & Nghiên cứu năng lượng Work-Life',
    tags: ['LinkedIn', 'HRBP', 'MBTI', '1:1 Consultation'],
    keyInsight: 'Tạo uy tín bằng vị trí HRBP/L&D và góc nhìn khoa học (MBTI, cân bằng năng lượng).',
    content: `Xin chào bạn, mình là Ngọc Diệp, hiện đang làm HRBP. Ngoài công việc chính thì mình yêu thích nghiên cứu về phát triển con người. Mình đang đang cộng tác cùng team HR, L&D về một project về phát triển bản thân & cách mỗi người sử dụng năng lượng trong work-life. Dự án dành cho sinh viên năm 3, 4 và người đi làm, có:
- Test tính cách khoa học (có MBTI) để hiểu rõ điểm mạnh, điểm yếu của mình
- Tìm hiểu nguyên nhân và cách cân bằng năng lượng
- Định hướng phát triển cá nhân hóa cho từng người
Project tâm huyết của chúng mình đang mở online, miễn phí nhận tham vấn 1:1. Nếu bạn quan tâm, bạn đăng ký tại đây: [Link Tally/Form]
Nếu có câu hỏi cho mình và dự án, bạn nhắn lại mình nhé.
Cảm ơn bạn đã đọc.
Chúc bạn một ngày tích cực và hiệu quả ạ. ❤️`
  },
  {
    id: 'bm-fb-1',
    platform: 'Facebook',
    category: 'Comment Phân Tích Đa Chiều',
    title: 'Mẫu comment Facebook: Đa chiều, đồng cảm thực tế cho cả đôi bên',
    tags: ['Facebook', 'WS & CT', 'Đa chiều', 'Phân tích'],
    keyInsight: 'Không áp đặt 1 chiều, đồng cảm khách quan với áp lực công sở và giới thiệu WS nhẹ nhàng.',
    content: `Tình trạng này không phải một mình bạn, manager hiện còn bị đè lương dưới 18m trong khi vừa tái cấu trúc duy trì vận hành vừa phải đào tạo 6 newbie (trong đó có cháu sếp). Khi bản thân có thực lực nhưng chưa định vị rõ ràng bản sắc và thế mạnh riêng, rất dễ rơi vào trạng thái quá tải và mất phương hướng. Bạn có thể thử tham gia WS này để nhìn nhận lại điểm mạnh và có chiến lược phù hợp hơn cho giai đoạn tới nhé.`
  },
  {
    id: 'bm-fb-talkshow-hr',
    platform: 'Facebook',
    category: 'Bài Viết Facebook Chuyên Sâu',
    title: 'Bài viết Facebook HR / Quản lý Nhân sự - Talkshow Be The True Leader',
    tags: ['Facebook', 'HR/HRBP', 'Talkshow', 'Workshop'],
    keyInsight: 'Chạm vào nỗi đau làm "dâu trăm họ", chuyển từ làm nhiều việc sự vụ sang tư duy lãnh đạo chiến lược.',
    content: `LÀM HR KHÔNG PHẢI LÀ LÀM DÂU TRĂM HỌ
LÀM HR LÀ DẪN DẮT SỰ PHÁT TRIỂN CỦA CON NGƯỜI

Sáng tuyển dụng. Trưa xử lý quan hệ lao động. Chiều tính lương. Tối giải quyết xung đột nội bộ.
Nhiều lúc làm HR cứ như một “người dọn rác cảm xúc” cho cả công ty 🥲

Nhưng trong thời đại AI ngày càng có thể làm thay các công việc hành chính, lọc CV, soạn JD, viết email, tổng hợp dữ liệu... Giỏi sự vụ thôi chưa chắc giúp bạn đi xa.

Một người làm HR muốn lên tầm Lead/HRBP cần nhiều hơn thế:
🧠 Tư duy chiến lược: Nhìn bức tranh lớn của doanh nghiệp, không chỉ giải quyết sự vụ
🤝 Thấu cảm & EQ cao: Hiểu tâm lý nhân sự nhưng vẫn giữ được sự tỉnh táo và nguyên tắc
🚀 Năng lực tạo ảnh hưởng: Nói để sếp nghe, nhân viên tin và phòng ban hợp tác
⚡️ Quản trị bản thân: Giữ năng lượng tích cực khi hàng ngày phải đối diện với áp lực từ nhiều phía

Nếu bạn đang làm HR, C&B, Tuyển dụng hoặc chuẩn bị bước lên vị trí Lead/Manager, có lẽ đã đến lúc không chỉ nâng cấp chuyên môn, mà phải nâng cấp tư duy lãnh đạo.

🎯 TALKSHOW: BE THE TRUE LEADER – LEADER THÔNG THÁI THỜI ĐẠI MỚI
📍 Online qua Zoom
🎁 Miễn phí 100%
✅ Thời gian: 19h-21h Thứ Năm

👉 Một buổi để nhìn lại năng lực cốt lõi, tư duy lãnh đạo, EQ và giá trị riêng của người làm HR trong thời đại AI.

Link đăng ký dưới comment nha.`
  },
  {
    id: 'bm-fb-talkshow-ld',
    platform: 'Facebook',
    category: 'Bài Viết Facebook Chuyên Sâu',
    title: 'Bài viết Facebook L&D / Training - Talkshow Be The True Leader',
    tags: ['Facebook', 'L&D', 'Training', 'Talkshow'],
    keyInsight: 'Định vị lại vai trò L&D: không chỉ chạy chương trình đa năng mà là người tạo ra năng lực cho tổ chức.',
    content: `L&D KHÔNG PHẢI LÀ NGƯỜI CHỈ BIẾT TỔ CHỨC TRAINING
L&D LÀ NGƯỜI DẪN DẮT SỰ PHÁT TRIỂN CỦA ĐỘI NGŨ

Lên kế hoạch đào tạo
Book phòng
Gửi mail
Theo dõi attendance
Làm báo cáo
Đánh giá sau chương trình…

Có những lúc L&D bận đến mức trở thành “người chạy chương trình đa năng”, nhưng nhìn lại vẫn chưa trả lời được: “Mình đang tạo ra giá trị gì cho tổ chức?”

Trong thời đại AI có thể hỗ trợ thiết kế nội dung, tạo tài liệu, tổng hợp dữ liệu và xây dựng chương trình học nhanh hơn rất nhiều, L&D càng không thể chỉ cạnh tranh bằng khả năng làm nhiều việc.

Một người L&D muốn phát triển xa cần biết:
🧠 Tư duy chiến lược: Hiểu vấn đề kinh doanh và xác định đúng năng lực cần phát triển
🤝 Thấu hiểu con người: Không chỉ hỏi “nhân viên muốn học gì?” mà phải nhìn ra “họ thực sự cần thay đổi điều gì?”
🚀 Tư duy lãnh đạo: Biết tạo ảnh hưởng, kết nối Stakeholder và dẫn dắt sự thay đổi
⚡️ Quản trị bản thân: Giữ năng lượng, sự sáng tạo và khả năng học hỏi trong một nghề luôn phải “phát triển người khác”

Nếu bạn đang làm L&D, Training, HRD hoặc chuẩn bị bước lên vị trí Lead/Manager, có lẽ đã đến lúc không chỉ nâng cấp nghiệp vụ đào tạo, mà phải nâng cấp tư duy lãnh đạo.

🎯 TALKSHOW: BE THE TRUE LEADER – LEADER THÔNG THÁI THỜI ĐẠI MỚI
📍 Online qua Zoom
🎁 Miễn phí 100%
✅ Thời gian: 19h-21h Thứ Năm

👉 Để L&D không chỉ “đào tạo nhân sự”, mà thực sự trở thành người tạo ra năng lực và thay đổi cho tổ chức.

Link đăng ký dưới comment.`
  },
  {
    id: 'bm-fb-talkshow-qa',
    platform: 'Facebook',
    category: 'Bài Viết Facebook Chuyên Sâu',
    title: 'Bài viết Facebook QA/QC / Tester - Talkshow Be The True Leader',
    tags: ['Facebook', 'QA/QC', 'Tester', 'Talkshow'],
    keyInsight: 'Dành cho dân kỹ thuật QA/QC muốn nâng cấp từ chuyên môn bắt lỗi lên kỹ năng lead và xử lý con người.',
    content: `LÃNH ĐẠO QA/QC KHÔNG PHẢI LÀ NGƯỜI ĐI BẮT TỪNG LỖI
MÀ LÀ NGƯỜI DẪN DẮT ĐỘI NGŨ GIẢI QUYẾT VẤN ĐỀ

Sáng họp. Trưa xử lý NCR. Chiều đi hiện trường. Tối vẫn check mail.
Làm QA/QC nhiều khi cứ như một “người chữa cháy đa năng” 🥲

Nhưng khi AI ngày càng có thể hỗ trợ kiểm tra, phân tích dữ liệu, sinh test case, tổng hợp báo cáo..., giỏi chuyên môn thôi chưa chắc giúp bạn đi xa.

Một QA/QC muốn lên Lead cần nhiều hơn thế:
🧠 Tư duy phân tích: Không chỉ phát hiện lỗi, mà tìm được nguyên nhân và giải pháp từ gốc
🤝 EQ & giao tiếp: Biết làm việc với các bên để giải quyết vấn đề thay vì chỉ “bắt lỗi” nhau
🚀 Tư duy lãnh đạo: Chủ động dẫn dắt, ra quyết định và tạo ảnh hưởng cho đội ngũ
⚡️ Quản trị bản thân: Giữ sự tỉnh táo và hiệu suất khi áp lực chất lượng, tiến độ liên tục đè lên vai

Nếu bạn đang làm QA/QC, Tester hoặc chuẩn bị bước lên vị trí Lead/Manager, có lẽ đã đến lúc không chỉ nâng cấp chuyên môn, mà phải nâng cấp tư duy lãnh đạo.

🎯 TALKSHOW: BE THE TRUE LEADER – LEADER THÔNG THÁI THỜI ĐẠI MỚI
📍 Online qua Zoom
🎁 Miễn phí 100%

👉 Một buổi chia sẻ để nhìn lại: Điều gì thực sự giúp QA/QC phát triển bền vững trong thời đại AI?

Link đăng ký dưới comment.`
  },
  {
    id: 'bm-threads-1',
    platform: 'Threads',
    category: 'Bài Đăng Tự Sự',
    title: 'Mẫu Threads: Nhìn lại hành trình áp lực tuổi 20-30',
    tags: ['Threads', 'Storytelling', '20-30t', 'Tự sự'],
    keyInsight: 'Ngắt dòng ngắn, tự nhiên, chạm vào cảm xúc FOMO và hoang mang nghề nghiệp.',
    content: `Có những ngày tan làm lúc 7h tối, ngồi ở ngã tư kẹt xe tự nhiên thấy mình trống rỗng.
Không phải vì công việc quá tệ, mà vì không biết 2 năm nữa mình sẽ ở đâu.
Nhìn bạn bè cùng lứa ai cũng có vẻ thành công, tự dưng áp lực vô hình đè nặng.

Nhưng sau này mình mới nhận ra: Chạy theo tốc độ của người khác chỉ làm mình kiệt sức.
Hiểu rõ nhịp độ và thế mạnh cốt lõi của chính mình mới là cách bền vững nhất.

Nếu bạn cũng đang loay hoay trong khoảng thời gian này, mình có 1 bài đánh giá định hướng 1-1 khá hay, bạn nào cần thì nhắn mình nhé.`
  },
  {
    id: 'bm-fb-longform-creator-wellbeing',
    platform: 'Facebook',
    category: 'Bài Viết Facebook Long-Form (Dự Án Cộng Đồng)',
    title: 'Facebook Long-Form: Dân Content Duy Trì Cảm Hứng & Test Sức Khỏe Tinh Thần WHO-5',
    tags: ['Facebook', 'Long-form', 'Dân Content', 'Well-being', 'Phi lợi nhuận'],
    keyInsight: 'Mẫu chuẩn bài viết Facebook dài: Hook in hoa giật tít chân thật -> Thấu hiểu nỗi đau nghề nghiệp -> Khẳng định dự án cộng đồng phi lợi nhuận (không bán khóa học, không lùa gà) -> Kêu gọi làm bài test WHO-5 -> Dẫn link ở bình luận ghim mồi.',
    firstCommentSeed: `Link bài test kiểm tra sức khỏe thể chất & tinh thần chuẩn y khoa WHO-5 ở đây nhé anh em: https://tally.so/r/wellbeing-test (Hoàn toàn miễn phí, làm xong có bác sĩ hỗ trợ giải đáp 1-1 nha mọi người ơi ❤️)`,
    content: `Sáng tạo hết mình, bay bổng cùng ý tưởng: Dân Content ĐANG DUY TRÌ nguồn cảm hứng NHƯ THẾ NÀO?

Làm công việc sáng tạo hay tự do nhận dự án thực sự mang lại sự hứng khởi rất lớn. Khi cảm xúc thăng hoa, tâm trí thoải mái thì ý tưởng tuôn chảy cực kỳ mượt mà. Tuy nhiên, muốn giữ được nguồn cảm hứng dồi dào và tư duy sáng tạo sắc bén lâu dài, bệ phóng quan trọng nhất chính là một cơ thể khỏe mạnh cùng một tinh thần thật thảnh thơi.

Nhận thấy việc nuôi dưỡng cảm xúc và tái tạo năng lượng là chìa khóa vàng cho anh em làm sáng tạo, mình cùng đồng đội làm một dự án cộng đồng hoàn toàn phi lợi nhuận. Mục đích thuần túy là muốn chia sẻ giá trị, đồng hành cùng anh em để giữ lửa nghề bền bỉ hơn. Mình khẳng định luôn là không bán khóa học, không PR lùa gà hay kinh doanh sản phẩm gì ở đây hết nhé, ai nghĩ vậy thì lướt qua giùm cho đỡ mất thời gian đôi bên ạ.

Kỳ nghỉ lễ 2/9 này là cơ hội tuyệt vời để dân sáng tạo mình chậm lại một chút, refresh lại tâm trí và nạp đầy pin cho những ý tưởng bứt phá sắp tới.

Bên mình đang triển khai bài test kiểm tra sức khỏe thể chất & tinh thần chuẩn y khoa theo bộ chỉ số Well-being (WHO-5). Link bài đánh giá mình để ngay dưới phần bình luận, anh em cứ làm thử để lắng nghe lại cảm xúc cá nhân xem sao nhé. Nếu kết quả phù hợp, bên mình sẽ hỗ trợ giải đáp chuyên sâu cùng sự tư vấn từ bác sĩ để giúp anh em tối ưu lại nhịp sinh hoạt và duy trì phong độ sáng tạo tốt nhất.

Mn nào muốn tranh thủ đợt nghỉ này làm mới lại nguồn năng lượng sáng tạo thì ghé xuống bình luận trải nghiệm thử nhé!`
  },
  {
    id: 'bm-linkedin-longform-thought-leadership',
    platform: 'LinkedIn',
    category: 'Bài Viết LinkedIn Long-Form (Thought Leadership)',
    title: 'LinkedIn Long-Form: Nghịch Lý Giữ Chân Nhân Tài & Bẫy "Càng Kiểm Soát Càng Mất Người"',
    tags: ['LinkedIn', 'Long-form', 'Thought Leadership', 'HRBP', 'Quản trị nhân sự', 'Leadership'],
    keyInsight: 'Chuẩn bài viết LinkedIn Viral: 3 dòng đầu mở nút "...see more" -> Case study từ chức bất ngờ -> Phân tích 3 rào cản gốc rễ quản trị -> Framework 3 trụ cột People-First -> Câu hỏi mở kích hoạt tranh luận chuyên môn -> Link tài liệu ở First Comment.',
    firstCommentSeed: `P/S: Với anh/chị Leader hoặc HRBP đang quan tâm đến bộ chỉ số đo lường sức khỏe tổ chức & khung đánh giá Well-being nhân sự, em xin phép để link tài liệu chi tiết tại đây nhé: https://tally.so/r/leadership-assessment (Hoàn toàn mở và có hỗ trợ trao đổi 1-1 cho các Case Study khó ạ).`,
    content: `Nhân sự giỏi không rời bỏ công ty vì thiếu KPI.
Họ rời đi khi nhận ra: Sự tận tâm của mình chỉ được đổi lại bằng những quy trình kiểm soát ngày càng nghẹt thở.

Tuần trước, tôi nhận được tin nhắn từ một bạn Senior Lead 6 năm kinh nghiệm xin nghỉ việc đột ngột.
Bạn ấy là người luôn đạt 120% hiệu suất, gánh team qua những đợt khủng hoảng lớn nhất.
Khi sếp hỏi lý do: "Em thấy mệt và muốn nghỉ ngơi."

Nhưng khi ngồi trò chuyện 1-on-1 riêng, sự thật hoàn toàn khác:
"Anh ơi, em không sợ cực. Em chỉ sợ cảm giác mỗi ngày đi làm như một chiếc máy chấm công. Mọi ý kiến cải tiến đều bị gạt đi vì 'chưa có trong tiền lệ', và thời gian làm báo cáo giải trình còn nhiều hơn thời gian giải quyết vấn đề cho khách hàng."

Trong thời đại AI và thị trường cạnh tranh khốc liệt ngày nay, rất nhiều nhà quản lý đang vô tình rơi vào chiếc bẫy: CÀNG LO LẮNG VỀ NĂNG SUẤT -> CÀNG XIẾT CHẶT KIỂM SOÁT -> NHÂN TÀI CÀNG CẠN KIỆT NĂNG LƯỢNG VÀ RỜI ĐI.

Sau nhiều năm đồng hành và cố vấn cho các tổ chức, tôi đúc kết ra 3 nguyên tắc sống còn để giữ lửa cho đội ngũ:

1. QUẢN TRỊ NĂNG LƯỢNG, ĐỪNG QUẢN TRỊ THỜI GIAN
Một nhân viên ngồi 10 tiếng tại bàn làm việc với tinh thần kiệt quệ sẽ tạo ra kết quả tệ hơn một người làm việc 6 tiếng với sự tập trung cao độ và tâm trí thoải mái. Tổ chức thông thái đo lường giá trị tạo ra (Impact), không đếm giờ gõ phím.

2. TẠO KHÔNG GIAN AN TOÀN TÂM LÝ (PSYCHOLOGICAL SAFETY)
Đội ngũ chỉ dám sáng tạo và đột phá khi họ không sợ bị trừng phạt vì một lỗi sai thử nghiệm. Nếu mỗi lần đề xuất ý tưởng mới đều bị bắt bẻ từng lỗi nhỏ, người giỏi nhất sẽ chọn giải pháp an toàn nhất: Im lặng và làm đối phó.

3. ĐỒNG HÀNH VÌ SỰ PHÁT TRIỂN DÀI HẠN CỦA CON NGƯỜI
Thay vì chỉ hỏi "Tuần này em làm được bao nhiêu việc?", một người Leader thực thụ sẽ hỏi: "Dự án này có đang giúp em tiến gần hơn đến mục tiêu nghề nghiệp của mình không? Anh/chị có thể hỗ trợ gì để gỡ rào cản cho em?"

Giữ chân nhân tài chưa bao giờ là bài toán về mức lương cao nhất, mà là tạo ra một môi trường nơi họ cảm thấy giá trị của mình được tôn trọng và tài năng được chắp cánh.

Anh/chị Leader và các đồng nghiệp HRBP nghĩ sao về vấn đề này?
Trong bối cảnh hiện tại, đâu là rào cản lớn nhất mà anh/chị đang gặp phải khi xây dựng văn hóa gắn kết cho đội ngũ?

Rất mong được lắng nghe góc nhìn thực chiến từ mọi người ở phần bình luận bên dưới.`
  }
];
